import React, { useState } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { CONTRACTS } from '../config/contracts';

function NetworkSwitcher({ currentChainId, onNetworkSwitch }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const supportedNetworks = Object.entries(CONTRACTS).map(([chainId, config]) => ({
    chainId: parseInt(chainId),
    ...config
  }));

  const currentNetwork = currentChainId ? supportedNetworks.find(network => network.chainId === currentChainId) : null;

  const handleNetworkClick = async (network) => {
    if (network.chainId === currentChainId) {
      setIsOpen(false);
      return;
    }

    try {
      if (!window.ethereum) {
        alert('Please install MetaMask to switch networks');
        return;
      }

      // Try to switch to the network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${network.chainId.toString(16)}` }],
        });
      } catch (switchError) {
        // Network doesn't exist, try to add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${network.chainId.toString(16)}`,
              chainName: network.name,
              rpcUrls: [network.rpcUrl],
              nativeCurrency: network.nativeCurrency,
              blockExplorerUrls: [network.blockExplorer],
            }],
          });
        } else {
          throw switchError;
        }
      }

      if (onNetworkSwitch) {
        onNetworkSwitch(network.chainId);
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      alert('Failed to switch network. Please try manually in MetaMask.');
    }
    
    setIsOpen(false);
  };

  const getNetworkColor = (chainId) => {
    switch (chainId) {
      case 84532: return 'text-blue-400 bg-blue-500/20 border-blue-500/30'; // Base
      case 421614: return 'text-purple-400 bg-purple-500/20 border-purple-500/30'; // Arbitrum
      case 43113: return 'text-red-400 bg-red-500/20 border-red-500/30'; // Avalanche
      case 14601: return 'text-green-400 bg-green-500/20 border-green-500/30'; // Sonic
      case 97: return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'; // BNB
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  if (!currentNetwork) {
    return (
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>{currentChainId ? 'Unsupported Network' : 'Select Network'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-64 bg-gray-800/95 backdrop-blur-lg border border-gray-600/50 rounded-xl shadow-xl z-50">
              <div className="p-2">
                <div className="px-3 py-2 text-sm text-gray-300 border-b border-gray-600/50">
                  Switch to supported network:
                </div>
                {supportedNetworks.map((network) => (
                  <button
                    key={network.chainId}
                    onClick={() => handleNetworkClick(network)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-white text-sm">{network.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${getNetworkColor(currentNetwork.chainId)} hover:opacity-80`}
      >
        <Globe className="w-4 h-4" />
        <span>{currentNetwork.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-gray-800/95 backdrop-blur-lg border border-gray-600/50 rounded-xl shadow-xl z-50">
            <div className="px-4 py-2 text-sm font-medium text-gray-300 border-b border-gray-600/50">
              Switch Network
            </div>
            
            {supportedNetworks.map((network) => (
              <button
                key={network.chainId}
                onClick={() => handleNetworkClick(network)}
                className="w-full px-4 py-3 text-left hover:bg-gray-700/50 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getNetworkColor(network.chainId).split(' ')[1]}`} />
                  <div>
                    <div className="font-medium text-white">{network.name}</div>
                    <div className="text-xs text-gray-400">{network.nativeCurrency.symbol}</div>
                  </div>
                </div>
                
                {network.chainId === currentChainId && (
                  <Check className="w-4 h-4 text-green-400" />
                )}
              </button>
            ))}
            
            <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-700 mt-2">
              All networks have deployed LeaseChain contracts
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NetworkSwitcher;