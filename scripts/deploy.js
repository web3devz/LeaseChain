const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  console.log("Deploying LeaseChain contracts to", hre.network.name);
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy Test NFT (for testing purposes)
  console.log("\n1. Deploying Test NFT...");
  const TestNFT = await ethers.getContractFactory("TestNFT");
  const testNFT = await TestNFT.deploy(
    "LeaseChain Test NFT",
    "LCTEST",
    "https://api.leasechain.example/metadata/"
  );
  await testNFT.waitForDeployment();
  const testNFTAddress = await testNFT.getAddress();
  console.log("Test NFT deployed to:", testNFTAddress);

  // Deploy LeaseChain contract
  console.log("\n2. Deploying LeaseChain contract...");
  const LeaseChain = await ethers.getContractFactory("LeaseChain");
  const leaseChain = await LeaseChain.deploy(deployer.address); // deployer as fee recipient
  await leaseChain.waitForDeployment();
  const leaseChainAddress = await leaseChain.getAddress();
  console.log("LeaseChain deployed to:", leaseChainAddress);

  // Mint some test NFTs
  console.log("\n3. Minting test NFTs...");
  try {
    const mintTx = await testNFT.mintBatch(deployer.address, 3, { gasLimit: 500000 });
    await mintTx.wait();
    console.log("Minted 3 test NFTs to deployer");
  } catch (error) {
    console.log("Warning: Could not mint test NFTs:", error.message);
    console.log("NFTs can be minted manually later");
  }

  // Approve LeaseChain contract to manage NFTs
  console.log("\n4. Approving LeaseChain contract...");
  const approveTx = await testNFT.setApprovalForAll(leaseChainAddress, true);
  await approveTx.wait();
  console.log("LeaseChain contract approved for all NFTs");

  // Log deployment information
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Test NFT:", testNFTAddress);
  console.log("LeaseChain:", leaseChainAddress);
  
  // Save addresses to file for frontend
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    contracts: {
      TestNFT: testNFTAddress,
      LeaseChain: leaseChainAddress
    },
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  const deploymentFile = `deployments/${hre.network.name}.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to ${deploymentFile}`);

  // Verification instructions
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n=== Verification Commands ===");
    console.log(`npx hardhat verify --network ${hre.network.name} ${testNFTAddress} "LeaseChain Test NFT" "LCTEST" "https://api.leasechain.example/metadata/"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${leaseChainAddress} ${deployer.address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });