import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const CUSTOM_APTOS_RPC_URL = "https://fullnode.mainnet.aptoslabs.com/v1"; 

const aptosConfig = new AptosConfig({
    network: Network.MAINNET,
    fullnode: CUSTOM_APTOS_RPC_URL
});
const client = new Aptos(aptosConfig);

const FRAMEWORK_ADDRESS = '0x1';
const STAKING_CONFIG_RESOURCE_TYPE = '0x1::staking_config::StakingConfig';
const BLOCK_RESOURCE_TYPE = '0x1::block::BlockResource';
const STAKE_POOL_RESOURCE_TYPE = '0x1::stake::StakePool';

const PYTH_APT_USD_FEED_ID = '0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5';
const PYTH_HTTP_ENDPOINT = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${PYTH_APT_USD_FEED_ID}`;

export const getStakingConfig = async () => {
  try {
    const stakingConfigData = await client.getAccountResource({
      accountAddress: FRAMEWORK_ADDRESS,
      resourceType: STAKING_CONFIG_RESOURCE_TYPE,
    });
    if (!stakingConfigData || stakingConfigData.recurring_lockup_duration_secs === undefined) {
      console.error("aptosService: StakingConfig data not found or missing 'recurring_lockup_duration_secs'. Received:", stakingConfigData);
      throw new Error("aptosService: StakingConfig data not found or incomplete.");
    }
    return stakingConfigData;
  } catch (error) {
    console.error("aptosService: Error fetching StakingConfig:", error.message, error);
    if (error.message && (error.message.includes("Resource not found") || error.toString().includes("HTTPError: 404") || error.errorCode === "resource_not_found")) {
        throw new Error(`aptosService: StakingConfig resource not found at address ${FRAMEWORK_ADDRESS}.`);
    }
    throw error;
  }
};

const getBlockResourceDataInternal = async () => {
  try {
    const blockResourceData = await client.getAccountResource({
      accountAddress: FRAMEWORK_ADDRESS,
      resourceType: BLOCK_RESOURCE_TYPE,
    });
    if (!blockResourceData || blockResourceData.epoch_interval === undefined) {
      console.error("aptosService: BlockResource data not found or missing 'epoch_interval'. Received:", blockResourceData);
      throw new Error("aptosService: BlockResource data not found or missing 'epoch_interval'.");
    }
    return blockResourceData;
  } catch (error) {
    console.error("aptosService: Error fetching BlockResource:", error.message, error);
     if (error.message && (error.message.includes("Resource not found") || error.toString().includes("HTTPError: 404") || error.errorCode === "resource_not_found")) {
        throw new Error(`aptosService: BlockResource resource not found at address ${FRAMEWORK_ADDRESS}.`);
    }
    throw error;
  }
};

export const getDefaultApy = async () => {
  try {
    const stakingConfigData = await getStakingConfig(); 
    const blockInfoData = await getBlockResourceDataInternal(); // Corrected function name

    if (!stakingConfigData || !blockInfoData || blockInfoData.epoch_interval === undefined) {
      console.error("aptosService: Failed to fetch StakingConfig or complete BlockResource for APY. StakingConfig:", stakingConfigData, "BlockInfo:", blockInfoData);
      throw new Error("aptosService: Could not fetch necessary on-chain data for APY calculation.");
    }
    
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
      return 0;
    }
    const epochIntervalSeconds = Number(epochIntervalMicroseconds / 1_000_000n);
    if (epochIntervalSeconds === 0) {
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

export const getEpochTiming = async () => {
  try {
    const blockResourceData = await getBlockResourceDataInternal(); 
    const ledgerInfo = await client.getLedgerInfo();

    if (!ledgerInfo || 
        (typeof ledgerInfo.epoch !== 'string' && typeof ledgerInfo.epoch !== 'number') || 
        (typeof ledgerInfo.ledger_timestamp !== 'string' && typeof ledgerInfo.ledger_timestamp !== 'number')) {
        console.error("aptosService: Missing or invalid epoch or ledger_timestamp in ledger info. Received:", ledgerInfo);
        throw new Error("aptosService: Missing or invalid epoch or ledger_timestamp in ledger info.");
    }
    
    const epochIntervalUs = BigInt(blockResourceData.epoch_interval);
    if (epochIntervalUs === 0n) {
        throw new Error("aptosService: epoch_interval is zero, cannot calculate epoch timing.");
    }

    const currentLedgerTimestampUs = BigInt(ledgerInfo.ledger_timestamp);
    const ledgerTimestampMs = Number(currentLedgerTimestampUs / 1000n);
    
    const epochStartUs = currentLedgerTimestampUs - (currentLedgerTimestampUs % epochIntervalUs);
    const epochEndUs = epochStartUs + epochIntervalUs;

    return {
      currentEpoch: Number(ledgerInfo.epoch),
      epochStartTime: new Date(Number(epochStartUs / 1000n)),
      epochEndTime: new Date(Number(epochEndUs / 1000n)),
      epochIntervalMicroseconds: blockResourceData.epoch_interval,
      dataAsOfTimestamp: new Date(ledgerTimestampMs),
    };
  } catch (err) {
    console.error("aptosService: Failed to fetch epoch timing:", err.message, err);
    throw err;
  }
};

export const getValidatorPoolInfo = async (poolAddress) => {
  if (!poolAddress) {
    throw new Error("aptosService: Validator pool address is required to fetch pool info.");
  }
  try {
    const poolData = await client.getAccountResource({
      accountAddress: poolAddress,
      resourceType: STAKE_POOL_RESOURCE_TYPE,
    });

    if (!poolData || poolData.locked_until_secs === undefined) {
      console.error(`aptosService: StakePool data incomplete or 'locked_until_secs' missing for ${poolAddress}. Received:`, poolData);
      throw new Error(`aptosService: StakePool data incomplete for ${poolAddress}.`);
    }
    
    return {
      poolAddress: poolAddress,
      locked_until_secs: Number(poolData.locked_until_secs),
      active_stake_octas: poolData.active?.value || '0',
    };
  } catch (error) {
    console.error(`aptosService: Error fetching StakePool for ${poolAddress}:`, error.message, error);
    if (error.message && (error.message.includes("Resource not found") || error.toString().includes("HTTPError: 404") || error.errorCode === "resource_not_found")) {
        throw new Error(`aptosService: StakePool resource type ${STAKE_POOL_RESOURCE_TYPE} not found at address ${poolAddress}.`);
    }
    throw error;
  }
};