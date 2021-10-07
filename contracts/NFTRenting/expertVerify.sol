// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import './NFTRentStorage.sol';
import './expertOnboard.sol';
import './NFTRent.sol';

contract expertVerify is NFTRentStorage, expertOnboard, NFTRent {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    mapping(address => bool) public VerifiedBorrowers;

    modifier OnlyExpert(address _expert) {
        require(bytes(expertData[_expert]).length != 0, 'The Expert alone can access this function');
        _;
    }

    event QuoteProvided(address _rentNft, uint256 _dailyRentPrice, uint256 _repayInterval);
    event BorrowerVerified(address _borrower);

    function verifyBorrower(address _borrower) external OnlyExpert(msg.sender) {
        require(!VerifiedBorrowers[_borrower], 'The borrower is already verified');
        // _verifyBorrower(_borrower);
        VerifiedBorrowers[_borrower] = true;
        emit BorrowerVerified(_borrower);
    }

    function provideQuote(address _rentNft, uint256 _dailyRentPrice, uint256 _repayInterval, bool _toescrow, bool _towallet) external OnlyExpert(msg.sender) {
        require(_rentNft != address(0), 'Invalid NFT address');
        require(!quotes[_rentNft], 'The quote already exists');
        require(_toescrow != _towallet, 'Both escrow and wallet cannot be set to same value');
        quoteVars[_rentNft].expert = msg.sender;
        quoteVars[_rentNft].verified = true;
        quoteVars[_rentNft].dailyRentalPrice = _dailyRentPrice;
        quoteVars[_rentNft].repayInterval = _repayInterval;
        quoteVars[_rentNft].Toescrow = _toescrow;
        quoteVars[_rentNft].Towallet = _towallet;
        emit QuoteProvided(_rentNft, _dailyRentPrice, _repayInterval);
    }

    // function _verifyBorrower(address _borrower) internal {
    //     // How to exactly verify the borrower
    // }

    function Stake(address _rentNft, uint256 _amount) external payable OnlyExpert(msg.sender) {
        require(bytes32(NFTtoHash[_rentNft]).length != 0, 'The NFT is not rented');
        require(NFTRentLineInfo[NFTtoHash[_rentNft]].currentStatus == NFTRentLineStatus.REQUESTED, 'Rent not requested');
        uint256 stake = quoteVars[_rentNft].collateralAmount.mul(expertStake).div(10**30);
        if(quoteVars[_rentNft].verified == true) {
            require(stake == _amount, 'The amount provided is not correct');
            depositCollateral(_rentNft, _amount, quoteVars[_rentNft].collateralAsset);
        }        
    }
    
}