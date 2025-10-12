// Contract addresses for different networks
export const CONTRACTS = {
  // Base Sepolia Testnet
  84532: {
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia-explorer.base.org",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    contracts: {
      LeaseChain: "0x371755C9D14b9dEa32c3b6D5e8e8639d4C202Fa2",
      TestNFT: "0xa49a63864f94d42904596879Cbb9F271348489cC",
    }
  },
  // Arbitrum Sepolia Testnet
  421614: {
    name: "Arbitrum Sepolia",
    rpcUrl: "https://arbitrum-sepolia-rpc.publicnode.com",
    blockExplorer: "https://sepolia.arbiscan.io",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH", 
      decimals: 18,
    },
    contracts: {
      LeaseChain: "0xB5a54114Cd22924070e4850f9039eb6b3845bA2F",
      TestNFT: "0xB78862269a41b78DdB59cB888b0e6C3BC4Aca79d",
    }
  },
  // Avalanche Fuji Testnet
  43113: {
    name: "Avalanche Fuji",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    blockExplorer: "https://testnet.snowtrace.io",
    nativeCurrency: {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18,
    },
    contracts: {
      LeaseChain: "0xE099C33c50F085357A6Eb5A6Fe436ba3CD0afc06",
      TestNFT: "0xb30fC27A86Aaa9Ad8D7593b137AD4990e5e8E141",
    }
  },
  // Sonic Testnet
  64165: {
    name: "Sonic Testnet",
    rpcUrl: "https://rpc.testnet.soniclabs.com",
    blockExplorer: "https://testnet.soniclabs.com",
    nativeCurrency: {
      name: "S",
      symbol: "S",
      decimals: 18,
    },
    contracts: {
      LeaseChain: "0xd83Eac9830b0C28248618Ed0a6098d891F18F2f0",
      TestNFT: "0x5938191577f48A6b09c802847fF2E2639763a648",
    }
  },
  // BNB Testnet
  97: {
    name: "BNB Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    blockExplorer: "https://testnet.bscscan.com",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    contracts: {
      LeaseChain: "0x39E98a358dE86114465Cd39DE945e07B1443C94F",
      TestNFT: "0x82A0fE389ac95099e982bB1F04f0B028019AC40f",
    }
  }
};

// Reactive Network Configuration (with RVM Support)
export const REACTIVE_NETWORK = {
  chainId: 5318007,
  name: "Reactive Lasna",
  rpcUrl: "https://lasna-rpc.rnk.dev/",
  blockExplorer: "https://lasna.reactscan.net",
  nativeCurrency: {
    name: "REACT",
    symbol: "REACT",
    decimals: 18,
  },
  contracts: {
    LeaseChainReactive: "0xb4336730c7EE24B4Ca466e880277BF95Aff82B04", // FRESH: All chains deployed + Callback emission
    SystemContract: "0x0000000000000000000000000000000000fffFfF" // Official system contract address
  },
  faucet: {
    address: "0x9b9BB25f1A81078C544C829c5EB7822d747Cf434",
    chain: "Ethereum Sepolia",
    method: "Send SepETH to receive REACT (1 SepETH = 100 REACT, max 5 SepETH)"
  },
  features: [
    "RVM Transaction Scheduling",
    "Custom Transaction Creation",
    "Batch Transaction Processing",
    "Multi-Chain Monitoring",
    "Automatic NFT Reclaim",
    "Callback Execution"
  ]
};

// Default supported chain (Base Sepolia)
export const DEFAULT_CHAIN_ID = 84532;

// Get contract address for specific chain
export const getContractAddress = (chainId, contractName) => {
  const network = CONTRACTS[chainId];
  if (!network || !network.contracts[contractName]) {
    throw new Error(`Contract ${contractName} not found for chain ${chainId}`);
  }
  return network.contracts[contractName];
};

// Get network info
export const getNetworkInfo = (chainId) => {
  return CONTRACTS[chainId] || null;
};

// Get supported chain IDs
export const getSupportedChainIds = () => {
  return Object.keys(CONTRACTS).map(id => parseInt(id));
};
