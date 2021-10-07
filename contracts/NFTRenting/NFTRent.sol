// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import './NFTRentStorage.sol';

contract NFTRent is NFTRentStorage, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    mapping(address => bool) public quotes;
    mapping(address => bytes32) public NFTtoHash;
    

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
    event RentRequested(address NFTRent, bytes32 NFTRentHash);
    event Repaid(address _rentNft, uint256 repaymentsLeft);

    function requestQuote(address _rentNft, uint256 _nftId, uint256 _rentDuration, uint256 _collateralAmount, address _collateralAsset) external {
        require(_rentNft != address(0), 'Invalid NFT address');
        require(!quotes[_rentNft], 'The quote already exists');
        quoteVars[_rentNft].NFTRent = _rentNft;
        quoteVars[_rentNft].NFTId = _nftId;
        quoteVars[_rentNft].NFTOwner = msg.sender;
        quoteVars[_rentNft].maxRentalDuration = _rentDuration;
        quoteVars[_rentNft].collateralAmount = _collateralAmount;
        quoteVars[_rentNft].collateralAsset = _collateralAsset;
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
        quoteVars[_rentNft].verified = true;
        emit QuoteAccepted(_rentNft, quoteVars[_rentNft].dailyRentalPrice);
    }

    function RejectQuote(address _rentNft, uint256 _dailyRentalPrice) external {
        require(_rentNft != address(0), 'Invalid NFT address');
        require(quotes[_rentNft], 'The quote does not exists');
        require(quoteVars[_rentNft].NFTOwner == msg.sender, 'Only lender can accept quote');
        require(quoteVars[_rentNft].expert != address(0), 'Expert has not given the quote');
        quoteVars[_rentNft].dailyRentalPrice = _dailyRentalPrice;
        quoteVars[_rentNft].quoteStatus = QuoteStatus.REJECTED;
        quoteVars[_rentNft].verified = false;
        emit QuoteRejected(_rentNft, quoteVars[_rentNft].dailyRentalPrice);
    }

    function stopLending(address _rentNft) external {
        require(bytes32(NFTtoHash[_rentNft]).length == 0, 'The requested NFT in currently rented');
        require(quotes[_rentNft], 'The quote does not exist');
        require(quoteVars[_rentNft].NFTOwner == msg.sender, 'Only lender can stop lending');
        delete quoteVars[_rentNft];
        quotes[_rentNft] = false;
    }

    function Rent(address _rentNft) external payable {
        require(bytes32(NFTtoHash[_rentNft]).length == 0, 'The requested NFT is alreay rented');
        require(quoteVars[_rentNft].quoteStatus != QuoteStatus.REQUESTED, 'The quote has not been received yet');
        require(quoteVars[_rentNft].NFTOwner != msg.sender, 'Lender and borrower cannot be the same');
        NFTRentLineCounter = NFTRentLineCounter + 1;
        bytes32 NFTRentLineHash = keccak256(abi.encodePacked(NFTRentLineCounter));
        NFTRentLineInfo[NFTRentLineHash].currentStatus = NFTRentLineStatus.REQUESTED;
        NFTRentLineInfo[NFTRentLineHash].borrower = msg.sender;
        NFTRentLineInfo[NFTRentLineHash].lender = quoteVars[_rentNft].NFTOwner;
        NFTRentLineInfo[NFTRentLineHash].verified = quoteVars[_rentNft].verified;
        NFTRentLineInfo[NFTRentLineHash].expert = quoteVars[_rentNft].expert;
        NFTRentLineInfo[NFTRentLineHash].NFTAmount = 1;
        NFTRentLineInfo[NFTRentLineHash].idealCollateralRatio = quoteVars[_rentNft].collateralAmount;
        // NFTRentLineInfo[NFTRentLineHash].liquidationThreshold = _liquidationThreshold;
        NFTRentLineInfo[NFTRentLineHash].borrowRate = quoteVars[_rentNft].dailyRentalPrice;
        NFTRentLineInfo[NFTRentLineHash].borrowAsset = _rentNft;
        NFTRentLineInfo[NFTRentLineHash].collateralAsset = quoteVars[_rentNft].collateralAsset;
        uint256 maxRentalDuration = quoteVars[_rentNft].maxRentalDuration;
        uint256 repayInterval = quoteVars[_rentNft].repayInterval;
        NFTRentLineInfo[NFTRentLineHash].repayments = maxRentalDuration.div(repayInterval);
        NFTRentLineInfo[NFTRentLineHash].repaymentsCompleted = maxRentalDuration.div(repayInterval);
        
        depositCollateral(_rentNft,quoteVars[_rentNft].collateralAmount,quoteVars[_rentNft].collateralAsset);
        NFTRentLineInfo[NFTRentLineHash].exists = true;

        NFTtoHash[_rentNft] = NFTRentLineHash;

        emit RentRequested(_rentNft,NFTRentLineHash);
    }

    function depositCollateral(address _rentNft, uint256 _amount, address _collateralAsset) internal {
        require(quotes[_rentNft], 'The quote does not exist');
        require(bytes32(NFTtoHash[_rentNft]).length != 0, 'The NFT is not rented');
        // require(quoteVars[_rentNft].collateralAmount <= _amount, 'Insufficient collateral is added');
        // Add condition for ether later
        IERC20(_collateralAsset).safeTransferFrom(msg.sender,address(this),_amount);
    }

    function calculateInterest(address _rentNft) internal returns(uint256 Interest) {
        // interest calculated as: daily rent price * rent interval 
        uint256 dailyRent  = quoteVars[_rentNft].dailyRentalPrice;
        uint256 repayInterval = quoteVars[_rentNft].repayInterval;
        uint256 Interest = dailyRent * repayInterval;
    }

    function SendNft(address _rentNft) external payable onlyNFTRentLineLender(NFTtoHash[_rentNft]) {
        require(quotes[_rentNft], 'The quote does not exist');
        require(bytes32(NFTtoHash[_rentNft]).length != 0, 'The NFT is not rented');
        bytes32 NFTRentLineHash = NFTtoHash[_rentNft];
        if(quoteVars[_rentNft].Towallet == true) {
            address to = payable(NFTRentLineInfo[NFTRentLineHash].borrower);
            uint256 tokenId = quoteVars[_rentNft].NFTId;
            IERC721(_rentNft).safeTransferFrom(msg.sender, to, tokenId);
        }
        else {
            // How to handle the Toescrow payments?
        }
        NFTRentLineInfo[NFTRentLineHash].currentStatus = NFTRentLineStatus.ACTIVE;
    }

    function RepayNft(address _rentNft) external payable onlyNFTRentLineBorrower(NFTtoHash[_rentNft]) {
        require(quotes[_rentNft], 'The quote does not exist');
        require(bytes32(NFTtoHash[_rentNft]).length != 0, 'The NFT is not rented');
        // Check if repayments are successfully completed
        bytes32 NFTRentLineHash = NFTtoHash[_rentNft];
        require(NFTRentLineInfo[NFTRentLineHash].repaymentsCompleted == 0, 'Please complete remaining repayments first');
        if(quoteVars[_rentNft].Towallet == true) {
            address to = payable(NFTRentLineInfo[NFTRentLineHash].lender);
            uint256 tokenId = quoteVars[_rentNft].NFTId;
            IERC721(_rentNft).safeTransferFrom(msg.sender, to, tokenId);
        }
        else {
            // How to handle the Toescrow payments?
        }
        NFTRentLineInfo[NFTRentLineHash].currentStatus = NFTRentLineStatus.CLOSED;
        // Give back the collateral stakes by the expert
    }

    function repayInterest(address _rentNft, uint256 _amount) external payable onlyNFTRentLineBorrower(NFTtoHash[_rentNft]) {
        bytes32 NFTRentLineHash = NFTtoHash[_rentNft];
        require(NFTRentLineInfo[NFTRentLineHash].repaymentsCompleted >= 1, 'All repayments are done');
        require(quotes[_rentNft], 'The quote does not exist');
        require(bytes32(NFTtoHash[_rentNft]).length != 0, 'The NFT is not rented');
        require(NFTRentLineInfo[NFTRentLineHash].currentStatus == NFTRentLineStatus.ACTIVE, 'Renting has not begun yet');
        uint256 Interest = calculateInterest(_rentNft);
        require(Interest==_amount, 'Insufficient amount');
        if(quoteVars[_rentNft].verified == true) {
            uint256 fees = _amount.mul(expertFee).div(10**30);
            uint256 payment = _amount.sub(fees);
            IERC20(quoteVars[_rentNft].collateralAsset).safeTransferFrom(msg.sender,address(this),payment);
            IERC20(quoteVars[_rentNft].collateralAsset).safeTransferFrom(msg.sender,quoteVars[_rentNft].expert,fees);
        }
        else {
            IERC20(quoteVars[_rentNft].collateralAsset).safeTransferFrom(msg.sender,address(this),_amount);
        }
        NFTRentLineInfo[NFTRentLineHash].repaymentsCompleted = NFTRentLineInfo[NFTRentLineHash].repaymentsCompleted - 1;
        emit Repaid(_rentNft,NFTRentLineInfo[NFTRentLineHash].repaymentsCompleted);
    }

    function liquidateStake(address _rentNft) internal returns(uint256 stake){
        require(bytes32(NFTtoHash[_rentNft]).length != 0, 'The NFT is not rented');
        stake = quoteVars[_rentNft].collateralAmount.mul(expertStake).div(10**30);
        // require(stake == _amount, 'Insufficient balance');
        // IERC20(quoteVars[_rentNft].collateralAsset).safeTransferFrom(address(this),msg.sender,_amount);
    }

    function claimDeposit(address _rentNft) external onlyNFTRentLineLender(NFTtoHash[_rentNft]) {
        require(bytes32(NFTtoHash[_rentNft]).length != 0, 'The NFT is not rented');
        // Add condition to check if the borrower defaulted
        address asset = quoteVars[_rentNft].collateralAsset;
        uint256 collateral = quoteVars[_rentNft].collateralAmount;
        uint256 repaymentsDone = NFTRentLineInfo[NFTtoHash[_rentNft]].repaymentsCompleted;
        uint256 TotalRepayments = NFTRentLineInfo[NFTtoHash[_rentNft]].repayments;
        uint256 remainder = TotalRepayments.sub(repaymentsDone);
        uint256 dailyRentalPrice = quoteVars[_rentNft].dailyRentalPrice;
        uint256 repaymentInterval = quoteVars[_rentNft].repayInterval;

        uint256 repaymentClaim = dailyRentalPrice.mul(remainder).mul(repaymentInterval);
        uint256 totalClaim = collateral.add(repaymentClaim);

        if(quoteVars[_rentNft].verified == true) {
            uint256 stake = liquidateStake(_rentNft);
            totalClaim = totalClaim.add(stake);
        }

        IERC20(asset).safeTransferFrom(address(this),msg.sender,totalClaim);
    }

    //TODO: How to check when borrower defaulted?
    //TODO: Check for logical errors
}