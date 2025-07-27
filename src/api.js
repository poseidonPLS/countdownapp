// Updated to use VPS API endpoint instead of client-side calculations
const VPS_API_URL = "https://data.pulsex.win/totaltxns.json";

// Fetch data from VPS API
export const fetchCurrentStats = async () => {
  try {
    const response = await fetch(VPS_API_URL);
    if (!response.ok) throw new Error('Failed to fetch stats');
    const data = await response.json();
    
    if (data.status === "success") {
      return {
        currentBlock: data.data.current_block,
        currentTransactions: data.data.total_transactions,
        networkUtilization: 0, // Not provided by VPS API
        gasPrice: 0 // Not provided by VPS API
      };
    } else {
      throw new Error(data.message || 'API error');
    }
  } catch (error) {
    console.error('Error fetching VPS API:', error);
    return null;
  }
};

// Calculate PulseChain statistics using VPS data
export const calculatePulseChainStats = (currentData, forkData) => {
  const blocksSinceFork = currentData.currentBlock - forkData.block;
  
  return {
    currentBlocks: currentData.currentBlock,
    blocksSinceFork,
    totalPulseChainTransactions: currentData.currentTransactions,
    networkUtilization: 0,
    gasPrice: 0,
    forkBlock: forkData.block
  };
};

// Simplified function - VPS handles the calculation
export const calculateIncrementalTransactions = async () => {
  // VPS API already provides the total, no need for client calculation
  return 0;
};

// Placeholder functions - no longer needed with VPS
export const fetchBlockTransactions = async (blockNumber) => {
  return 0;
};

export const fetchRecentBlockTransactions = async (fromBlock, toBlock) => {
  return 0;
};