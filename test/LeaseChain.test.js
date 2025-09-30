const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LeaseChain", function () {
  let leaseChain, testNFT;
  let owner, renter, protocolFeeRecipient;
  let rentalDuration = 86400; // 1 day
  let rentalPrice = ethers.parseEther("0.1");

  beforeEach(async function () {
    [owner, renter, protocolFeeRecipient] = await ethers.getSigners();

    // Deploy Test NFT
    const TestNFT = await ethers.getContractFactory("TestNFT");
    testNFT = await TestNFT.deploy(
      "Test NFT",
      "TNFT",
      "https://test.com/metadata/"
    );
    await testNFT.waitForDeployment();

    // Deploy LeaseChain
    const LeaseChain = await ethers.getContractFactory("LeaseChain");
    leaseChain = await LeaseChain.deploy(protocolFeeRecipient.address);
    await leaseChain.waitForDeployment();

    // Mint NFT to owner
    await testNFT.mint(owner.address);
    
    // Approve LeaseChain contract
    await testNFT.connect(owner).approve(await leaseChain.getAddress(), 1);
  });

  describe("Deployment", function () {
    it("Should set the correct protocol fee recipient", async function () {
      expect(await leaseChain.protocolFeeRecipient()).to.equal(protocolFeeRecipient.address);
    });

    it("Should set the correct protocol fee percent", async function () {
      expect(await leaseChain.protocolFeePercent()).to.equal(250); // 2.5%
    });
  });

  describe("Rental Creation", function () {
    it("Should create a rental successfully", async function () {
      const tx = await leaseChain.connect(owner).createRental(
        await testNFT.getAddress(),
        1,
        renter.address,
        rentalDuration,
        rentalPrice
      );

      await expect(tx)
        .to.emit(leaseChain, "RentalCreated")
        .withArgs(
          1,
          await testNFT.getAddress(),
          1,
          owner.address,
          renter.address,
          rentalDuration,
          rentalPrice
        );

      const rental = await leaseChain.getRental(1);
      expect(rental.owner).to.equal(owner.address);
      expect(rental.renter).to.equal(renter.address);
      expect(rental.price).to.equal(rentalPrice);
      expect(rental.duration).to.equal(rentalDuration);
    });

    it("Should revert if not NFT owner", async function () {
      await expect(
        leaseChain.connect(renter).createRental(
          await testNFT.getAddress(),
          1,
          renter.address,
          rentalDuration,
          rentalPrice
        )
      ).to.be.revertedWith("Not NFT owner");
    });
  });

  describe("Rental Start", function () {
    beforeEach(async function () {
      await leaseChain.connect(owner).createRental(
        await testNFT.getAddress(),
        1,
        renter.address,
        rentalDuration,
        rentalPrice
      );
    });

    it("Should start rental successfully", async function () {
      const tx = await leaseChain.connect(renter).startRental(1, {
        value: rentalPrice
      });

      await expect(tx).to.emit(leaseChain, "RentalStarted");

      const rental = await leaseChain.getRental(1);
      expect(rental.isActive).to.be.true;
      expect(rental.startTime).to.be.greaterThan(0);

      // Check NFT transfer
      expect(await testNFT.ownerOf(1)).to.equal(renter.address);
    });

    it("Should revert if insufficient payment", async function () {
      await expect(
        leaseChain.connect(renter).startRental(1, {
          value: ethers.parseEther("0.05")
        })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Manual Reclaim", function () {
    beforeEach(async function () {
      await leaseChain.connect(owner).createRental(
        await testNFT.getAddress(),
        1,
        renter.address,
        rentalDuration,
        rentalPrice
      );
      
      await leaseChain.connect(renter).startRental(1, {
        value: rentalPrice
      });
    });

    it("Should allow manual reclaim after expiry", async function () {
      // Fast forward time past rental duration
      await ethers.provider.send("evm_increaseTime", [rentalDuration + 1]);
      await ethers.provider.send("evm_mine");

      // Renter needs to approve the LeaseChain contract to transfer the NFT back
      await testNFT.connect(renter).approve(await leaseChain.getAddress(), 1);

      const tx = await leaseChain.connect(owner).manualReclaim(1);
      
      await expect(tx)
        .to.emit(leaseChain, "RentalReclaimed")
        .withArgs(1, await testNFT.getAddress(), 1, false);

      // Check NFT transfer back to owner
      expect(await testNFT.ownerOf(1)).to.equal(owner.address);

      const rental = await leaseChain.getRental(1);
      expect(rental.isActive).to.be.false;
      expect(rental.isReclaimed).to.be.true;
    });

    it("Should revert manual reclaim before expiry", async function () {
      await expect(
        leaseChain.connect(owner).manualReclaim(1)
      ).to.be.revertedWith("Rental not expired");
    });
  });

  describe("Utility Functions", function () {
    beforeEach(async function () {
      await leaseChain.connect(owner).createRental(
        await testNFT.getAddress(),
        1,
        renter.address,
        rentalDuration,
        rentalPrice
      );
    });

    it("Should check if rental is expired", async function () {
      expect(await leaseChain.isRentalExpired(1)).to.be.false;
      
      await leaseChain.connect(renter).startRental(1, {
        value: rentalPrice
      });
      
      expect(await leaseChain.isRentalExpired(1)).to.be.false;
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [rentalDuration + 1]);
      await ethers.provider.send("evm_mine");
      
      expect(await leaseChain.isRentalExpired(1)).to.be.true;
    });

    it("Should get rentals by owner", async function () {
      const ownerRentals = await leaseChain.getRentalsByOwner(owner.address);
      expect(ownerRentals.length).to.equal(1);
      expect(ownerRentals[0]).to.equal(1);
    });

    it("Should get rentals by renter", async function () {
      const renterRentals = await leaseChain.getRentalsByRenter(renter.address);
      expect(renterRentals.length).to.equal(1);
      expect(renterRentals[0]).to.equal(1);
    });
  });
});