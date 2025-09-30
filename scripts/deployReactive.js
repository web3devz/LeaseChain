const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  console.log("Deploying LeaseChain Reactive Contract to Reactive Network");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Configuration for different chains
  const chainConfigs = {
    // Base Sepolia
    84532: {
      name: "Base Sepolia",
      leaseContract: "0xb30fC27A86Aaa9Ad8D7593b137AD4990e5e8E141"
    },
    // Arbitrum Sepolia
    421614: {
      name: "Arbitrum Sepolia", 
      leaseContract: "0xAf7F094dc3db86995c84cd8fa7c893Eafb750286"
    },
    // Avalanche Fuji
    43113: {
      name: "Avalanche Fuji",
      leaseContract: "0x5938191577f48A6b09c802847fF2E2639763a648"
    },
    // Sonic Testnet
    14601: {
      name: "Sonic Testnet",
      leaseContract: "0xA3036d9Ec8D942acd976F0532cC689f1eC667111"
    },
    // BNB Testnet
    97: {
      name: "BNB Testnet",
      leaseContract: "0x58C53D54319bFCd77b6CD88EdE00c44466BDE035"
    }
  };

  // Prepare arrays for constructor
  const originChainIds = Object.keys(chainConfigs).map(id => parseInt(id));
  const leaseContracts = Object.values(chainConfigs).map(config => config.leaseContract);

  console.log("\nConfiguration:");
  console.log("Origin Chain IDs:", originChainIds);
  console.log("Lease Contracts:", leaseContracts);
  
  // System contract address on Reactive Network
  const systemContractAddr = process.env.SYSTEM_CONTRACT_ADDR || "0x0000000000000000000000000000000000fffFfF";
  
  // Deploy LeaseChain Reactive contract
  console.log("\nDeploying LeaseChain Reactive Contract...");
  const LeaseChainReactive = await ethers.getContractFactory("LeaseChainReactive");
  
  const reactiveContract = await LeaseChainReactive.deploy(
    systemContractAddr,
    originChainIds,
    leaseContracts,
    {
      value: ethers.parseEther("0.1") // Send some REACT tokens for subscriptions
    }
  );
  
  await reactiveContract.waitForDeployment();
  const reactiveContractAddress = await reactiveContract.getAddress();
  
  console.log("LeaseChain Reactive Contract deployed to:", reactiveContractAddress);

  // Log deployment information
  console.log("\n=== Reactive Deployment Summary ===");
  console.log("Network: Reactive Network (Lasna Testnet)");
  console.log("Chain ID: 5318007");
  console.log("Deployer:", deployer.address);
  console.log("Reactive Contract:", reactiveContractAddress);
  console.log("System Contract:", systemContractAddr);
  console.log("Monitored Chains:", originChainIds.length);
  
  // Save deployment info
  const deploymentInfo = {
    network: "reactive",
    chainId: 5318007,
    deployer: deployer.address,
    contracts: {
      LeaseChainReactive: reactiveContractAddress,
      SystemContract: systemContractAddr
    },
    monitoredChains: chainConfigs,
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  const deploymentFile = `deployments/reactive.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to ${deploymentFile}`);

  console.log("\n=== Next Steps ===");
  console.log("1. Update the LeaseChain contracts on each chain with the reactive contract address:");
  console.log(`   leaseChain.setReactiveContract("${reactiveContractAddress}")`);
  console.log("2. Fund the reactive contract with REACT tokens for gas");
  console.log("3. Update the chain configs with actual deployed LeaseChain addresses");
  console.log("4. Test the end-to-end rental flow");

  // Verification command for Reactive Network
  console.log("\n=== Verification Command ===");
  console.log(`forge verify-contract --verifier sourcify --verifier-url https://sourcify.rnk.dev/ --chain-id 5318007 ${reactiveContractAddress} LeaseChainReactive`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });