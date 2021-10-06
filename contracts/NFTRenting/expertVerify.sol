// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import './NFTRentStorage.sol';
import './expertOnboard.sol';

contract expertVerify is NFTRentStorage, expertOnboard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    mapping(address => bool) VerifiedBorrowers;

    modifier OnlyExpert(address _expert) {
        require(expertData[_expert], 'The Expert alone can access this function');
        _;
    }

    function verifyBorrower(address _borrower) OnlyExpert {
        // How to exactly verify the borrower by an expert
    }

    function provideQuote(address _rentNft, uint256 _dailyRentPrice, bool _toescrow, bool _towallet) external OnlyExpert {
        require(_rentNft != address(0), 'Invalid NFT address');
        require(!quotes[_rentNft], 'The quote already exists');
        require(_toescrow != _towallet, 'Both escrow and wallet cannot be set to same value');
        quoteVars[_rentNft].expert = msg.sender;
        quoteVars[_rentNft].verified = true;
        quoteVars[_rentNft].dailyRentalPrice = _dailyRentalPrice;
        quoteVars[_rentNft].Toescrow = _toescrow;
        quoteVars[_rentNft].Towallet = _towallet;
    }
    
}