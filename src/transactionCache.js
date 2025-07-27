// Transaction cache for Vercel deployment
// This provides persistent storage for accumulated transaction counts

const PULSECHAIN_API_BASE = "https://api.scan.pulsechain.com/api/v2";
const STARTING_BLOCK = 24080721;

class TransactionCache {
  constructor() {
    this.cacheKey = 'pulsechain-transactions';
    this.lastProcessedBlockKey = 'pulsechain-last-block';
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  // Get cached data
  getCache() {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(this.cacheKey);
      const lastBlock = localStorage.getItem(this.lastProcessedBlockKey);
      
      if (cached && lastBlock) {
        const data = JSON.parse(cached);
        const timestamp = data.timestamp || 0;
        
        // Check if cache is still valid
        if (Date.now() - timestamp < this.cacheExpiry) {
          return {
            totalTransactions: data.totalTransactions || 0,
            lastProcessedBlock: parseInt(lastBlock)
          };
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }
    
    return null;
  }

  // Set cached data
  setCache(totalTransactions, lastBlock) {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = {
        totalTransactions,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
      localStorage.setItem(this.lastProcessedBlockKey, lastBlock.toString());
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  // Calculate incremental transactions efficiently using cache
  async calculateIncrementalTransactions(currentBlock) {
    const cache = this.getCache();
    
    const STARTING_TRANSACTIONS = 301259930;
    let startFrom = STARTING_BLOCK + 1;
    let accumulated = STARTING_TRANSACTIONS;
    
    if (cache && cache.lastProcessedBlock >= STARTING_BLOCK) {
      startFrom = cache.lastProcessedBlock + 1;
      accumulated = cache.totalTransactions;
      console.log('Using cache:', { accumulated, startFrom, currentBlock });
    } else {
      console.log('Starting fresh calculation from block', STARTING_BLOCK + 1);
    }
    
    if (currentBlock < startFrom) {
      return accumulated;
    }
    
    // Process new blocks since last cache
    const blocksToProcess = currentBlock - startFrom + 1;
    console.log(`Processing ${blocksToProcess} new blocks`);
    
    // Process in batches for performance
    const batchSize = 100;
    let processed = 0;
    
    for (let batchStart = startFrom; batchStart <= currentBlock; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, currentBlock);
      
      try {
        // Fetch multiple blocks at once
        const response = await fetch(
          `${PULSECHAIN_API_BASE}/blocks?type=block&from=${batchStart}&to=${batchEnd}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.items && Array.isArray(data.items)) {
            for (const block of data.items) {
              const txCount = parseInt(block.tx_count) || 0;
              accumulated += txCount;
              processed++;
            }
          }
        }
      } catch (error) {
        console.warn(`Error processing batch ${batchStart}-${batchEnd}:`, error.message);
      }
    }
    
    console.log(`Processed ${processed} new blocks, total: ${accumulated}`);
    
    // Cache the results
    this.setCache(accumulated, currentBlock);
    
    return accumulated;
  }
}

// Export singleton instance
export const transactionCache = new TransactionCache();