// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

contract NFTRentStorage is OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    enum NFTRentLineStatus {
        NOT_CREATED,
        REQUESTED,
        ACTIVE,
        CLOSED,
        CANCELLED,
        LIQUIDATED
    }

    enum QuoteStatus {
        REQUESTED,
        ACCEPTED,
        REJECTED
    }

    uint256 public NFTRentLineCounter;
    uint256 public constant yearInSeconds = 365 days;
    uint256 public feeFraction = 10;
    uint256 public stakeFraction = 50;
    uint256 public expertFee = feeFraction.mul(10**28);
    uint256 public expertStake = stakeFraction.mul(10**28);

    // Add quote template 
    struct QuoteVars {
        address NFTRent;
        uint256 NFTId;
        address NFTOwner;
        uint256 maxRentalDuration;
        uint256 dailyRentalPrice;
        uint256 repayInterval;
        address collateralAsset;
        uint256 collateralAmount;
        address expert;
        bool verified;
        QuoteStatus quoteStatus;
        bool Toescrow;
        bool Towallet;
    }

    /*struct repayments {
        uint256 lastRepaymentTime;
        uint256 currentDebt;
        uint256 netPrinciple;
        uint256 accrueInterest;
    }*/

    struct NFTRentLineUsageVars {
        uint256 principal;
        uint256 totalInterestRepaid;
        uint256 lastPrincipalUpdateTime;
        uint256 interestAccruedTillPrincipalUpdate;
        uint256 collateralAmount;
    }

    struct NFTRentLineVars {
        bool exists;
        address lender;
        address borrower;
        bool verified;
        address expert;
        uint256 NFTAmount; // Always remains 1 for ERC-721, will come into play when considering other token standards
        uint256 idealCollateralRatio; // Expected collateral Amount
        // uint256 liquidationThreshold; 
        uint256 borrowRate;  // daily rental price
        address borrowAsset; // NFT Address
        address collateralAsset;
        NFTRentLineStatus currentStatus;
        uint256 repayments;
        uint256 repaymentsCompleted;
    }
    // mapping(bytes32 => mapping(address => uint256)) collateralShareInStrategy;
    mapping(bytes32 => NFTRentLineUsageVars) public NFTRentLineUsage;
    mapping(bytes32 => NFTRentLineVars) public NFTRentLineInfo;
    mapping(address => QuoteVars) public quoteVars;
}
