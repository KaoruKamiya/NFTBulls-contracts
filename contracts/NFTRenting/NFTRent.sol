// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import './NFTRentStorage.sol';

contract NFTRent is NFTRentStorage, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    mapping(address => bool) public quotes;

    modifier ifNFTRentLineExists(bytes32 NFTRentLineHash) {
        require(NFTRentLineInfo[NFTRentLineHash].currentStatus != NFTRentLineStatus.NOT_CREATED, 'NFTRent Line does not exist');
        _;
    }

     modifier onlyNFTRentLineBorrower(bytes32 NFTRentLineHash) {
        require(NFTRentLineInfo[NFTRentLineHash].borrower == msg.sender, 'Only NFTRent line Borrower can access');
        _;
    }

    modifier onlyNFTRentLineLender(bytes32 NFTRentLineHash) {
        require(NFTRentLineInfo[NFTRentLineHash].lender == msg.sender, 'Only NFTRent line Lender can access');
        _;
    }

    // Add events here to get the updates on the requested quotes made by the lender
    event QuoteRequested(address NFTRent);
    event QuoteAccepted(address NFTRent, uint256 DailyRentPrice);
    event QuoteRejected(address NFTRent, uint256 DailyRentPrice);

    function requestQuote(address _rentNft, uint256 _rentDuration, uint256 _collateralAmount, address _collateralAsset) external {
        require(_rentNft != address(0), 'Invalid NFT address');
        require(!quotes[_rentNft], 'The quote already exists');
        quoteVars[_rentNft].NFTRent = _rentNft;
        quoteVars[_rentNft].NFTOwner = msg.sender;
        quoteVars[_rentNft].maxRentalDuration = _rentDuration;
        quoteVars[_rentNft].collateralAmount = _collateralAmount;
        quoteVars[_rentNft].expert = address(0);
        quoteVars[_rentNft].verified = false;
        quoteVars[_rentNft].quoteStatus = QuoteStatus.REQUESTED;
        quotes[_rentNft] = true;
        emit QuoteRequested(_rentNft);
    }

    function AcceptQuote(address _rentNft) external {
        require(_rentNft != address(0), 'Invalid NFT address');
        require(quotes[_rentNft], 'The quote does not exists');
        require(quoteVars[_rentNft].NFTOwner == msg.sender, 'Only lender can accept quote');
        require(quoteVars[_rentNft].expert != address(0), 'Expert has not given the quote');
        quoteVars[_rentNft].quoteStatus = QuoteStatus.ACCEPTED;
        emit QuoteAccepted(_rentNft, quoteVars[_rentNft].dailyRentalPrice);
    }

    function RejectQuote(address _rentNft, uint256 _dailyRentalPrice) external {
        require(_rentNft != address(0), 'Invalid NFT address');
        require(quotes[_rentNft], 'The quote does not exists');
        require(quoteVars[_rentNft].NFTOwner == msg.sender, 'Only lender can accept quote');
        require(quoteVars[_rentNft].expert != address(0), 'Expert has not given the quote');
        quoteVars[_rentNft].dailyRentalPrice = _dailyRentalPrice;
        quoteVars[_rentNft].quoteStatus = QuoteStatus.REJECTED;
        emit QuoteRejected(_rentNft, quoteVars[_rentNft].dailyRentalPrice);
    }

    function stopLending(address _rentNft) external {
        // Make sure the renting has not started yet
        require(quotes[_rentNft], 'The quote does not exist');
        require(quoteVars[_rentNft].NFTOwner == msg.sender, 'Only lender can stop lending');
        delete quoteVars[_rentNft];
        quotes[_rentNft] = false;
    }
}