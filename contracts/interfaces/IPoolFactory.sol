// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

interface IPoolFactory {
    function noYield() external view returns (address);

    function savingsAccount() external view returns (address);

    function owner() external view returns (address);

    function openBorrowPoolRegistry(address pool) external view returns (bool);

    function priceOracle() external view returns (address);

    function extension() external view returns (address);

    function repaymentImpl() external view returns (address);

    function userRegistry() external view returns (address);

    function collectionPeriod() external view returns (uint256);

    function matchCollateralRatioInterval() external view returns (uint256);

    function marginCallDuration() external view returns (uint256);

    function volatilityThreshold(address token) external view returns (uint256);

    function gracePeriodPenaltyFraction() external view returns (uint256);

    function liquidatorRewardFraction() external view returns (uint256);

    function votingPassRatio() external view returns (uint256);

    function poolCancelPenalityFraction() external view returns (uint256);

    function getProtocolFeeData() external view returns (uint256, address);
}
