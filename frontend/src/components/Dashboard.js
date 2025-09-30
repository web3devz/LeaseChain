import React, { useState, useEffect, useCallback } from 'react';
import { Clock, User, Zap, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { getAllRentals, manualReclaim } from '../api/leasechain';

function Dashboard({ account, chainId }) {
  const [activeTab, setActiveTab] = useState('owned');
  const [rentals, setRentals] = useState({
    owned: [],
    rented: []
  });
  const [loading, setLoading] = useState(false);

  const loadRealData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading dashboard data for account:', account, 'chainId:', chainId);
      
      // Get all rentals and filter by user
      const allRentals = await getAllRentals(chainId);
      console.log('All rentals loaded:', allRentals);
      
      const owned = allRentals.filter(rental => 
        rental.owner.toLowerCase() === account.toLowerCase()
      );
      
      // Fixed: Check for non-zero renter address AND status 1 (active rental)
      const rented = allRentals.filter(rental => {
        const isRenterMatch = rental.renter && 
          rental.renter !== '0x0000000000000000000000000000000000000000' &&
          rental.renter.toLowerCase() === account.toLowerCase();
        const isActiveRental = rental.status === 1;
        
        if (rental.renter && rental.renter !== '0x0000000000000000000000000000000000000000') {
          console.log('Checking rental for rented filter:', {
            rentalId: rental.id,
            renter: rental.renter,
            account: account,
            renterMatch: isRenterMatch,
            status: rental.status,
            isActive: isActiveRental,
            included: isRenterMatch && isActiveRental
          });
        }
        
        return isRenterMatch && isActiveRental;
      });

      console.log('Filtered owned rentals:', owned);
      console.log('Filtered rented rentals:', rented);

      setRentals({ owned, rented });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty arrays on error
      setRentals({ owned: [], rented: [] });
    } finally {
      setLoading(false);
    }
  }, [account, chainId]);

  // Load real data instead of mock data
  useEffect(() => {
    if (account && chainId) {
      console.log('Dashboard useEffect triggered with account:', account, 'chainId:', chainId);
      loadRealData();
    } else {
      console.log('Dashboard useEffect: missing account or chainId', { account, chainId });
    }
  }, [account, chainId, loadRealData]);

  const formatTimeRemaining = (rental) => {
    if (rental.status !== 1) return 'Not Active';
    
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

  const handleReclaim = async (rentalId) => {
    setLoading(true);
    try {
      console.log('Reclaiming rental:', rentalId);
      const result = await manualReclaim(rentalId);
      if (result.success) {
        alert(`NFT reclaimed successfully! Transaction: ${result.txHash}`);
        // Wait a moment for blockchain to update, then refresh
        setTimeout(() => {
          loadRealData(); // Refresh dashboard data
        }, 2000);
      } else {
        alert(`Error reclaiming NFT: ${result.error}`);
      }
    } catch (error) {
      console.error('Error reclaiming:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="bg-white/5 backdrop-blur-lg p-8 rounded-xl border border-white/10 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Wallet Not Connected</h3>
        <p className="text-gray-400">Please connect your wallet to view your dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
          <p className="text-gray-300">Manage your NFT rentals</p>
        </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<User className="w-6 h-6" />}
          title="Owned Rentals"
          value={rentals.owned.length}
          subtitle="NFTs you're renting out"
        />
        <StatCard
          icon={<Zap className="w-6 h-6" />}
          title="Rented NFTs"
          value={rentals.rented.length}
          subtitle="NFTs you're renting"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          title="Active Rentals"
          value={[...rentals.owned, ...rentals.rented].filter(r => !r.isExpired).length}
          subtitle="Currently active"
        />
        <StatCard
          icon={<RefreshCw className="w-6 h-6" />}
          title="Auto-Reclaimed"
          value={rentals.owned.filter(r => r.status === 2).length}
          subtitle="Automatically returned"
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/5 backdrop-blur-lg p-8 rounded-xl border border-white/10">
        <div className="flex space-x-4 mb-6 border-b border-white/20">
          <button
            onClick={() => setActiveTab('owned')}
            className={`pb-2 px-1 font-semibold border-b-2 transition-colors ${
              activeTab === 'owned'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            My NFTs ({rentals.owned.length})
          </button>
          <button
            onClick={() => setActiveTab('rented')}
            className={`pb-2 px-1 font-semibold border-b-2 transition-colors ${
              activeTab === 'rented'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Rented NFTs ({rentals.rented.length})
          </button>
        </div>

        {/* Rental Cards */}
        <div className="space-y-4">
          {activeTab === 'owned' ? (
            rentals.owned.length > 0 ? (
              rentals.owned.map(rental => (
                <OwnedRentalCard
                  key={rental.id}
                  rental={rental}
                  onReclaim={handleReclaim}
                  loading={loading}
                  formatTimeRemaining={formatTimeRemaining}
                />
              ))
            ) : (
              <EmptyState message="You haven't created any rentals yet" />
            )
          ) : (
            rentals.rented.length > 0 ? (
              rentals.rented.map(rental => (
                <RentedNFTCard
                  key={rental.id}
                  rental={rental}
                  formatTimeRemaining={formatTimeRemaining}
                />
              ))
            ) : (
              <EmptyState message="You haven't rented any NFTs yet" />
            )
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, title, value, subtitle }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
      <div className="flex items-center space-x-3 mb-2">
        <div className="text-blue-400">{icon}</div>
        <span className="text-white font-semibold">{title}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-gray-300 text-sm">{subtitle}</div>
    </div>
  );
}

// Owned Rental Card Component
function OwnedRentalCard({ rental, onReclaim, loading, formatTimeRemaining }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            #{rental.tokenId}
          </div>
          <div>
            <div className="font-semibold text-white">Token #{rental.tokenId}</div>
            <div className="text-sm text-gray-400">
              Rental ID: #{rental.id}
            </div>
          </div>
        </div>
        <StatusBadge status={rental.status} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-400">Price per Day</div>
          <div className="font-medium text-blue-400">{rental.pricePerDay} ETH</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Duration</div>
          <div className="font-medium text-white">
            {Math.floor(rental.duration / 86400)}d {Math.floor((rental.duration % 86400) / 3600)}h
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Time Remaining</div>
          <div className="font-medium text-white">{formatTimeRemaining(rental)}</div>
        </div>
      </div>

      {rental.renter !== '0x0000000000000000000000000000000000000000' && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="text-sm text-gray-400">Currently Rented To</div>
          <div className="font-mono text-gray-300">
            {rental.renter.slice(0, 6)}...{rental.renter.slice(-4)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Status: {rental.status === 0 ? 'Available' : rental.status === 1 ? 'Rented' : 'Expired'}</span>
        </div>
        
        {rental.status === 1 && (
          <button
            onClick={() => onReclaim(rental.id)}
            disabled={loading}
            className="bg-orange-500/20 hover:bg-orange-500/30 px-4 py-2 rounded-lg border border-orange-500/30 text-orange-400 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin"></div>
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{loading ? 'Reclaiming...' : 'Manual Reclaim'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Rented NFT Card Component
function RentedNFTCard({ rental, formatTimeRemaining }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            #{rental.tokenId}
          </div>
          <div>
            <div className="font-semibold text-white">Token #{rental.tokenId}</div>
            <div className="text-sm text-gray-400">
              Rental ID: #{rental.id}
            </div>
          </div>
        </div>
        <StatusBadge status={rental.status} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-400">Owner</div>
          <div className="font-medium text-gray-300">
            {rental.owner.slice(0, 6)}...{rental.owner.slice(-4)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Paid</div>
          <div className="font-medium text-blue-400">{rental.pricePerDay} ETH</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Time Remaining</div>
          <div className="font-medium text-white">{formatTimeRemaining(rental)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Duration: {Math.floor(rental.duration / 86400)}d {Math.floor((rental.duration % 86400) / 3600)}h</span>
        </div>
        
        <button className="bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg border border-blue-500/30 text-blue-400 transition-colors flex items-center space-x-2">
          <ExternalLink className="w-4 h-4" />
          <span>View NFT</span>
        </button>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const getStatusStyles = (status) => {
    switch (status) {
      case 0:
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 1:
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 2:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Available';
      case 1: return 'Active';
      case 2: return 'Expired';
      default: return 'Unknown';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(status)}`}>
      {getStatusText(status)}
    </span>
  );
}

// Empty State Component
function EmptyState({ message }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/10">
        <Clock className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-300">{message}</p>
    </div>
  );
}

export default Dashboard;