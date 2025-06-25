// src/services/aptosService.server.js

import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const CUSTOM_APTOS_RPC_URL = "https://fullnode.mainnet.aptoslabs.com/v1"; 

const aptosConfig = new AptosConfig({
    network: Network.MAINNET,
    fullnode: CUSTOM_APTOS_RPC_URL
});

const FRAMEWORK_ADDRESS = '0x1';
const STAKING_CONFIG_RESOURCE_TYPE = '0x1::staking_config::StakingConfig';
const BLOCK_RESOURCE_TYPE = '0x1::block::BlockResource';
const STAKE_POOL_RESOURCE_TYPE = '0x1::stake::StakePool';

// --- ДОБАВЛЕНЫ КОНСТАНТЫ ДЛЯ PYTH ---
const PYTH_APT_USD_FEED_ID = '0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5';
const PYTH_HTTP_ENDPOINT = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${PYTH_APT_USD_FEED_ID}`;


export const getStakingConfig = async () => {
  console.log("Attempting to fetch StakingConfig...");
  try {
    const client = new Aptos(aptosConfig);
    const stakingConfigData = await client.getAccountResource({
      accountAddress: FRAMEWORK_ADDRESS,
      resourceType: STAKING_CONFIG_RESOURCE_TYPE,
    });
    console.log("Successfully fetched StakingConfig.");
    return stakingConfigData;
  } catch (error) {
    console.error("CRITICAL: Error in getStakingConfig:", error);
    throw error;
  }
};

const getBlockResourceDataInternal = async () => {
  console.log("Attempting to fetch BlockResource...");
  try {
    const client = new Aptos(aptosConfig);
    const blockResourceData = await client.getAccountResource({
      accountAddress: FRAMEWORK_ADDRESS,
      resourceType: BLOCK_RESOURCE_TYPE,
    });
    console.log("Successfully fetched BlockResource.");
    return blockResourceData;
  } catch (error) {
    console.error("CRITICAL: Error in getBlockResourceDataInternal:", error);
    throw error;
  }
};

export const getDefaultApy = async () => {
  console.log("Attempting to calculate DefaultApy...");
  try {
    const stakingConfigData = await getStakingConfig(); 
    const blockInfoData = await getBlockResourceDataInternal();
    
    const rewardRateBigInt = BigInt(stakingConfigData.rewards_rate);
    const denominatorBigInt = BigInt(stakingConfigData.rewards_rate_denominator);
    const epochIntervalMicroseconds = BigInt(blockInfoData.epoch_interval);

    if (denominatorBigInt === 0n || epochIntervalMicroseconds === 0n) return 0;

    const epochIntervalSeconds = Number(epochIntervalMicroseconds / 1_000_000n);
    if (epochIntervalSeconds === 0) return 0;
    
    const epochsPerYear = 31536000 / epochIntervalSeconds;
    const ratePerEpoch = Number(rewardRateBigInt) / Number(denominatorBigInt);
    
    let calculatedGrossApyNum = (Math.pow(1 + ratePerEpoch, epochsPerYear) - 1) * 100;
    
    console.log("Successfully calculated DefaultApy:", calculatedGrossApyNum);
    return calculatedGrossApyNum;
  } catch (error) {
    console.error("CRITICAL: Error in getDefaultApy:", error);
    throw error;
  }
};

// --- ДОБАВЛЕНА НЕДОСТАЮЩАЯ ФУНКЦИЯ ---
export const getAptPrice = async () => {
  console.log("Attempting to fetch AptPrice from Pyth...");
  try {
    const res = await fetch(PYTH_HTTP_ENDPOINT);
    if (!res.ok) {
      throw new Error(`Pyth API failed with status ${res.status}`);
    }
    const data = await res.json();
    const priceData = data[0]?.price;
    const actualPrice = Number(priceData.price) * Math.pow(10, priceData.expo);
    console.log("Successfully fetched AptPrice:", actualPrice);
    return actualPrice;
  } catch (error) {
    console.error("CRITICAL: Error in getAptPrice:", error);
    throw error;
  }
};

export const getEpochTiming = async () => {
  console.log("Attempting to fetch EpochTiming...");
  try {
    const client = new Aptos(aptosConfig);
    const blockResourceData = await getBlockResourceDataInternal(); 
    const ledgerInfo = await client.getLedgerInfo();
    const epochIntervalUs = BigInt(blockResourceData.epoch_interval);
    const currentLedgerTimestampUs = BigInt(ledgerInfo.ledger_timestamp);
    const ledgerTimestampMs = Number(currentLedgerTimestampUs / 1000n);
    const epochStartUs = currentLedgerTimestampUs - (currentLedgerTimestampUs % epochIntervalUs);
    const epochEndUs = epochStartUs + epochIntervalUs;

    const epochTimingData = {
      currentEpoch: Number(ledgerInfo.epoch),
      epochStartTime: new Date(Number(epochStartUs / 1000n)),
      epochEndTime: new Date(Number(epochEndUs / 1000n)),
      epochIntervalMicroseconds: blockResourceData.epoch_interval,
      dataAsOfTimestamp: new Date(ledgerTimestampMs),
    };
    console.log("Successfully fetched EpochTiming.");
    return epochTimingData;
  } catch (err) {
    console.error("CRITICAL: Error in getEpochTiming:", err);
    throw err;
  }
};

export const getValidatorPoolInfo = async (poolAddress) => {
  console.log(`Attempting to fetch ValidatorPoolInfo for ${poolAddress}...`);
  try {
    const client = new Aptos(aptosConfig);
    const resources = await client.getAccountResources({ accountAddress: poolAddress });

    const stakePoolRes = resources.find(r => r.type === STAKE_POOL_RESOURCE_TYPE);
    const delegationPoolRes = resources.find(r => r.type.startsWith('0x1::delegation_pool::DelegationPool'));

    if (!stakePoolRes || !delegationPoolRes) {
      throw new Error(`Could not find StakePool or DelegationPool for address ${poolAddress}`);
    }

    const poolInfo = {
      poolAddress: poolAddress,
      locked_until_secs: Number(stakePoolRes.data.locked_until_secs),
      active_stake_octas: stakePoolRes.data.active?.value || '0',
      operator_commission_percentage: delegationPoolRes.data.operator_commission_percentage || '0', 
    };
    console.log("Successfully fetched ValidatorPoolInfo.");
    return poolInfo;
  } catch (error) {
    console.error(`CRITICAL: Error in getValidatorPoolInfo for ${poolAddress}:`, error);
    throw error;
  }
};