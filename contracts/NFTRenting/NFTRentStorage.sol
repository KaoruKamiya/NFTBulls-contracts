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

    // Add quote template 
    struct QuoteVars {
        address NFTRent;
        address NFTOwner;
        uint256 maxRentalDuration;
        uint256 dailyRentalPrice;
        uint256 collateralAmount;
        address expert;
        bool verified;
        QuoteStatus quoteStatus;
        // How to make sure that expert only stakes for this particular deal
        // Try out the other option suggested by Ritik
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
        uint256 NFTAmount;
        uint256 idealCollateralRatio; // Expected collateral Amount
        uint256 liquidationThreshold; // Is it needed?
        uint256 borrowRate;
        address borrowAsset; // NFT Address
        address collateralAsset;
        NFTRentLineStatus currentStatus;
        bool autoLiquidation;
        bool requestByLender;
    }
    // mapping(bytes32 => mapping(address => uint256)) collateralShareInStrategy;
    mapping(bytes32 => NFTRentLineUsageVars) public NFTRentLineUsage;
    mapping(bytes32 => NFTRentLineVars) public NFTRentLineInfo;
    mapping(address => QuoteVars) public quoteVars;
}
