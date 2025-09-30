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
      LeaseChain: "0xb30fC27A86Aaa9Ad8D7593b137AD4990e5e8E141",
      TestNFT: "0x39E98a358dE86114465Cd39DE945e07B1443C94F",
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
      LeaseChain: "0xAf7F094dc3db86995c84cd8fa7c893Eafb750286",
      TestNFT: "0xD5667e049fc5c9c9bdd6b2e31416030133839d8f",
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
      LeaseChain: "0x5938191577f48A6b09c802847fF2E2639763a648",
      TestNFT: "0xb4336730c7EE24B4Ca466e880277BF95Aff82B04",
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
      LeaseChain: "0xA3036d9Ec8D942acd976F0532cC689f1eC667111",
      TestNFT: "0x6EcbE0BDD8174ef2422182Eeb89F0857044111b4",
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
      LeaseChain: "0x58C53D54319bFCd77b6CD88EdE00c44466BDE035",
      TestNFT: "0xA3036d9Ec8D942acd976F0532cC689f1eC667111",
    }
  }
};

// Reactive Network Configuration
export const REACTIVE_NETWORK = {
  chainId: 5318007,
  name: "Reactive Network (Lasna Testnet)",
  rpcUrl: "https://kopli-rpc.reactive.network",
  blockExplorer: "https://kopli.reactscan.net",
  contracts: {
    LeaseChainReactive: "0xa20bFD6cC0A0882C16c8c989cd0A0D069aE06471",
    SystemContract: "0x0000000000000000000000000000000000fffFfF"
  }
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