import { ethers } from 'ethers';
import { CONTRACTS, getContractAddress, DEFAULT_CHAIN_ID } from '../config/contracts';
import LeaseChainABI from '../abis/LeaseChain.json';
import TestNFTABI from '../abis/TestNFT.json';

// Contract instances cache
let contractsCache = {};

// Get provider
export const getProvider = (chainId = DEFAULT_CHAIN_ID) => {
  const network = CONTRACTS[chainId];
  if (!network) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  
  return new ethers.JsonRpcProvider(network.rpcUrl);
};

// Get signer from wallet
export const getSigner = async (chainId = null) => {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask');
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // Request account access
  await provider.send("eth_requestAccounts", []);
  
  // Get current network
  const network = await provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  // If specific chain requested, try to switch
  if (chainId && currentChainId !== chainId) {
    // Check if we support this chain
    if (!CONTRACTS[chainId]) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError) {
      // Network doesn't exist, try to add it
      if (switchError.code === 4902) {
        const networkConfig = CONTRACTS[chainId];
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${chainId.toString(16)}`,
            chainName: networkConfig.name,
            rpcUrls: [networkConfig.rpcUrl],
            nativeCurrency: networkConfig.nativeCurrency,
            blockExplorerUrls: [networkConfig.blockExplorer],
          }],
        });
      } else {
        throw switchError;
      }
    }
  }
  
  return provider.getSigner();
};

// Get current chain ID from wallet
export const getCurrentChainId = async () => {
  if (!window.ethereum) {
    return null;
  }
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
};

// Get LeaseChain contract instance
export const getLeaseChainContract = async (chainId = null, signer = null) => {
  // If no chainId provided, get current one
  if (!chainId) {
    chainId = await getCurrentChainId();
  }
  
  if (!chainId || !CONTRACTS[chainId]) {
    throw new Error(`Unsupported or unknown chain ID: ${chainId}`);
  }
  
  const cacheKey = `LeaseChain_${chainId}_${signer ? 'signer' : 'provider'}`;
  
  if (contractsCache[cacheKey]) {
    return contractsCache[cacheKey];
  }
  
  const contractAddress = getContractAddress(chainId, 'LeaseChain');
  const providerOrSigner = signer || getProvider(chainId);
  
  const contract = new ethers.Contract(contractAddress, LeaseChainABI.abi, providerOrSigner);
  contractsCache[cacheKey] = contract;
  
  return contract;
};

// Get TestNFT contract instance
export const getTestNFTContract = async (chainId = null, signer = null) => {
  // If no chainId provided, get current one
  if (!chainId) {
    chainId = await getCurrentChainId();
  }
  
  if (!chainId || !CONTRACTS[chainId]) {
    throw new Error(`Unsupported or unknown chain ID: ${chainId}`);
  }
  
  const cacheKey = `TestNFT_${chainId}_${signer ? 'signer' : 'provider'}`;
  
  if (contractsCache[cacheKey]) {
    return contractsCache[cacheKey];
  }
  
  const contractAddress = getContractAddress(chainId, 'TestNFT');
  const providerOrSigner = signer || getProvider(chainId);
  
  const contract = new ethers.Contract(contractAddress, TestNFTABI.abi, providerOrSigner);
  contractsCache[cacheKey] = contract;
  
  return contract;
};

// Helper function to format wei to ether
export const formatEther = (wei) => {
  return ethers.formatEther(wei);
};

// Helper function to parse ether to wei
export const parseEther = (ether) => {
  return ethers.parseEther(ether.toString());
};

// Helper function to get transaction receipt
export const waitForTransaction = async (txHash, chainId = DEFAULT_CHAIN_ID) => {
  const provider = getProvider(chainId);
  return provider.waitForTransaction(txHash);
};

// Helper function to get current block timestamp
export const getCurrentBlockTimestamp = async (chainId = DEFAULT_CHAIN_ID) => {
  const provider = getProvider(chainId);
  const block = await provider.getBlock('latest');
  return block.timestamp;
};

// Format duration for display
export const formatDuration = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Clear contracts cache (useful for network switches)
export const clearContractsCache = () => {
  contractsCache = {};
};