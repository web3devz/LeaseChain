import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { 
  getAllRentals, 
  startRental, 
  manualReclaim, 
  formatRentalStatus
} from '../api/leasechain';

function RentalList({ userAddress, isConnected, chainId }) {
  const [rentals, setRentals] = useState([]);
  const [filteredRentals, setFilteredRentals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const loadRentals = useCallback(async () => {
    setLoading(true);
    try {
      const allRentals = await getAllRentals(chainId);
      console.log('Loaded rentals in RentalList:', allRentals);
      setRentals(allRentals);
    } catch (error) {
      console.error('Error loading rentals:', error);
    }
    setLoading(false);
  }, [chainId]);

  useEffect(() => {
    if (chainId) {
      loadRentals();
    }
  }, [chainId, loadRentals]);

  const filterRentals = () => {
    let filtered = rentals;
    
    console.log('Filtering rentals:', {
      totalRentals: rentals.length,
      filterStatus,
      searchTerm,
      rentals
    });
    
    if (filterStatus !== 'all') {
      const statusValue = filterStatus === 'available' ? 0 : filterStatus === 'active' ? 1 : 2;
      filtered = filtered.filter(rental => rental.status === statusValue);
      console.log('After status filter:', filtered.length, 'rentals');
    }
    
    if (searchTerm) {
      filtered = filtered.filter(rental => 
        rental.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.tokenId.toString().includes(searchTerm)
      );
      console.log('After search filter:', filtered.length, 'rentals');
    }
    
    console.log('Final filtered rentals:', filtered);
    setFilteredRentals(filtered);
  };

  useEffect(() => {
    filterRentals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentals, filterStatus, searchTerm]);

  const handleStartRental = async (rentalId) => {
    if (!isConnected) {
      alert('Please connect your wallet');
      return;
    }

    setActionLoading(prev => ({ ...prev, [rentalId]: true }));
    try {
      console.log('Current user address:', userAddress);
      const result = await startRental(rentalId);
      if (result.success) {
        alert(`Rental started successfully! Transaction: ${result.txHash}`);
        // Wait a moment for blockchain to update, then refresh
        setTimeout(() => {
          loadRentals(); // Refresh the list
        }, 2000);
      } else {
        alert(`Error starting rental: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    setActionLoading(prev => ({ ...prev, [rentalId]: false }));
  };

  const handleManualReclaim = async (rentalId) => {
    if (!isConnected) {
      alert('Please connect your wallet');
      return;
    }

    setActionLoading(prev => ({ ...prev, [rentalId]: true }));
    try {
      const result = await manualReclaim(rentalId);
      if (result.success) {
        alert(`NFT reclaimed successfully! Transaction: ${result.txHash}`);
        loadRentals(); // Refresh the list
      } else {
        alert(`Error reclaiming NFT: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    setActionLoading(prev => ({ ...prev, [rentalId]: false }));
  };

  const canUserRent = (rental) => {
    return isConnected && 
           userAddress && 
           rental.status === 0 && 
           rental.owner.toLowerCase() !== userAddress.toLowerCase();
  };

  const canUserReclaim = (rental) => {
    return isConnected && 
           userAddress && 
           rental.status === 1 && 
           rental.owner.toLowerCase() === userAddress.toLowerCase();
  };

  const formatTimeRemaining = (rental) => {
    if (rental.status !== 1) return '';
    
    const now = Math.floor(Date.now() / 1000);
    const expiry = rental.startTime + rental.duration;
    const remaining = expiry - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="bg-white/5 backdrop-blur-lg p-8 rounded-xl border border-white/10 text-center">
        <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-4 text-white">Wallet Not Connected</h3>
        <p className="text-gray-300 mb-6">
          Please connect your wallet to view rentals
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">
            NFT Rentals
          </h2>
          <button 
            onClick={loadRentals}
            disabled={loading}
            className="bg-blue-500/20 hover:bg-blue-500/30 px-6 py-3 rounded-lg border border-blue-500/30 text-blue-400 transition-colors disabled:opacity-50 disabled:scale-100 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ID, token, or address..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                className="w-full pl-10 pr-8 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all" className="bg-slate-800 text-white">All Status</option>
                <option value="available" className="bg-slate-800 text-white">Available</option>
                <option value="active" className="bg-slate-800 text-white">Active</option>
                <option value="completed" className="bg-slate-800 text-white">Completed</option>
              </select>
            </div>
          </div>
        </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading rentals...</p>
        </div>
      ) : (
        <>
          {/* Rental Grid */}
          {filteredRentals.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">No Rentals Found</h3>
              <p className="text-gray-300">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No rentals have been created yet'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRentals.map((rental) => (
                <div key={rental.id} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  {/* NFT Preview */}
                  <div className="aspect-square backdrop-blur-md bg-white/5 rounded-xl mb-4 flex items-center justify-center border border-white/10">
                    <div className="text-center">
                      <div className="w-16 h-16 backdrop-blur-sm bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg border border-white/20">
                        <span className="text-2xl font-bold text-white">#{rental.tokenId}</span>
                      </div>
                      <p className="text-sm text-gray-300">LeaseChain Test NFT</p>
                    </div>
                  </div>

                  {/* Rental Info */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Rental ID</span>
                      <span className="font-semibold text-white">#{rental.id}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Price/Day</span>
                      <span className="font-semibold text-blue-400">{rental.pricePerDay} ETH</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Duration</span>
                      <span className="font-semibold text-white">
                        {Math.floor(rental.duration / 86400)}d {Math.floor((rental.duration % 86400) / 3600)}h
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        rental.status === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        rental.status === 1 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {formatRentalStatus(rental.status)}
                      </span>
                    </div>

                    <div className="border-t border-white/10 pt-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Owner</span>
                        <span className="font-mono text-gray-300">{formatAddress(rental.owner)}</span>
                      </div>
                      {rental.renter !== '0x0000000000000000000000000000000000000000' && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Renter</span>
                          <span className="font-mono text-gray-300">{formatAddress(rental.renter)}</span>
                        </div>
                      )}
                    </div>

                    {rental.status === 1 && (
                      <div className="flex items-center justify-center text-sm text-orange-400 bg-orange-500/10 border border-orange-500/20 py-2 rounded-lg">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTimeRemaining(rental)}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-3">
                      {canUserRent(rental) && (
                        <button
                          onClick={() => handleStartRental(rental.id)}
                          disabled={actionLoading[rental.id]}
                          className="w-full py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-lg"
                        >
                          {actionLoading[rental.id] ? 'Starting...' : 'Start Rental'}
                        </button>
                      )}

                      {canUserReclaim(rental) && (
                        <button
                          onClick={() => handleManualReclaim(rental.id)}
                          disabled={actionLoading[rental.id]}
                          className="w-full py-3 rounded-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-lg"
                        >
                          {actionLoading[rental.id] ? 'Reclaiming...' : 'Reclaim NFT'}
                        </button>
                      )}

                      {rental.status === 0 && rental.owner.toLowerCase() === userAddress?.toLowerCase() && (
                        <div className="text-center py-3 text-gray-400 text-sm bg-white/5 rounded-lg border border-white/10">
                          Your NFT - Waiting for renter
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

export default RentalList;