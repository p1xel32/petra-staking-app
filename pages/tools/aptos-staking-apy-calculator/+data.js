// File: pages/tools/aptos-staking-apy-calculator/+data.js
import * as aptosService from '../../../src/services/aptosService.server.js';

export async function data() {
  try {
    console.log("Fetching data for APY Calculator...");
    const [defaultApy, aptPriceUSD] = await Promise.all([
      aptosService.getDefaultApy(),
      aptosService.getAptPrice()
    ]);
    
    return { defaultApy, aptPriceUSD, error: null };
  } catch (error) {
    console.error("Failed to fetch data for APY Calculator:", error.message);
    return { 
      defaultApy: null, 
      aptPriceUSD: null, 
      error: `Failed to load required data: ${error.message}`
    };
  }
}