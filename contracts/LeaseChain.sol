// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LeaseChain NFT Rental Contract
 * @dev Manages NFT rentals with automatic reclaim functionality via Reactive Smart Contracts
 */
contract LeaseChain is IERC721Receiver, Ownable, ReentrancyGuard {
    struct Rental {
        address nftContract;
        uint256 tokenId;
        address owner;
        address renter;
        uint256 startTime;
        uint256 duration;
        uint256 price;
        bool isActive;
        bool isReclaimed;
    }

    // State variables
    mapping(uint256 => Rental) public rentals;
    mapping(address => mapping(uint256 => uint256)) public nftToRentalId;
    mapping(address => uint256[]) public ownerRentals;
    mapping(address => uint256[]) public renterRentals;
    
    uint256 public nextRentalId = 1;
    uint256 public protocolFeePercent = 250; // 2.5%
    uint256 public constant MAX_FEE_PERCENT = 1000; // 10%
    
    address public protocolFeeRecipient;
    address public reactiveContract;

    // Events
    event RentalCreated(
        uint256 indexed rentalId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address owner,
        address renter,
        uint256 duration,
        uint256 price
    );
    
    event RentalStarted(uint256 indexed rentalId, uint256 startTime);
    
    event RentalReclaimed(
        uint256 indexed rentalId,
        address indexed nftContract,
        uint256 indexed tokenId,
        bool automatic
    );

    event ReactiveContractSet(address indexed reactiveContract);

    // Modifiers
    modifier onlyReactiveContract() {
        require(msg.sender == reactiveContract, "Only reactive contract can call");
        _;
    }

    modifier validRental(uint256 rentalId) {
        require(rentalId < nextRentalId, "Invalid rental ID");
        _;
    }

    modifier activeRental(uint256 rentalId) {
        require(rentalId < nextRentalId, "Invalid rental ID");
        require(rentals[rentalId].isActive, "Rental not active");
        _;
    }

    constructor(address _protocolFeeRecipient) Ownable(msg.sender) {
        protocolFeeRecipient = _protocolFeeRecipient;
    }

    /**
     * @dev Create a new rental agreement
     */
    function createRental(
        address nftContract,
        uint256 tokenId,
        address renter,
        uint256 duration,
        uint256 price
    ) external nonReentrant returns (uint256 rentalId) {
        require(nftContract != address(0), "Invalid NFT contract");
        require(renter != address(0), "Invalid renter address");
        require(duration > 0, "Duration must be positive");
        require(price > 0, "Price must be positive");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(nft.getApproved(tokenId) == address(this) || 
                nft.isApprovedForAll(msg.sender, address(this)), 
                "Contract not approved");

        rentalId = nextRentalId++;
        
        rentals[rentalId] = Rental({
            nftContract: nftContract,
            tokenId: tokenId,
            owner: msg.sender,
            renter: renter,
            startTime: 0,
            duration: duration,
            price: price,
            isActive: false,
            isReclaimed: false
        });

        nftToRentalId[nftContract][tokenId] = rentalId;
        ownerRentals[msg.sender].push(rentalId);
        renterRentals[renter].push(rentalId);

        emit RentalCreated(
            rentalId,
            nftContract,
            tokenId,
            msg.sender,
            renter,
            duration,
            price
        );
    }

    /**
     * @dev Create a rental listing available for anyone to rent
     */
    function createRentalListing(
        address nftContract,
        uint256 tokenId,
        uint256 duration,
        uint256 price
    ) external nonReentrant returns (uint256 rentalId) {
        require(nftContract != address(0), "Invalid NFT contract");
        require(duration > 0, "Duration must be positive");
        require(price > 0, "Price must be positive");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(nft.getApproved(tokenId) == address(this) || 
                nft.isApprovedForAll(msg.sender, address(this)), 
                "Contract not approved");

        rentalId = nextRentalId++;
        
        rentals[rentalId] = Rental({
            nftContract: nftContract,
            tokenId: tokenId,
            owner: msg.sender,
            renter: address(0), // No renter initially
            startTime: 0,
            duration: duration,
            price: price,
            isActive: false,
            isReclaimed: false
        });

        nftToRentalId[nftContract][tokenId] = rentalId;
        ownerRentals[msg.sender].push(rentalId);

        emit RentalCreated(
            rentalId,
            nftContract,
            tokenId,
            msg.sender,
            address(0), // No renter initially
            duration,
            price
        );
    }

    /**
     * @dev Start a rental by transferring NFT and payment
     */
    function startRental(uint256 rentalId) 
        external 
        payable 
        nonReentrant 
        validRental(rentalId) 
    {
        Rental storage rental = rentals[rentalId];
        
        // Allow anyone to rent if renter is zero address (listing), or only assigned renter
        if (rental.renter != address(0)) {
            require(msg.sender == rental.renter, "Only assigned renter can start");
        } else {
            // Assign the renter for listings
            rental.renter = msg.sender;
            renterRentals[msg.sender].push(rentalId);
        }
        
        require(rental.startTime == 0, "Rental already started");
        require(msg.value >= rental.price, "Insufficient payment");

        // Calculate protocol fee
        uint256 protocolFee = (rental.price * protocolFeePercent) / 10000;
        uint256 ownerPayment = rental.price - protocolFee;

        // Transfer payments
        if (protocolFee > 0) {
            payable(protocolFeeRecipient).transfer(protocolFee);
        }
        payable(rental.owner).transfer(ownerPayment);

        // Refund excess payment
        if (msg.value > rental.price) {
            payable(msg.sender).transfer(msg.value - rental.price);
        }

        // Transfer NFT to renter
        IERC721(rental.nftContract).safeTransferFrom(
            rental.owner,
            rental.renter,
            rental.tokenId
        );

        rental.startTime = block.timestamp;
        rental.isActive = true;

        emit RentalStarted(rentalId, block.timestamp);
    }

    /**
     * @dev Manually reclaim NFT (for testing or emergency)
     */
    function manualReclaim(uint256 rentalId) 
        external 
        nonReentrant 
        activeRental(rentalId) 
    {
        Rental storage rental = rentals[rentalId];
        require(msg.sender == rental.owner, "Only owner can reclaim");
        require(block.timestamp >= rental.startTime + rental.duration, "Rental not expired");
        
        _reclaimNFT(rentalId, false);
    }

    /**
     * @dev Automatic reclaim called by reactive contract
     */
    function automaticReclaim(uint256 rentalId) 
        external 
        onlyReactiveContract 
        activeRental(rentalId) 
    {
        Rental storage rental = rentals[rentalId];
        require(block.timestamp >= rental.startTime + rental.duration, "Rental not expired");
        
        _reclaimNFT(rentalId, true);
    }

    /**
     * @dev Internal function to reclaim NFT
     */
    function _reclaimNFT(uint256 rentalId, bool automatic) internal {
        Rental storage rental = rentals[rentalId];
        
        // Transfer NFT back to owner
        IERC721(rental.nftContract).safeTransferFrom(
            rental.renter,
            rental.owner,
            rental.tokenId
        );

        rental.isActive = false;
        rental.isReclaimed = true;

        emit RentalReclaimed(
            rentalId,
            rental.nftContract,
            rental.tokenId,
            automatic
        );
    }

    /**
     * @dev Set the reactive contract address
     */
    function setReactiveContract(address _reactiveContract) external onlyOwner {
        reactiveContract = _reactiveContract;
        emit ReactiveContractSet(_reactiveContract);
    }

    /**
     * @dev Update protocol fee
     */
    function setProtocolFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= MAX_FEE_PERCENT, "Fee too high");
        protocolFeePercent = _feePercent;
    }

    /**
     * @dev Update protocol fee recipient
     */
    function setProtocolFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        protocolFeeRecipient = _recipient;
    }

    /**
     * @dev Check if rental has expired
     */
    function isRentalExpired(uint256 rentalId) external view returns (bool) {
        Rental memory rental = rentals[rentalId];
        if (!rental.isActive || rental.startTime == 0) return false;
        return block.timestamp >= rental.startTime + rental.duration;
    }

    /**
     * @dev Get rental details
     */
    function getRental(uint256 rentalId) external view returns (Rental memory) {
        return rentals[rentalId];
    }

    /**
     * @dev Get rentals by owner
     */
    function getRentalsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerRentals[owner];
    }

    /**
     * @dev Get rentals by renter
     */
    function getRentalsByRenter(address renter) external view returns (uint256[] memory) {
        return renterRentals[renter];
    }

    /**
     * @dev Get expiry time for a rental
     */
    function getRentalExpiryTime(uint256 rentalId) external view returns (uint256) {
        Rental memory rental = rentals[rentalId];
        if (rental.startTime == 0) return 0;
        return rental.startTime + rental.duration;
    }

    /**
     * @dev IERC721Receiver implementation
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}