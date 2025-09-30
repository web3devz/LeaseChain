const { ethers } = require("hardhat");

async function main() {
  const network = hre.network.name;
  console.log(`Setting reactive contract address on ${network}`);
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // Load deployment info
  const deploymentPath = `./deployments/${network}.json`;
  let deploymentInfo;
  
  try {
    deploymentInfo = require(deploymentPath.replace('./deployments/', '../deployments/'));
  } catch (error) {
    console.error(`Deployment info not found at ${deploymentPath}`);
    console.error("Please deploy the LeaseChain contract first");
    return;
  }
  
  const leaseChainAddress = deploymentInfo.contracts.LeaseChain;
  const reactiveContractAddress = "0xa20bFD6cC0A0882C16c8c989cd0A0D069aE06471";
  
  console.log("LeaseChain address:", leaseChainAddress);
  console.log("Reactive contract address:", reactiveContractAddress);
  
  // Get contract instance
  const LeaseChain = await ethers.getContractFactory("LeaseChain");
  const leaseChain = LeaseChain.attach(leaseChainAddress);
  
  // Set reactive contract address
  console.log("\nSetting reactive contract address...");
  const tx = await leaseChain.setReactiveContract(reactiveContractAddress);
  await tx.wait();
  
  console.log("✅ Reactive contract address set successfully!");
  console.log("Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });