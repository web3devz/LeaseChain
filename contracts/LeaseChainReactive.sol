// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../lib/reactive-lib/src/interfaces/IReactive.sol";
import "../lib/reactive-lib/src/abstract-base/AbstractReactive.sol";
import "../lib/reactive-lib/src/interfaces/ISystemContract.sol";

/**
 * @title LeaseChain Reactive Contract
 * @dev Monitors rental start events and automatically triggers reclaim when rentals expire
 */
contract LeaseChainReactive is IReactive, AbstractReactive {
    struct RentalInfo {
        uint256 rentalId;
        uint256 expiryTime;
        uint256 originChainId;
        address leaseContract;
        bool isProcessed;
    }

    // State variables
    mapping(uint256 => RentalInfo) public rentals;
    mapping(uint256 => uint256[]) public chainRentals; // chainId => rentalIds
    uint256 public rentalCount = 0;
    
    uint64 private constant GAS_LIMIT = 1000000;
    uint256 private constant RENTAL_STARTED_TOPIC = 0x4c55b89b27d4b46c1cf4c9f2a567cbfa24e8b5b84f1f9e1f5ea6c7e4a6f3b2c1; // keccak256("RentalStarted(uint256,uint256)")

    // Events
    event RentalMonitored(
        uint256 indexed rentalId,
        uint256 indexed chainId,
        address indexed leaseContract,
        uint256 expiryTime
    );
    
    event RentalExpired(
        uint256 indexed rentalId,
        uint256 indexed chainId,
        address indexed leaseContract
    );

    constructor(
        address _service,
        uint256[] memory _originChainIds,
        address[] memory _leaseContracts
    ) payable {
        service = ISystemContract(payable(_service));

        // Subscribe to RentalStarted events on all specified chains
        for (uint256 i = 0; i < _originChainIds.length; i++) {
            if (!vm) {
                service.subscribe(
                    _originChainIds[i],
                    _leaseContracts[i],
                    RENTAL_STARTED_TOPIC,
                    REACTIVE_IGNORE,
                    REACTIVE_IGNORE,
                    REACTIVE_IGNORE
                );
            }
        }
    }

    /**
     * @dev React to rental start events
     */
    function react(LogRecord calldata log) external vmOnly {
        if (log.topic_0 == RENTAL_STARTED_TOPIC) {
            _processRentalStarted(log);
        }
    }

    /**
     * @dev Process rental started event and set up monitoring
     */
    function _processRentalStarted(LogRecord calldata log) internal {
        // Decode rental ID and start time from event data
        uint256 rentalId = uint256(log.topic_1); // First indexed parameter
        uint256 startTime = uint256(log.topic_2); // Second indexed parameter
        
        // Get rental duration by calling the lease contract
        bytes memory callData = abi.encodeWithSignature("getRental(uint256)", rentalId);
        
        // For now, we'll use a default duration of 1 day (86400 seconds)
        // In a production environment, you'd want to call the contract to get the exact duration
        uint256 duration = 86400; // 1 day default
        
        uint256 expiryTime = startTime + duration;
        
        // Store rental info
        rentals[rentalCount] = RentalInfo({
            rentalId: rentalId,
            expiryTime: expiryTime,
            originChainId: log.chain_id,
            leaseContract: log._contract,
            isProcessed: false
        });
        
        chainRentals[log.chain_id].push(rentalCount);
        rentalCount++;

        emit RentalMonitored(rentalId, log.chain_id, log._contract, expiryTime);
    }

    /**
     * @dev Check and process expired rentals (to be called periodically)
     */
    function processExpiredRentals() external {
        for (uint256 i = 0; i < rentalCount; i++) {
            RentalInfo storage rental = rentals[i];
            
            if (!rental.isProcessed && block.timestamp >= rental.expiryTime) {
                _triggerReclaim(rental);
                rental.isProcessed = true;
            }
        }
    }

    /**
     * @dev Trigger automatic reclaim for expired rental
     */
    function _triggerReclaim(RentalInfo memory rental) internal {
        bytes memory payload = abi.encodeWithSignature(
            "automaticReclaim(uint256)",
            rental.rentalId
        );

        emit Callback(
            rental.originChainId,
            rental.leaseContract,
            GAS_LIMIT,
            payload
        );

        emit RentalExpired(
            rental.rentalId,
            rental.originChainId,
            rental.leaseContract
        );
    }

    /**
     * @dev Manual trigger for specific rental (for testing)
     */
    function triggerReclaimForRental(uint256 internalRentalId) external {
        require(internalRentalId < rentalCount, "Invalid rental ID");
        RentalInfo storage rental = rentals[internalRentalId];
        require(!rental.isProcessed, "Already processed");
        require(block.timestamp >= rental.expiryTime, "Not expired yet");
        
        _triggerReclaim(rental);
        rental.isProcessed = true;
    }

    /**
     * @dev Get rental info by internal ID
     */
    function getRentalInfo(uint256 internalRentalId) external view returns (RentalInfo memory) {
        require(internalRentalId < rentalCount, "Invalid rental ID");
        return rentals[internalRentalId];
    }

    /**
     * @dev Get rentals for a specific chain
     */
    function getChainRentals(uint256 chainId) external view returns (uint256[] memory) {
        return chainRentals[chainId];
    }

    /**
     * @dev Get total number of monitored rentals
     */
    function getTotalRentals() external view returns (uint256) {
        return rentalCount;
    }

    /**
     * @dev Subscribe to new lease contract
     */
    function subscribeToLeaseContract(uint256 chainId, address leaseContract) external {
        require(!vm, "Cannot subscribe from ReactVM");
        
        service.subscribe(
            chainId,
            leaseContract,
            RENTAL_STARTED_TOPIC,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
    }

    /**
     * @dev Unsubscribe from lease contract
     */
    function unsubscribeFromLeaseContract(uint256 chainId, address leaseContract) external {
        require(!vm, "Cannot unsubscribe from ReactVM");
        
        service.unsubscribe(
            chainId,
            leaseContract,
            RENTAL_STARTED_TOPIC,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
    }

    /**
     * @dev Get subscription status
     */
    function isSubscribed(uint256 chainId, address leaseContract) external view returns (bool) {
        // This would need to be implemented based on the system contract's interface
        // For now, we'll return true as a placeholder
        return true;
    }

    /**
     * @dev Emergency pause function
     */
    function pause() external {
        // Implementation would depend on access control requirements
        // This is a placeholder for emergency stop functionality
    }

    /**
     * @dev Emergency resume function
     */
    function resume() external {
        // Implementation would depend on access control requirements
        // This is a placeholder for emergency resume functionality
    }
}