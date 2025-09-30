import {
  getLeaseChainContract,
  getTestNFTContract,
  getSigner,
  parseEther,
  formatEther,
  getCurrentBlockTimestamp,
  getCurrentChainId
} from '../utils/web3';

// Create rental listing
export const createRental = async (tokenId, pricePerDay, duration, chainId = null) => {
  try {
    const signer = await getSigner(chainId);
    const currentChainId = chainId || await getCurrentChainId();
    const leaseContract = await getLeaseChainContract(currentChainId, signer);
    const nftContract = await getTestNFTContract(currentChainId, signer);
    const nftContractAddress = await nftContract.getAddress();
    
    // First check if NFT is approved
    const leaseContractAddress = await leaseContract.getAddress();
    const approved = await nftContract.getApproved(tokenId);
    const isApprovedForAll = await nftContract.isApprovedForAll(await signer.getAddress(), leaseContractAddress);
    
    if (approved !== leaseContractAddress && !isApprovedForAll) {
      // Approve the NFT first
      console.log('Approving NFT...');
      const approveTx = await nftContract.approve(leaseContractAddress, tokenId);
      await approveTx.wait();
    }

    // Create rental with correct parameters
    const priceWei = parseEther(pricePerDay);
    
    // Use createRentalListing for marketplace listings
    const tx = await leaseContract.createRentalListing(
      nftContractAddress,
      tokenId,
      duration,
      priceWei
    );
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt.hash,
      rentalId: receipt.logs[0]?.args?.rentalId || null
    };
  } catch (error) {
    console.error('Error creating rental:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Start rental (rent an NFT)
export const startRental = async (rentalId, chainId = null) => {
  try {
    const signer = await getSigner(chainId);
    const currentChainId = chainId || await getCurrentChainId();
    const leaseContract = await getLeaseChainContract(currentChainId, signer);
    
    // Get the renter address (current user)
    const renterAddress = await signer.getAddress();
    console.log('Renter address (current user):', renterAddress);
    
    // Get rental details to know the price
    const rentalBefore = await leaseContract.rentals(rentalId);
    console.log('Rental BEFORE startRental:', {
      id: rentalId,
      owner: rentalBefore.owner,
      renter: rentalBefore.renter,
      isActive: rentalBefore.isActive,
      startTime: Number(rentalBefore.startTime)
    });
    
    const totalPrice = rentalBefore.price;
    
    console.log('Starting rental:', {
      rentalId,
      renterAddress,
      totalPrice: formatEther(totalPrice),
      ownerAddress: rentalBefore.owner
    });
    
    // Start rental with payment
    const tx = await leaseContract.startRental(rentalId, { value: totalPrice });
    console.log('Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);
    
    // Get updated rental details after transaction
    const rentalAfter = await leaseContract.rentals(rentalId);
    console.log('Rental AFTER startRental:', {
      id: rentalId,
      owner: rentalAfter.owner,
      renter: rentalAfter.renter,
      isActive: rentalAfter.isActive,
      startTime: Number(rentalAfter.startTime),
      renterIsCurrentUser: rentalAfter.renter.toLowerCase() === renterAddress.toLowerCase(),
      renterEqualsOwner: rentalAfter.renter.toLowerCase() === rentalAfter.owner.toLowerCase()
    });
    
    // CRITICAL CHECK: Verify the renter was actually set correctly
    if (rentalAfter.renter.toLowerCase() === rentalAfter.owner.toLowerCase()) {
      console.error('🚨 CRITICAL BUG: Renter equals Owner after startRental!');
      console.error('This should never happen. The contract may have a bug.');
      console.error('Expected renter:', renterAddress);
      console.error('Actual renter:', rentalAfter.renter);
      console.error('Owner:', rentalAfter.owner);
    } else if (rentalAfter.renter.toLowerCase() === renterAddress.toLowerCase()) {
      console.log('✅ Renter correctly set to current user');
    } else {
      console.error('🚨 Renter set to unexpected address:', rentalAfter.renter);
    }
    
    return {
      success: true,
      txHash: receipt.hash
    };
  } catch (error) {
    console.error('Error starting rental:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Manual reclaim (for emergencies)
export const manualReclaim = async (rentalId, chainId = null) => {
  try {
    const signer = await getSigner(chainId);
    const currentChainId = chainId || await getCurrentChainId();
    const leaseContract = await getLeaseChainContract(currentChainId, signer);
    
    const tx = await leaseContract.manualReclaim(rentalId);
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: receipt.hash
    };
  } catch (error) {
    console.error('Error manual reclaim:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all rentals
export const getAllRentals = async (chainId = null) => {
  try {
    const currentChainId = chainId || await getCurrentChainId();
    const leaseContract = await getLeaseChainContract(currentChainId);
    const nextRentalId = await leaseContract.nextRentalId();
    
    console.log('Getting rentals, nextRentalId:', Number(nextRentalId));
    
    const rentals = [];
    for (let i = 1; i < nextRentalId; i++) {
      try {
        const rental = await leaseContract.rentals(i);
        const nftContract = await getTestNFTContract(currentChainId);
        
        // Get NFT metadata
        let tokenURI = '';
        try {
          tokenURI = await nftContract.tokenURI(rental.tokenId);
        } catch (error) {
          console.warn(`Could not get tokenURI for token ${rental.tokenId}`);
          tokenURI = `https://api.leasechain.example/metadata/${rental.tokenId}.json`;
        }
        
        // Convert rental status based on contract fields
        let status;
        if (rental.isReclaimed) {
          status = 2; // Completed
        } else if (rental.isActive) {
          status = 1; // Active
        } else {
          status = 0; // Available
        }
        
        const rentalData = {
          id: i,
          nftContract: rental.nftContract,
          tokenId: Number(rental.tokenId),
          owner: rental.owner,
          renter: rental.renter,
          price: formatEther(rental.price), // Keep original field
          pricePerDay: formatEther(rental.price), // Add pricePerDay field for frontend compatibility
          duration: Number(rental.duration),
          startTime: Number(rental.startTime),
          status: status,
          isActive: rental.isActive,
          isReclaimed: rental.isReclaimed,
          tokenURI
        };
        
        console.log('Rental', i, ':', {
          id: rentalData.id,
          owner: rentalData.owner,
          renter: rentalData.renter,
          status: rentalData.status,
          isActive: rentalData.isActive,
          renterIsZero: rentalData.renter === '0x0000000000000000000000000000000000000000'
        });
        rentals.push(rentalData);
      } catch (error) {
        console.warn(`Error fetching rental ${i}:`, error.message);
      }
    }
    
    console.log('Total rentals found:', rentals.length);
    return rentals;
  } catch (error) {
    console.error('Error getting rentals:', error);
    return [];
  }
};

// Get user's owned NFTs
export const getUserNFTs = async (userAddress, chainId = null) => {
  try {
    const currentChainId = chainId || await getCurrentChainId();
    const nftContract = await getTestNFTContract(currentChainId);
    
    console.log('Getting NFTs for user:', userAddress);
    const nfts = [];
    const uniqueTokenIds = new Set();
    
    try {
      // Method 1: Check through totalSupply (for sequential token IDs)
      const totalSupply = await nftContract.totalSupply();
      console.log('Total NFT supply:', Number(totalSupply));
      
      // Check each token from 1 to totalSupply
      for (let tokenId = 1; tokenId <= Number(totalSupply); tokenId++) {
        try {
          const owner = await nftContract.ownerOf(tokenId);
          console.log(`Token ${tokenId} owner:`, owner);
          
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            console.log(`User owns token ${tokenId}`);
            
            if (!uniqueTokenIds.has(tokenId)) {
              uniqueTokenIds.add(tokenId);
              
              let tokenURI = '';
              try {
                tokenURI = await nftContract.tokenURI(tokenId);
              } catch (error) {
                console.warn(`Could not get tokenURI for token ${tokenId}`);
                tokenURI = `https://api.leasechain.example/metadata/${tokenId}.json`;
              }
              
              nfts.push({
                tokenId,
                tokenURI
              });
            }
          }
        } catch (error) {
          // Token might not exist or be burned, skip it
          console.warn(`Token ${tokenId} error:`, error.message);
        }
      }
      
      console.log(`Found ${nfts.length} NFTs via totalSupply method`);
      
    } catch (totalSupplyError) {
      console.error('Error with totalSupply method:', totalSupplyError);
    }
    
    // Method 2: Check Transfer events as additional safety (in case some tokens were missed)
    try {
      console.log('Checking Transfer events as backup...');
      
      // Get all Transfer events TO the user
      const transferToFilter = nftContract.filters.Transfer(null, userAddress, null);
      const transferToEvents = await nftContract.queryFilter(transferToFilter, -50000, 'latest');
      
      console.log(`Found ${transferToEvents.length} Transfer events TO user`);
      
      for (const event of transferToEvents) {
        const tokenId = Number(event.args.tokenId);
        
        // Check if user still owns this token and we haven't already added it
        if (!uniqueTokenIds.has(tokenId)) {
          try {
            const currentOwner = await nftContract.ownerOf(tokenId);
            if (currentOwner.toLowerCase() === userAddress.toLowerCase()) {
              console.log(`Found additional token ${tokenId} via Transfer events`);
              
              uniqueTokenIds.add(tokenId);
              
              let tokenURI = '';
              try {
                tokenURI = await nftContract.tokenURI(tokenId);
              } catch (error) {
                console.warn(`Could not get tokenURI for token ${tokenId}`);
                tokenURI = `https://api.leasechain.example/metadata/${tokenId}.json`;
              }
              
              nfts.push({
                tokenId,
                tokenURI
              });
            }
          } catch (error) {
            console.warn(`Token ${tokenId} no longer exists or error checking owner`);
          }
        }
      }
      
    } catch (eventError) {
      console.error('Error querying Transfer events:', eventError);
    }
    
    // Remove NFTs that are currently listed for rent
    try {
      const allRentals = await getAllRentals(currentChainId);
      const listedTokenIds = new Set();
      
      allRentals.forEach(rental => {
        if (rental.owner.toLowerCase() === userAddress.toLowerCase() && rental.status === 0) {
          listedTokenIds.add(rental.tokenId);
        }
      });
      
      const availableNFTs = nfts.filter(nft => !listedTokenIds.has(nft.tokenId));
      console.log(`Filtered out ${nfts.length - availableNFTs.length} NFTs that are currently listed for rent`);
      
      console.log('Final NFTs for user:', availableNFTs);
      return availableNFTs;
      
    } catch (rentalError) {
      console.error('Error filtering rented NFTs:', rentalError);
      console.log('Returning all found NFTs without rental filtering:', nfts);
      return nfts;
    }
    
  } catch (error) {
    console.error('Error getting user NFTs:', error);
    return [];
  }
};

// Get user's rentals (as owner)
export const getUserRentalsAsOwner = async (userAddress, chainId = null) => {
  try {
    const allRentals = await getAllRentals(chainId);
    return allRentals.filter(rental => 
      rental.owner.toLowerCase() === userAddress.toLowerCase()
    );
  } catch (error) {
    console.error('Error getting user rentals as owner:', error);
    return [];
  }
};

// Debug function to check NFT contract state
export const debugNFTContract = async (userAddress, chainId = null) => {
  try {
    const currentChainId = chainId || await getCurrentChainId();
    const nftContract = await getTestNFTContract(currentChainId);
    
    console.log('=== NFT Contract Debug Info ===');
    console.log('Contract address:', nftContract.address);
    console.log('User address:', userAddress);
    
    // Get contract info
    const name = await nftContract.name();
    const symbol = await nftContract.symbol();
    const totalSupply = await nftContract.totalSupply();
    const nextTokenId = await nftContract.getNextTokenId();
    
    console.log('Contract name:', name);
    console.log('Contract symbol:', symbol);
    console.log('Total supply:', Number(totalSupply));
    console.log('Next token ID:', Number(nextTokenId));
    
    // Check each token individually
    console.log('=== Individual Token Check ===');
    for (let tokenId = 1; tokenId <= Number(totalSupply); tokenId++) {
      try {
        const owner = await nftContract.ownerOf(tokenId);
        const isUserOwned = owner.toLowerCase() === userAddress.toLowerCase();
        console.log(`Token ${tokenId}: owner=${owner}, userOwns=${isUserOwned}`);
      } catch (error) {
        console.log(`Token ${tokenId}: ERROR - ${error.message}`);
      }
    }
    
    return {
      contractAddress: nftContract.address,
      name,
      symbol,
      totalSupply: Number(totalSupply),
      nextTokenId: Number(nextTokenId)
    };
  } catch (error) {
    console.error('Error debugging NFT contract:', error);
    return null;
  }
};

// Get user's rentals (as renter)
export const getUserRentalsAsRenter = async (userAddress, chainId = null) => {
  try {
    const allRentals = await getAllRentals(chainId);
    return allRentals.filter(rental => 
      rental.renter.toLowerCase() === userAddress.toLowerCase()
    );
  } catch (error) {
    console.error('Error getting user rentals as renter:', error);
    return [];
  }
};

// Check if rental has expired
export const isRentalExpired = async (rental, chainId = null) => {
  if (rental.status !== 1) return false; // Only active rentals can expire
  
  const currentChainId = chainId || await getCurrentChainId();
  const currentTimestamp = await getCurrentBlockTimestamp(currentChainId);
  const expiryTime = rental.startTime + rental.duration;
  
  return currentTimestamp >= expiryTime;
};

// Get time remaining for rental
export const getRentalTimeRemaining = async (rental, chainId = null) => {
  if (rental.status !== 1) return 0; // Only active rentals have time remaining
  
  const currentChainId = chainId || await getCurrentChainId();
  const currentTimestamp = await getCurrentBlockTimestamp(currentChainId);
  const expiryTime = rental.startTime + rental.duration;
  const remaining = expiryTime - currentTimestamp;
  
  return Math.max(0, remaining);
};

// Format rental status
export const formatRentalStatus = (status) => {
  switch (status) {
    case 0: return 'Available';
    case 1: return 'Active';
    case 2: return 'Completed';
    default: return 'Unknown';
  }
};

// Mint test NFT (for testing)
export const mintTestNFT = async (chainId = null) => {
  try {
    const signer = await getSigner(chainId);
    const currentChainId = chainId || await getCurrentChainId();
    const nftContract = await getTestNFTContract(currentChainId, signer);
    
    const tx = await nftContract.publicMint();
    const receipt = await tx.wait();
    
    // Extract token ID from events
    const mintEvent = receipt.logs.find(log => {
      try {
        const parsed = nftContract.interface.parseLog(log);
        return parsed.name === 'Transfer';
      } catch {
        return false;
      }
    });
    
    const tokenId = mintEvent ? Number(mintEvent.args.tokenId) : null;
    
    return {
      success: true,
      txHash: receipt.hash,
      tokenId
    };
  } catch (error) {
    console.error('Error minting test NFT:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Check if reactive contract is properly connected
export const checkReactiveConnection = async (chainId = null) => {
  try {
    const currentChainId = chainId || await getCurrentChainId();
    const leaseContract = await getLeaseChainContract(currentChainId);
    
    console.log('=== Reactive Connection Check ===');
    console.log('Chain ID:', currentChainId);
    console.log('LeaseChain address:', leaseContract.address);
    
    // Check if reactive contract is set
    const reactiveContractAddress = await leaseContract.reactiveContract();
    console.log('Reactive contract address:', reactiveContractAddress);
    
    const isReactiveSet = reactiveContractAddress !== '0x0000000000000000000000000000000000000000';
    console.log('Is reactive contract set?', isReactiveSet);
    
    if (isReactiveSet) {
      console.log('✅ Reactive contract is connected');
    } else {
      console.log('❌ Reactive contract is NOT connected');
      console.log('This means automatic reclaim will not work!');
    }
    
    return {
      isConnected: isReactiveSet,
      reactiveAddress: reactiveContractAddress,
      chainId: currentChainId
    };
  } catch (error) {
    console.error('Error checking reactive connection:', error);
    return {
      isConnected: false,
      error: error.message
    };
  }
};