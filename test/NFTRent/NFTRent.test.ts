import { ethers, network } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { expect } from 'chai';

import {
    Binance7 as binance7,
    WhaleAccount as whaleAccount,
    WBTCWhale as wbtcwhale,
} from '../../utils/constants';
import DeployHelper from '../../utils/deploys';

import { Verification } from '../../typechain/Verification';
import { AdminVerifier } from '@typechain/AdminVerifier';
import { sha256 } from '@ethersproject/sha2';
import { NFTRent } from '../../typechain/NFTRent';
import { ERC20 } from '../../typechain/ERC20';
import { Contracts } from '../../existingContracts/compound.json';
import { IERC721 } from '../../typechain/IERC721';
import { ERC721 } from '../../typechain/ERC721';

describe.only('WBTC-NFT RentLine', async () => {
    let WBTCTokenContract: ERC20;
    let Binance7: any;
    let WBTCWhale: any;
    let NFTContract: IERC721;

    let Verification: Verification;
    let adminVerifier: AdminVerifier;
    let NFTRent: NFTRent;

    let proxyAdmin: SignerWithAddress;
    let admin: SignerWithAddress;
    let expert: SignerWithAddress;
    let borrower: SignerWithAddress;
    let lender: SignerWithAddress;
    let extraAccounts: SignerWithAddress[];

    before(async () => {
        [proxyAdmin, admin, expert, borrower, lender] = await ethers.getSigners();
        extraAccounts = (await ethers.getSigners()).slice(-100);

        let deployHelper: DeployHelper = new DeployHelper(proxyAdmin);

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [binance7],
        });

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [wbtcwhale],
        });

        await admin.sendTransaction({
            to: binance7,
            value: ethers.utils.parseEther('100'),
        });

        await admin.sendTransaction({
            to: wbtcwhale,
            value: ethers.utils.parseEther('100'),
        });

        Binance7 = ethers.provider.getSigner(binance7);
        WBTCWhale = ethers.provider.getSigner(wbtcwhale);

        WBTCTokenContract = await deployHelper.mock.getMockERC20(Contracts.WBTC);
        await WBTCTokenContract.connect(WBTCWhale).transfer(admin.address, BigNumber.from('10').pow(10)); // 100 BTC

        Verification = await deployHelper.helper.deployVerification();
        NFTRent = await deployHelper.core.deployNFTRent();
        await Verification.connect(admin).initialize(admin.address);
        adminVerifier = await deployHelper.helper.deployAdminVerifier();
        await Verification.connect(admin).addVerifier(adminVerifier.address);
        await Verification.connect(admin).addVerifier(NFTRent.address);
        await NFTRent.connect(admin).initialize(admin.address,Verification.address);
        await NFTRent.connect(admin).addExpert(expert.address, sha256(Buffer.from('@AxieInfinity')));

        // Getting mock erc721
        // console.log('Getting Cyberpop');
        // NFTContract = await deployHelper.mock.getMockERC721(Cyberpop);
        // await NFTContract.connect(Binance7).transferFrom(Binance7,admin.address,1140); // Getting Cyberpop
        // console.log('Getting HoneyBadger');
        // NFTContract= await deployHelper.mock.getMockERC721(HoneyBadger);
        // await NFTContract.connect(Binance7).transferFrom(Binance7,admin.address,340); // Getting HoneyBadger
    });

    describe('Create rent request', async () => {
        it('Quote request by lender', async () => {
            const Cyberpop = '0x3a3b0dbdc0f6bc77421dcd2f55cfa087b0db9aec'; //Cyberpop
            const HoneyBadger = '0xd498fc4289ecbcf5c9ef033de3ceddc1fc3f6cc3'; //HoneyBadger
            let compareAddress = ethers.utils.getAddress(Cyberpop);
            let compareCollateral = ethers.utils.getAddress(Contracts.WBTC);
            let NFTId: BigNumberish = BigNumber.from('1140');
            await expect(NFTRent.connect(lender).requestQuote(Cyberpop, NFTId, 10, Contracts.WBTC))
                .emit(NFTRent, 'QuoteRequested')
                .withArgs('Cyberpop Gallery',compareAddress,NFTId,compareCollateral,10);
        });

        it('Should not be able to request quote again', async () => {
            const Cyberpop = '0x3a3b0dbdc0f6bc77421dcd2f55cfa087b0db9aec'; //Cyberpop
            const HoneyBadger = '0xd498fc4289ecbcf5c9ef033de3ceddc1fc3f6cc3'; //HoneyBadger
            let NFTId: BigNumberish = BigNumber.from('1140');
            await expect(NFTRent.connect(lender).requestQuote(Cyberpop, NFTId, 10, Contracts.WBTC))
                .to.be.revertedWith('The quote already exists');
        });

        it('Only expert should be able to give a quote', async () => {
            const Cyberpop = '0x3a3b0dbdc0f6bc77421dcd2f55cfa087b0db9aec'; //Cyberpop
            const HoneyBadger = '0xd498fc4289ecbcf5c9ef033de3ceddc1fc3f6cc3'; //HoneyBadger
            let compareAddress = ethers.utils.getAddress(Cyberpop);
            let NFTId: BigNumberish = BigNumber.from('1140');
            let random = extraAccounts[10];
            await expect(NFTRent.connect(random).provideQuote(Cyberpop,NFTId,10,1000,2,false,true))
                .to.be.revertedWith('The Expert alone can access this function');

            await expect(NFTRent.connect(expert).provideQuote(Cyberpop,NFTId,10,1000,2,false,true))
                .emit(NFTRent, 'QuoteProvided')
                .withArgs(compareAddress,NFTId,10,2,1000);
        });

        it('Lender should be able to accept the quote suggested by the expert', async() => {
            const Cyberpop = '0x3a3b0dbdc0f6bc77421dcd2f55cfa087b0db9aec'; //Cyberpop
            const HoneyBadger = '0xd498fc4289ecbcf5c9ef033de3ceddc1fc3f6cc3'; //HoneyBadger
            let compareAddress = ethers.utils.getAddress(Cyberpop);
            let NFTId: BigNumberish = BigNumber.from('1140');
            await expect(NFTRent.connect(lender).AcceptQuote(Cyberpop,NFTId))
                .emit(NFTRent, 'QuoteAccepted')
                .withArgs(compareAddress,(await NFTRent.quoteVarsInfo(Cyberpop,NFTId)).dailyRentalPrice);
        });
    });
    // NFTContract.connect(admin).approve(lender.address,NFTId);
    // NFTContract.connect(admin).transferFrom(admin.address,lender.address,NFTId);
});
