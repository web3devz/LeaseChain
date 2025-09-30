# LeaseChain: Trustless NFT Rentals with Reactive Smart Contracts

## 🌟 Overview

LeaseChain is a revolutionary NFT rental protocol that enables **trustless, automated NFT rentals** where assets are automatically returned to owners when leases expire. Powered by **Reactive Smart Contracts (RSCs)**, LeaseChain eliminates the need for manual intervention or complex escrow mechanisms.

## 🚀 Key Features

### 🔄 Automatic NFT Reclaim
- **Zero Manual Intervention**: NFTs are automatically returned to owners when rental periods expire
- **Reactive Smart Contracts**: Monitors blockchain state and triggers automatic reclaim
- **Trustless Operation**: No reliance on centralized services or manual processes

### 🛡️ Trustless Leasing
- **Smart Contract Escrow**: NFTs are securely held in smart contracts during rental periods
- **Automated Payments**: Instant payment distribution to owners and protocol fees
- **Transparent Terms**: All rental terms are immutably stored on-chain

### 🌐 Multi-Chain Support
Currently deployed on 5 testnets:
- **Base Sepolia** (Primary)
- **Arbitrum Sepolia**
- **Avalanche Fuji**
- **Sonic Testnet**
- **BNB Chain Testnet**

### ⚡ Cross-Chain Ready
- Unified interface across all supported networks
- Easy network switching in the frontend
- Consistent contract addresses and functionality

## 🎯 How It Works

### For NFT Owners (Lessors)
1. **List Your NFT**: Create a rental listing with your desired price and duration
2. **Automatic Approval**: Smart contract handles NFT approval and escrow
3. **Earn Rental Income**: Receive payments instantly when someone rents your NFT
4. **Guaranteed Return**: Your NFT is automatically returned when the lease expires

### For Renters (Lessees)
1. **Browse Listings**: Explore available NFTs across multiple chains
2. **Instant Rental**: Pay and receive the NFT immediately
3. **Use During Lease**: Full utility access during the rental period
4. **Automatic Return**: NFT is returned to owner when lease expires (no action needed)

### For the Protocol
1. **Reactive Monitoring**: RSCs continuously monitor all active rentals
2. **Expiry Detection**: Automatically detects when rental periods end
3. **Instant Reclaim**: Triggers immediate NFT return to original owner
4. **Fee Collection**: Transparent protocol fees for sustainable operation

## � Technical Innovation

### Reactive Smart Contracts
LeaseChain leverages the **Reactive Network** to implement truly autonomous smart contracts that:
- Monitor blockchain state continuously
- Execute automatic actions without external triggers
- Eliminate reliance on keepers, bots, or manual intervention

### Security Features
- **Reentrancy Protection**: All functions protected against reentrancy attacks
- **Access Control**: Role-based permissions for critical functions
- **Emergency Controls**: Manual reclaim available for edge cases
- **Comprehensive Testing**: Extensively tested across multiple scenarios

## 🎮 Live Demo

The application is currently running with fresh contract deployments across all supported networks. Connect your wallet and try:

1. **Minting Test NFTs**: Use the "Mint Test NFT" feature
2. **Creating Rentals**: List your NFTs for rent
3. **Browsing Marketplace**: Explore available rentals
4. **Starting Rentals**: Rent NFTs from other users (use different wallet addresses)

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  LeaseChain      │    │  Reactive       │
│   (React)       │◄───│  Contract        │◄───│  Contract       │
│                 │    │  (Multi-chain)   │    │  (Monitoring)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                          │
                              │ Events                   │ Auto-reclaim
                              ▼                          ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   NFT Contract   │    │  System Contract│
                       │   (ERC-721)      │    │  (Reactive Net) │
                       └──────────────────┘    └─────────────────┘
```

## 🏗️ Project Structure

```
LeaseChain/
├── contracts/               # Smart contracts
│   ├── LeaseChain.sol      # Main rental contract
│   ├── LeaseChainReactive.sol # Reactive monitoring contract
│   └── TestNFT.sol         # Test NFT contract
├── frontend/               # React.js frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── api/           # Blockchain interaction
│   │   ├── config/        # Contract configurations
│   │   └── utils/         # Utility functions
├── scripts/               # Deployment and utility scripts
└── test/                 # Contract tests
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- MetaMask or compatible wallet
- Testnet ETH for transactions

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/leasechain
cd leasechain

# Install dependencies
npm install

# Install frontend dependencies
cd frontend && npm install --legacy-peer-deps && cd ..

# Create environment file
cp .env.example .env
```

### Run Locally
```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Start frontend
cd frontend && npm start
```

The application will be available at `http://localhost:3000`

## 🌍 Network Information

### Contract Addresses
All contracts are freshly deployed and verified. See [DOCS.md](./DOCS.md) for complete address list.

### Supported Networks
- **Base Sepolia**: Primary testnet with full feature set
- **Arbitrum Sepolia**: L2 scaling solution
- **Avalanche Fuji**: High-performance blockchain
- **Sonic Testnet**: Next-generation L1
- **BNB Chain Testnet**: Popular DeFi ecosystem

## 🔮 Future Roadmap

### Phase 1: Core Features ✅
- [x] Basic rental functionality
- [x] Multi-chain deployment
- [x] Reactive automation
- [x] Frontend interface

### Phase 2: Enhanced Features (Q1 2026)
- [ ] Batch rental operations
- [ ] Rental extensions
- [ ] Advanced pricing models
- [ ] Rental history analytics

### Phase 3: Ecosystem Growth (Q2 2026)
- [ ] Mainnet deployment
- [ ] Third-party integrations
- [ ] Mobile application
- [ ] Advanced DeFi features

### Phase 4: Advanced Features (Q3 2026)
- [ ] Cross-chain rental transfers
- [ ] Rental derivatives
- [ ] Insurance integration
- [ ] DAO governance

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on how to get started.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📞 Support & Contact

- **Documentation**: [DOCS.md](./DOCS.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/leasechain/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/leasechain/discussions)
- **Twitter**: [@LeaseChain](https://twitter.com/leasechain)

## 🙏 Acknowledgments

- **Reactive Network**: For providing the infrastructure for autonomous smart contracts
