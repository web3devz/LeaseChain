require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "fcd4986e62b02748f533c8455ace2771c23f5dac3a0c7a7a8f9dc478f236b02d";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Reactive Network
    reactive: {
      url: "https://lasna-rpc.rnk.dev/",
      chainId: 5318007,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    
    // Base Sepolia Testnet
    baseSepolia: {
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    
    // Arbitrum Sepolia Testnet
    arbitrumSepolia: {
      url: "https://arbitrum-sepolia-rpc.publicnode.com",
      chainId: 421614,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    
    // Avalanche Fuji Testnet
    avalancheFuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    
    // Sonic Testnet
    sonicTestnet: {
      url: "https://rpc.testnet.soniclabs.com",
      chainId: 14601,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    
    // BNB Smart Chain Testnet
    bnbTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    
    // Ethereum Sepolia (for testing)
    sepolia: {
      url: "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    }
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};