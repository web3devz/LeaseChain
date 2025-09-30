import React, { useState, useEffect, useCallback } from 'react';
import { Upload, DollarSign, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { createRental, getUserNFTs, mintTestNFT, debugNFTContract, checkReactiveConnection } from '../api/leasechain';

function CreateRental({ account, chainId }) {
  const [formData, setFormData] = useState({
    tokenId: '',
    pricePerDay: '',
    duration: '86400' // 1 day in seconds
  });
  
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [userNFTs, setUserNFTs] = useState([]);
  const [selectedNFT, setSelectedNFT] = useState(null);

  const loadUserNFTs = useCallback(async () => {
    if (!account || !chainId) return;
    
    try {
      setLoading(true);
      const nfts = await getUserNFTs(account, chainId);
      setUserNFTs(nfts);
    } catch (error) {
      console.error('Error loading user NFTs:', error);
    } finally {
      setLoading(false);
    }
  }, [account, chainId]);

  useEffect(() => {
    if (account && chainId) {
      loadUserNFTs();
    }
  }, [account, chainId, loadUserNFTs]);

  const handleMintTestNFT = async () => {
    if (!account) {
      alert('Please connect your wallet');
      return;
    }

    setTxLoading(true);
    try {
      const result = await mintTestNFT(chainId);
      if (result.success) {
        alert(`Test NFT minted successfully! Token ID: ${result.tokenId}\n\nTransaction: ${result.txHash}\n\nRefreshing your NFT list in 2 seconds...`);
        // Wait a bit for blockchain state to update before refreshing
        setTimeout(() => {
          console.log('Refreshing NFT list after mint...');
          loadUserNFTs();
        }, 2000);
      } else {
        alert(`Error minting NFT: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setTxLoading(false);
    }
  };

  const handleDebugNFTs = async () => {
    if (!account) {
      alert('Please connect your wallet');
      return;
    }

    console.log('=== DEBUG: Checking NFT contract state ===');
    await debugNFTContract(account, chainId);
    
    console.log('\n=== DEBUG: Checking Reactive connection ===');
    await checkReactiveConnection(chainId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNFTSelect = (nft) => {
    setSelectedNFT(nft);
    setFormData(prev => ({
      ...prev,
      tokenId: nft.tokenId.toString()
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!account) {
      alert('Please connect your wallet');
      return;
    }

    if (!formData.tokenId || !formData.pricePerDay || !formData.duration) {
      alert('Please fill in all fields');
      return;
    }

    setTxLoading(true);
    
    try {
      const result = await createRental(
        parseInt(formData.tokenId),
        formData.pricePerDay,
        parseInt(formData.duration),
        chainId
      );

      if (result.success) {
        alert('Rental created successfully!');
        
        // Reset form
        setFormData({
          tokenId: '',
          pricePerDay: '',
          duration: '86400'
        });
        setSelectedNFT(null);
        loadUserNFTs(); // Refresh to remove the listed NFT
      } else {
        alert(`Error creating rental: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setTxLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  if (!account) {
    return (
      <div className="bg-white/5 backdrop-blur-lg p-8 rounded-xl border border-white/10 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Wallet Not Connected</h3>
        <p className="text-gray-400">Please connect your wallet to create rentals</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Create NFT Rental</h1>
        <p className="text-gray-300">List your NFTs for rent and earn passive income</p>
      </div>

      {/* Mint Test NFT Section */}
      <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4">Need a Test NFT?</h2>
        <p className="text-gray-400 mb-4">
          Don't have any NFTs? Mint a test NFT to try out the rental functionality.
        </p>
        <button
          onClick={handleMintTestNFT}
          disabled={txLoading}
          className="bg-purple-500/20 hover:bg-purple-500/30 px-6 py-3 rounded-lg border border-purple-500/30 text-purple-400 transition-colors disabled:opacity-50"
        >
          {txLoading ? 'Minting...' : 'Mint Test NFT'}
        </button>
      </div>

      {/* Your NFTs Section */}
      <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Your NFTs</h2>
          <div className="flex space-x-2">
            <button
              onClick={loadUserNFTs}
              disabled={loading}
              className="bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg border border-blue-500/30 text-blue-400 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Loading...' : 'Refresh'}</span>
            </button>
            <button
              onClick={handleDebugNFTs}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 px-4 py-2 rounded-lg border border-yellow-500/30 text-yellow-400 transition-colors flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Debug</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading your NFTs...</p>
          </div>
        ) : userNFTs.length === 0 ? (
          <div className="text-center py-8">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No NFTs Found</h3>
            <p className="text-gray-400">You don't have any NFTs in your wallet yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userNFTs.map((nft) => (
              <NFTCard
                key={nft.tokenId}
                nft={nft}
                selected={selectedNFT?.tokenId === nft.tokenId}
                onSelect={() => handleNFTSelect(nft)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Rental Form */}
      {selectedNFT && (
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-6">Rental Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price per Day (ETH)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="pricePerDay"
                    value={formData.pricePerDay}
                    onChange={handleInputChange}
                    step="0.001"
                    min="0"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                    placeholder="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rental Duration
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="3600">1 Hour</option>
                    <option value="86400">1 Day</option>
                    <option value="604800">1 Week</option>
                    <option value="2592000">1 Month</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg p-4 rounded-lg border border-white/10">
              <h3 className="text-lg font-medium text-white mb-2">Rental Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>NFT Token ID:</span>
                  <span>#{selectedNFT.tokenId}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Price per Day:</span>
                  <span>{formData.pricePerDay || '0'} ETH</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Duration:</span>
                  <span>{formatDuration(parseInt(formData.duration))}</span>
                </div>
                <div className="flex justify-between text-white font-medium pt-2 border-t border-white/10">
                  <span>Total Rental Value:</span>
                  <span>
                    {(parseFloat(formData.pricePerDay || 0) * (parseInt(formData.duration) / 86400)).toFixed(4)} ETH
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={txLoading || !formData.pricePerDay}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {txLoading ? 'Creating Rental...' : 'Create Rental'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// NFT Card Component
function NFTCard({ nft, selected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
        selected
          ? 'bg-blue-500/20 border-blue-500/50'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      <div className="text-center">
        <div className="w-full h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg mb-3 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">#{nft.tokenId}</span>
        </div>
        <h3 className="text-white font-medium">NFT #{nft.tokenId}</h3>
        {nft.tokenURI && (
          <p className="text-gray-400 text-xs mt-1 truncate">{nft.tokenURI}</p>
        )}
        {selected && (
          <div className="flex items-center justify-center mt-2 text-blue-400">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">Selected</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateRental;
