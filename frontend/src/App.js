import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Wallet,
  Home,
  List,
  User,
  Github
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import CreateRental from './components/CreateRental';
import RentalList from './components/RentalList';
import NetworkSwitcher from './components/NetworkSwitcher';

// Navigation Tabs Component (inside Router context)
function NavigationTabs() {
  const location = useLocation();
  
  const NavTab = ({ icon, label, path }) => {
    const isActive = location.pathname === path;
    return (
      <Link 
        to={path}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          isActive 
            ? 'text-white bg-white/10' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex space-x-1 bg-white/5 backdrop-blur-lg p-1 rounded-xl border border-white/10">
      <NavTab icon={<Home className="w-4 h-4" />} label="Dashboard" path="/" />
      <NavTab icon={<List className="w-4 h-4" />} label="Browse Rentals" path="/rentals" />
      <NavTab icon={<User className="w-4 h-4" />} label="Create Rental" path="/create" />
    </div>
  );
}

function App() {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentChainId, setCurrentChainId] = useState(null);

  // Function to connect wallet
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          
          // Get current chain ID
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setCurrentChainId(parseInt(chainId, 16));
        }
      } else {
        alert('MetaMask is not installed!');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  // Function to disconnect wallet
  const disconnectWallet = () => {
    setAccount('');
    setIsConnected(false);
  };

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            
            // Get current chain ID
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            setCurrentChainId(parseInt(chainId, 16));
          } else {
            // Still get chain ID even if not connected
            try {
              const chainId = await window.ethereum.request({ method: 'eth_chainId' });
              setCurrentChainId(parseInt(chainId, 16));
            } catch (error) {
              console.log('Could not get chain ID:', error);
            }
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        setCurrentChainId(parseInt(chainId, 16));
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Navigation */}
        <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10 relative z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LC</span>
                </div>
                <span className="text-white font-bold text-xl">LeaseChain</span>
              </div>

              {/* Network Switcher */}
              <div className="flex items-center space-x-4">
                <NetworkSwitcher 
                  currentChainId={currentChainId}
                  onNetworkSwitch={(chainId) => setCurrentChainId(chainId)}
                />
                
                {/* Wallet Connection */}
                {isConnected ? (
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                      <span className="text-green-400 text-sm">
                        {account.slice(0, 6)}...{account.slice(-4)}
                      </span>
                    </div>
                    <button
                      onClick={disconnectWallet}
                      className="bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg border border-blue-500/30 text-blue-400 flex items-center space-x-2 transition-colors"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isConnected ? (
            <div className="space-y-8">
              {/* Navigation Tabs */}
              <NavigationTabs />

              {/* Content */}
              <Routes>
                <Route path="/" element={<Dashboard account={account} chainId={currentChainId} />} />
                <Route path="/rentals" element={<RentalList userAddress={account} isConnected={isConnected} chainId={currentChainId} />} />
                <Route path="/create" element={<CreateRental account={account} chainId={currentChainId} />} />
              </Routes>
            </div>
          ) : (
            <WelcomeScreen onConnect={connectWallet} />
          )}
        </div>

        {/* Footer */}
        <footer className="bg-black/20 backdrop-blur-lg border-t border-white/10 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">LC</span>
                </div>
                <span className="text-gray-300">LeaseChain - Trustless NFT Rentals</span>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
                <span className="text-gray-500 text-sm">
                  Powered by Reactive Smart Contracts
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

// Welcome Screen Component
function WelcomeScreen({ onConnect }) {
  return (
    <div className="text-center py-20">
      <div className="max-w-3xl mx-auto">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <span className="text-white font-bold text-2xl">LC</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">LeaseChain</span>
        </h1>
        
        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
          Trustless NFT rentals powered by Reactive Smart Contracts. 
          Rent NFTs with automatic reclaim and instant returns.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            title="Auto-Reclaim"
            description="NFTs automatically return to owners when rental expires"
            icon="⚡"
          />
          <FeatureCard
            title="Trustless"
            description="No intermediaries needed - smart contracts handle everything"
            icon="🔒"
          />
          <FeatureCard
            title="Multi-Chain"
            description="Deployed across multiple testnets for maximum accessibility"
            icon="🌐"
          />
        </div>
        
        <button
          onClick={onConnect}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all transform hover:scale-105 flex items-center space-x-3 mx-auto"
        >
          <Wallet className="w-6 h-6" />
          <span>Connect Wallet to Get Started</span>
        </button>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ title, description, icon }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

export default App;