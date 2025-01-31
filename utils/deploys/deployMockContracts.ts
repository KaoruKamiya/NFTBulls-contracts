import { BigNumberish, Signer } from 'ethers';

import { ERC20 } from '../../typechain/ERC20';
import { IWETHGateway } from '../../typechain/IWETHGateway';
import { IyVault } from '../../typechain/IyVault';
import { ICEther } from '../../typechain/ICEther';
import { Token } from '../../typechain/Token';

import { ERC20__factory } from '../../typechain/factories/ERC20__factory';
import { IWETHGateway__factory } from '../../typechain/factories/IWETHGateway__factory';
import { IyVault__factory } from '../../typechain/factories/IyVault__factory';
import { ICEther__factory } from '../../typechain/factories/ICEther__factory';
import { IYield__factory } from '../../typechain/factories/IYield__factory';
import { Token__factory } from '../../typechain/factories/Token__factory';

import { Address } from 'hardhat-deploy/dist/types';
import { IYield } from '../../typechain/IYield';
import { IERC721 } from '../../typechain/IERC721';
import { IERC721__factory } from '../../typechain/factories/IERC721__factory';

export default class DeployMockContracts {
    private _deployerSigner: Signer;

    constructor(deployerSigner: Signer) {
        this._deployerSigner = deployerSigner;
    }

    public async deployMockERC20(): Promise<ERC20> {
        return await new ERC20__factory(this._deployerSigner).deploy();
    }

    public async getMockERC20(tokenAddress: Address): Promise<ERC20> {
        return await new ERC20__factory(this._deployerSigner).attach(tokenAddress);
    }

    public async getMockIWETHGateway(wethGatewayAddress: Address): Promise<IWETHGateway> {
        return await IWETHGateway__factory.connect(wethGatewayAddress, this._deployerSigner);
    }

    public async getMockIyVault(vaultAddress: Address): Promise<IyVault> {
        return await IyVault__factory.connect(vaultAddress, this._deployerSigner);
    }

    public async getMockICEther(cethAddress: Address): Promise<ICEther> {
        return await ICEther__factory.connect(cethAddress, this._deployerSigner);
    }

    public async getYield(yieldAddress: Address): Promise<IYield> {
        return await IYield__factory.connect(yieldAddress, this._deployerSigner);
    }

    public async deployToken(name: string, symbol: string, initSupply: BigNumberish): Promise<Token> {
        return await new Token__factory(this._deployerSigner).deploy(name, symbol, initSupply);
    }

    public async getToken(token: Address): Promise<Token> {
        return await Token__factory.connect(token, this._deployerSigner);
    }

    public async getMockERC721(NFTAddress: Address): Promise<IERC721> {
        return await IERC721__factory.connect(NFTAddress, this._deployerSigner);
    }
}
