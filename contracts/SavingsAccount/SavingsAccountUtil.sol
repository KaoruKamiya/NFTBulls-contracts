// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import '../interfaces/ISavingsAccount.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

library SavingsAccountUtil {
    using SafeERC20 for IERC20;

    function depositFromSavingsAccount(
        ISavingsAccount _savingsAccount,
        address _from,
        address _to,
        uint256 _amount,
        address _asset,
        address _strategy,
        bool _withdrawShares,
        bool _toSavingsAccount
    ) internal returns (uint256) {
        if (_toSavingsAccount) {
            return savingsAccountTransfer(_savingsAccount, _from, _to, _amount, _asset, _strategy);
        } else {
            return withdrawFromSavingsAccount(_savingsAccount, _from, _to, _amount, _asset, _strategy, _withdrawShares);
        }
    }

    function directDeposit(
        ISavingsAccount _savingsAccount,
        address _from,
        address _to,
        uint256 _amount,
        address _asset,
        bool _toSavingsAccount,
        address _strategy
    ) internal returns (uint256) {
        if (_toSavingsAccount) {
            return directSavingsAccountDeposit(_savingsAccount, _from, _to, _amount, _asset, _strategy);
        } else {
            return transferTokens(_asset, _amount, _from, _to);
        }
    }

    function directSavingsAccountDeposit(
        ISavingsAccount _savingsAccount,
        address _from,
        address _to,
        uint256 _amount,
        address _asset,
        address _strategy
    ) internal returns (uint256 _sharesReceived) {
        transferTokens(_asset, _amount, _from, address(this));
        address _approveTo = _strategy;
        IERC20(_asset).safeApprove(_approveTo, _amount);
        _sharesReceived = _savingsAccount.depositTo(_amount, _asset, _strategy, _to);
    }

    function savingsAccountTransfer(
        ISavingsAccount _savingsAccount,
        address _from,
        address _to,
        uint256 _amount,
        address _asset,
        address _strategy
    ) internal returns (uint256) {
        if (_from == address(this)) {
            _savingsAccount.transfer(_asset, _to, _strategy, _amount);
        } else {
            _savingsAccount.transferFrom(_asset, _from, _to, _strategy, _amount);
        }
        return _amount;
    }

    function withdrawFromSavingsAccount(
        ISavingsAccount _savingsAccount,
        address _from,
        address _to,
        uint256 _amount,
        address _asset,
        address _strategy,
        bool _withdrawShares
    ) internal returns (uint256 _amountReceived) {
        if (_from == address(this)) {
            _amountReceived = _savingsAccount.withdraw(payable(_to), _amount, _asset, _strategy, _withdrawShares);
        } else {
            _amountReceived = _savingsAccount.withdrawFrom(_from, payable(_to), _amount, _asset, _strategy, _withdrawShares);
        }
    }

    function transferTokens(
        address _asset,
        uint256 _amount,
        address _from,
        address _to
    ) internal returns (uint256) {
        if (_amount == 0) {
            return 0;
        }
        if (_from == address(this)) {
            IERC20(_asset).safeTransfer(_to, _amount);
        } else {
            IERC20(_asset).safeTransferFrom(_from, _to, _amount);
        }
        return _amount;
    }
}
