// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.0;

interface IPool {
    function getLoanStatus() external view returns (uint256);

    function depositCollateral(uint256 _amount, bool _transferFromSavingsAccount) external payable;

    function addCollateralInMarginCall(
        address _lender,
        uint256 _amount,
        bool _isDirect
    ) external payable;

    function withdrawBorrowedAmount() external;

    function beforeTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external;

    function setConstants(address _poolToken, address _lenderVerifier) external;

    function borrower() external returns (address);

    function getMarginCallEndTime(address _lender) external returns (uint256);

    //function grantExtension() external returns (uint256); adding updateNextDuePeriodAfterExtension() for replacement
    //function updateNextDuePeriodAfterExtension() external returns (uint256);

    function getBalanceDetails(address _lender) external view returns (uint256, uint256);

    function getTotalSupply() external view returns (uint256);

    function closeLoan() external payable;
}
