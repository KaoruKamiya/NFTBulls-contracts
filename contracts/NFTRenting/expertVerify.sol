// // SPDX-License-Identifier: MIT
// pragma solidity 0.7.0;

// import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
// import '@openzeppelin/contracts/math/SafeMath.sol';
// import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
// import './NFTRentStorage.sol';
// import './expertOnboard.sol';
// import './NFTRent.sol';

//

// contract expertVerify is NFTRentStorage, NFTRent {
//     using SafeERC20 for IERC20;
//     using SafeMath for uint256;

//     expertOnboard ExpertOnboarding = new expertOnboard();

//     mapping(address => bool) public VerifiedBorrowers;

//     modifier OnlyExpert(address _expert) {
//         require(bytes(ExpertOnboarding.expertData(_expert)).length != 0, 'The Expert alone can access this function');
//         _;
//     }

//     event QuoteProvided(address _rentNft, uint256 _NftId, uint256 _dailyRentPrice, uint256 _repayInterval, uint256 _collateralAmount);
//     event BorrowerVerified(address _borrower);

//     function verifyBorrower(address _borrower) external OnlyExpert(msg.sender) {
//         require(!VerifiedBorrowers[_borrower], 'The borrower is already verified');
//         // _verifyBorrower(_borrower);
//         VerifiedBorrowers[_borrower] = true;
//         emit BorrowerVerified(_borrower);
//     }

//     function provideQuote(
//         address _rentNft,
//         uint256 _nftId,
//         uint256 _dailyRentPrice,
//         uint256 _collateralAmount,
//         uint256 _repayInterval,
//         bool _toescrow,
//         bool _towallet
//     ) external OnlyExpert(msg.sender) {
//         require(_rentNft != address(0), 'Invalid NFT address');
//         require(!quotes[_rentNft][_nftId], 'The quote already exists');
//         require(_toescrow != _towallet, 'Both escrow and wallet cannot be set to same value');
//         quoteVarsInfo[_rentNft][_nftId].expert = msg.sender;
//         quoteVarsInfo[_rentNft][_nftId].verified = true;
//         quoteVarsInfo[_rentNft][_nftId].dailyRentalPrice = _dailyRentPrice;
//         quoteVarsInfo[_rentNft][_nftId].collateralAmount = _collateralAmount;
//         quoteVarsInfo[_rentNft][_nftId].repayInterval = _repayInterval;
//         quoteVarsInfo[_rentNft][_nftId].Toescrow = _toescrow;
//         quoteVarsInfo[_rentNft][_nftId].Towallet = _towallet;
//         emit QuoteProvided(_rentNft, _nftId, _dailyRentPrice, _repayInterval, _collateralAmount);
//     }

//     function Stake(
//         address _rentNft,
//         uint256 _nftId,
//         uint256 _amount
//     ) external payable OnlyExpert(msg.sender) {
//         bytes32 NFTRentLineHash = NFTtoHash[_rentNft][_nftId];
//         require(NFTRentLineInfo[NFTRentLineHash].exists, 'The NFT rent line does not exist');
//         require(NFTRentLineInfo[NFTRentLineHash].currentStatus == NFTRentLineStatus.REQUESTED, 'Rent not requested');
//         uint256 stake = quoteVarsInfo[_rentNft][_nftId].collateralAmount.mul(expertStake).div(10**30);
//         if (quoteVarsInfo[_rentNft][_nftId].verified == true) {
//             require(stake == _amount, 'The amount provided is not correct');
//             depositCollateral(_rentNft, _nftId, _amount);
//         }
//     }

//     function ClaimStake(address _rentNft, uint256 _nftId) external OnlyExpert(msg.sender) {
//         bytes32 NFTRentLineHash = NFTtoHash[_rentNft][_nftId];
//         require(NFTRentLineInfo[NFTRentLineHash].exists, 'The NFT rent line does not exist');
//         require(NFTRentLineInfo[NFTRentLineHash].currentStatus == NFTRentLineStatus.CANCELLED, 'Rent not cancelled');
//         uint256 stake = quoteVarsInfo[_rentNft][_nftId].collateralAmount.mul(expertStake).div(10**30);
//         if (quoteVarsInfo[_rentNft][_nftId].verified == true) {
//             _claimCollateral(_rentNft, _nftId, stake);
//         }
//     }

//     function GetStakeBack(address _rentNft, uint256 _nftId) external OnlyExpert(msg.sender) {
//         bytes32 NFTRentLineHash = NFTtoHash[_rentNft][_nftId];
//         require(NFTRentLineInfo[NFTRentLineHash].exists, 'The NFT rent line does not exist');
//         require(NFTRentLineInfo[NFTRentLineHash].currentStatus == NFTRentLineStatus.CLOSED, 'Rent not closed');
//         uint256 stake = quoteVarsInfo[_rentNft][_nftId].collateralAmount.mul(expertStake).div(10**30);
//         if (quoteVarsInfo[_rentNft][_nftId].verified == true) {
//             _claimCollateral(_rentNft, _nftId, stake);
//         }
//     }
// }
