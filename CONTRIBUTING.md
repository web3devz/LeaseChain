# Contributing to LeaseChain

Thank you for your interest in contributing to LeaseChain! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/web3devz/leasechain.git
   cd leasechain
   ```
3. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install --legacy-peer-deps && cd ..
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Guidelines

### Code Style

- **Solidity**: Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- **JavaScript**: Use ESLint configuration (extends from React)
- **Naming**: Use descriptive names for functions, variables, and contracts

### Contract Development

1. **Security First**: Always consider security implications
2. **Gas Optimization**: Write gas-efficient code
3. **Documentation**: Add comprehensive NatSpec comments
4. **Testing**: Write tests for all new functionality

Example contract documentation:
```solidity
/**
 * @dev Creates a new rental listing available for anyone to rent
 * @param nftContract Address of the ERC-721 contract
 * @param tokenId ID of the NFT to rent
 * @param duration Rental duration in seconds
 * @param price Rental price in wei
 * @return rentalId The ID of the created rental
 */
function createRentalListing(
    address nftContract,
    uint256 tokenId,
    uint256 duration,
    uint256 price
) external nonReentrant returns (uint256 rentalId) {
    // Implementation
}
```

### Frontend Development

1. **Component Structure**: Keep components focused and reusable
2. **State Management**: Use React hooks appropriately
3. **Error Handling**: Provide meaningful error messages
4. **Responsive Design**: Ensure mobile compatibility

## 🧪 Testing

### Running Tests

```bash
# Contract tests
npm test

# Frontend tests (if implemented)
cd frontend && npm test

# Coverage report
npm run test:coverage
```

### Writing Tests

All new features should include tests:

```javascript
describe("New Feature", function () {
    it("should work correctly", async function () {
        // Test implementation
    });
    
    it("should handle edge cases", async function () {
        // Edge case testing
    });
});
```

## 📦 Deployment Testing

Before submitting, test your changes on testnets:

```bash
# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy.js --network baseSepolia

# Test frontend with new contracts
cd frontend && npm start
```

## 🔄 Pull Request Process

### Before Submitting

1. **Code Quality**
   - [ ] Code follows style guidelines
   - [ ] All tests pass
   - [ ] No linting errors
   - [ ] Documentation is updated

2. **Functionality**
   - [ ] Feature works as expected
   - [ ] Edge cases are handled
   - [ ] Gas optimization considered
   - [ ] Security implications reviewed

3. **Testing**
   - [ ] Unit tests added/updated
   - [ ] Integration tests pass
   - [ ] Manual testing completed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## 🛡️ Security Guidelines

### Smart Contract Security

1. **Reentrancy**: Use `nonReentrant` modifier for state-changing functions
2. **Access Control**: Implement proper permissions
3. **Input Validation**: Validate all parameters
4. **Overflow Protection**: Use Solidity 0.8+ or SafeMath

### Common Vulnerabilities to Avoid

- **Reentrancy attacks**
- **Integer overflow/underflow**
- **Unchecked external calls**
- **Improper access control**
- **Gas limit issues**

## 📋 Issue Guidelines

### Bug Reports

Include:
- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Network, browser, wallet version
- **Screenshots**: If applicable

### Feature Requests

Include:
- **Problem**: What problem does this solve?
- **Solution**: Proposed solution
- **Alternatives**: Other approaches considered
- **Implementation**: Technical considerations

## 🏗️ Project Structure

```
LeaseChain/
├── contracts/              # Smart contracts
│   ├── LeaseChain.sol     # Main rental contract
│   ├── LeaseChainReactive.sol # Reactive monitoring
│   └── TestNFT.sol        # Test NFT contract
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── api/          # Blockchain API
│   │   ├── config/       # Configuration
│   │   └── utils/        # Utilities
├── scripts/               # Deployment scripts
├── test/                 # Contract tests
├── DOCS.md               # Technical documentation
└── README.md             # Project overview
```

## 🎯 Areas for Contribution

### High Priority
- [ ] Additional test coverage
- [ ] Gas optimization improvements
- [ ] Security audit fixes
- [ ] Documentation improvements

### Medium Priority
- [ ] Frontend UI/UX improvements
- [ ] Additional network support
- [ ] Performance optimizations
- [ ] Error handling improvements

### Low Priority
- [ ] Code refactoring
- [ ] Additional utility functions
- [ ] Developer tooling
- [ ] Example integrations

## 🤝 Community

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General discussion and questions
- **Discord**: Real-time chat (if available)

### Code of Conduct

We are committed to providing a welcoming and inclusive environment:

1. **Be respectful** of differing viewpoints and experiences
2. **Use welcoming and inclusive language**
3. **Accept constructive criticism gracefully**
4. **Focus on what is best for the community**
5. **Show empathy towards community members**

## 📜 License

By contributing to LeaseChain, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors are recognized in the following ways:
- Listed in project contributors
- Mentioned in release notes for significant contributions
- Special recognition for security discoveries

## 📞 Questions?

If you have questions about contributing:
1. Check existing documentation
2. Search existing issues
3. Open a new issue with the "question" label
4. Join community discussions

---

Thank you for helping make LeaseChain better! 🚀