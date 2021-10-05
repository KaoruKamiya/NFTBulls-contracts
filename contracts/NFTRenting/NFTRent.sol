// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import './NFTRentStorage.sol';

contract NFTRent is NFTRentStorage, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

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

// Put events here to get the updates on the requested quotes made by the lender


    // function requestQuote()
// Lender requests expert for the quote
// Lender receives the quote and decides to either go with it 
// or define his own quote
// Upon identification of the final quote, 
}