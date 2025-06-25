// File: pages/tools/aptos-staking-lockup-visualizer/+data.js
import * as aptosService from '../../../src/services/aptosService.server.js';

const TARGET_VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';

export async function data() {
  try {
    console.log("Fetching data for Lockup Visualizer...");
    const [stakingConfig, epochTiming, validatorPoolInfo] = await Promise.all([
      aptosService.getStakingConfig(),
      aptosService.getEpochTiming(),
      aptosService.getValidatorPoolInfo(TARGET_VALIDATOR_POOL_ADDRESS)
    ]);
    
    return { stakingConfig, epochTiming, validatorPoolInfo, error: null };
  } catch (error) {
    console.error("CRITICAL: Failed to fetch data for Lockup Visualizer:", error);
    return { 
      stakingConfig: null, 
      epochTiming: null, 
      validatorPoolInfo: null, 
      error: `Failed to load on-chain data: ${error.message}` 
    };
  }
}