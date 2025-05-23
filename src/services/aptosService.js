// src/services/aptosService.js
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const CUSTOM_APTOS_RPC_URL = "https://fullnode.mainnet.aptoslabs.com/v1"; 

const aptosConfig = new AptosConfig({ 
    network: Network.MAINNET,
    fullnode: CUSTOM_APTOS_RPC_URL
});
const client = new Aptos(aptosConfig);

// Constants
const FRAMEWORK_ADDRESS = '0x1'; 
const STAKING_CONFIG_RESOURCE_TYPE = '0x1::staking_config::StakingConfig';
const BLOCK_RESOURCE_TYPE = '0x1::block::BlockResource'; // For epoch_interval

// Constants for Price from Pyth Network
const PYTH_APT_USD_FEED_ID = '0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5';
const PYTH_HTTP_ENDPOINT = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${PYTH_APT_USD_FEED_ID}`;


export const getDefaultApy = async () => {
  try {
    const stakingConfigRes = await client.getAccountResource({
      accountAddress: FRAMEWORK_ADDRESS,
      resourceType: STAKING_CONFIG_RESOURCE_TYPE,
    });
    const blockInfoRes = await client.getAccountResource({ // Fetches 0x1::block::BlockResource
      accountAddress: FRAMEWORK_ADDRESS,
      resourceType: BLOCK_RESOURCE_TYPE, 
    });

    if (!stakingConfigRes || !blockInfoRes || blockInfoRes.epoch_interval === undefined) {
      console.error("aptosService: Failed to fetch StakingConfig or complete BlockResource for APY.");
      throw new Error("aptosService: Could not fetch necessary on-chain data for APY calculation.");
    }
    
    const stakingConfigData = stakingConfigRes;
    const blockInfoData = blockInfoRes;

    if (
      stakingConfigData.rewards_rate === undefined ||
      stakingConfigData.rewards_rate_denominator === undefined
    ) {
      console.error("aptosService: Required fields for APY calculation are missing from StakingConfig.", { stakingConfigData });
      throw new Error("aptosService: Missing APY fields in StakingConfig.");
    }

    const rewardRateBigInt = BigInt(stakingConfigData.rewards_rate);
    const denominatorBigInt = BigInt(stakingConfigData.rewards_rate_denominator);
    const epochIntervalMicroseconds = BigInt(blockInfoData.epoch_interval);

    if (denominatorBigInt === 0n || epochIntervalMicroseconds === 0n) {
      console.warn("aptosService: Invalid APY inputs (zero denominator or epoch).");
      return 0;
    }

    const epochIntervalSeconds = Number(epochIntervalMicroseconds / 1_000_000n);
    if (epochIntervalSeconds === 0) {
        console.warn("aptosService: Calculated epochIntervalSeconds is zero for APY.");
        return 0;
    }
    const epochsPerYear = 31536000 / epochIntervalSeconds;
    const ratePerEpoch = Number(rewardRateBigInt) / Number(denominatorBigInt);
    
    let calculatedGrossApyNum = 0;
    if (ratePerEpoch >= 0) {
        calculatedGrossApyNum = (Math.pow(1 + ratePerEpoch, epochsPerYear) - 1) * 100;
    }

    return calculatedGrossApyNum;
  } catch (error) {
    console.error("aptosService: Error in getDefaultApy:", error.message, error);
    throw error;
  }
};

export const getAptPrice = async () => {
  try {
    const res = await fetch(PYTH_HTTP_ENDPOINT);
    if (!res.ok) {
        throw new Error(`aptosService: Pyth Hermes API request failed with status ${res.status}`);
    }
    const data = await res.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("aptosService: No price data returned from Pyth Hermes API.");
    }

    const priceData = data[0]?.price;
    if (!priceData || priceData.price === undefined || priceData.expo === undefined) {
      console.error("aptosService: Invalid price data structure from Pyth Hermes API.", data[0]);
      throw new Error("aptosService: Invalid price data from Pyth Hermes API.");
    }

    const actualPrice = Number(priceData.price) * Math.pow(10, priceData.expo);
    return actualPrice;
  } catch (error) {
    console.error("aptosService: Error in getAptPrice (Pyth Hermes API):", error.message, error);
    throw error;
  }
};

// --- FUNCTIONS FOR LOCKUP VISUALIZER ---

export const getStakingConfig = async () => {
  try {
    const stakingConfig = await client.getAccountResource({
      accountAddress: FRAMEWORK_ADDRESS,
      resourceType: STAKING_CONFIG_RESOURCE_TYPE,
    });
    if (!stakingConfig || stakingConfig.recurring_lockup_duration_secs === undefined) {
      console.error("aptosService: StakingConfig resource not found or missing 'recurring_lockup_duration_secs'. Received:", stakingConfig);
      throw new Error("aptosService: StakingConfig resource not found or incomplete.");
    }
    return stakingConfig;
  } catch (error) {
    console.error("aptosService: Error fetching StakingConfig:", error.message, error);
    throw error;
  }
};

// getBlockResource is used internally by getEpochTiming now
const getBlockResourceInternal = async () => {
  try {
    const blockResource = await client.getAccountResource({
      accountAddress: FRAMEWORK_ADDRESS,
      resourceType: BLOCK_RESOURCE_TYPE, // 0x1::block::BlockResource
    });
    if (!blockResource || blockResource.epoch_interval === undefined) {
      console.error("aptosService: BlockResource not found or missing 'epoch_interval'. Received:", blockResource);
      throw new Error("aptosService: BlockResource not found or missing 'epoch_interval'.");
    }
    return blockResource;
  } catch (error) {
    console.error("aptosService: Error fetching BlockResource:", error.message, error);
    throw error;
  }
};

// User's provided getEpochTiming function (adapted)
export const getEpochTiming = async () => {
  try {
    const blockResource = await getBlockResourceInternal(); // Get epoch_interval
    const ledgerInfo = await client.getLedgerInfo();

    if (!ledgerInfo.epoch || !ledgerInfo.ledger_timestamp) {
        throw new Error("aptosService: Missing epoch or ledger_timestamp in ledger info.");
    }
    
    const epochIntervalUs = BigInt(blockResource.epoch_interval);
    if (epochIntervalUs === 0n) {
        throw new Error("aptosService: epoch_interval is zero, cannot calculate epoch timing.");
    }

    const currentLedgerTimestampUs = BigInt(ledgerInfo.ledger_timestamp);
    
    // Calculate epoch start: current timestamp - (current timestamp % epoch_interval)
    const epochStartUs = currentLedgerTimestampUs - (currentLedgerTimestampUs % epochIntervalUs);
    const epochEndUs = epochStartUs + epochIntervalUs;

    return {
      currentEpoch: Number(ledgerInfo.epoch),
      epochStartTime: new Date(Number(epochStartUs / 1000n)), // Convert microseconds to milliseconds for Date
      epochEndTime: new Date(Number(epochEndUs / 1000n)),   // Convert microseconds to milliseconds for Date
      epochIntervalMicroseconds: blockResource.epoch_interval, // Pass this along as it's needed
    };
  } catch (err) {
    console.error("aptosService: Failed to fetch epoch timing:", err.message, err);
    throw err;
  }
};
