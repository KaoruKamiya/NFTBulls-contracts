// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '../interfaces/IVerification.sol';

contract expertOnboard is Initializable, OwnableUpgradeable {
    IVerification public verification;

    mapping(address => string) public expertData;

    event VerifierAdded(address verifier, string metadata);
    event VerifierRemoved(address verifier);

    /// @notice Initializes the variables of the contract
    /// @dev Contract follows proxy pattern and this function is used to initialize the variables for the contract in the proxy
    /// @param _admin Admin of the verification contract who can add verifiers and remove masterAddresses deemed invalid
    function initialize(address _admin, address _verification) public initializer {
        super.__Ownable_init();
        super.transferOwnership(_admin);
        verification = IVerification(_verification);
    }

    /// @notice owner can add new verifier
    /// @dev Verifier can add master address or remove addresses added by it
    /// @param _verifier Address of the verifier contract
    /// @param _metadata Data associated with the Expert
    function addExpert(address _verifier, string memory _metadata) external onlyOwner {
        require(bytes(expertData[_verifier]).length == 0, 'AddExpert: Verifier already exists');
        // verification.addVerifier(_verifier);
        verification.registerMasterAddress(_verifier, true);
        expertData[_verifier] = _metadata;
        emit VerifierAdded(_verifier, _metadata);
    }

    /// @notice owner can remove exisiting verifier
    /// @dev Verifier can add master address or remove addresses added by it
    /// @param _verifier Address of the verifier contract
    function removeExpert(address _verifier) external onlyOwner {
        require(bytes(expertData[_verifier]).length != 0, 'AddExpert: Verifier does not exists');
        delete expertData[_verifier];
        verification.unregisterMasterAddress(_verifier, address(this));
        // verification.removeVerifier(_verifier);
        emit VerifierRemoved(_verifier);
    }
}
