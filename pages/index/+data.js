// File: pages/index/+data.js
import * as aptosService from '../../src/services/aptosService.server.js';

const TARGET_VALIDATOR_POOL_ADDRESS = '0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb';

export async function data() {
  try {
    console.log("Fetching data for Index Page...");
    const [poolInfo, apy] = await Promise.all([
      aptosService.getValidatorPoolInfo(TARGET_VALIDATOR_POOL_ADDRESS),
      aptosService.getDefaultApy()
    ]);

    return {
      serverFetchedPoolInfo: poolInfo,
      serverFetchedApy: apy,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching data for Index Page:", error.message);
    return {
      serverFetchedPoolInfo: null,
      serverFetchedApy: null,
      error: "Failed to load validator data.",
    };
  }
}