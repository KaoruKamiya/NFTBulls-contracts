import { ethers, network } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { blockTravel, timeTravel } from '../../utils/time';

import {
    aaveYieldParams,
    depositValueToTest,
    zeroAddress,
    Binance7 as binance7,
    WhaleAccount as whaleAccount,
    WBTCWhale as wbtcwhale,
    DAI_Yearn_Protocol_Address,
    ETH_Yearn_Protocol_Address,
    WBTC_Yearn_Protocol_address,
    testPoolFactoryParams,
    createPoolParams,
    ChainLinkAggregators,
    OperationalAmounts,
    extensionParams,
    repaymentParams,
} from '../../utils/constants';
import DeployHelper from '../../utils/deploys';

import { SavingsAccount } from '@typechain/SavingsAccount';
import { StrategyRegistry } from '@typechain/StrategyRegistry';

import { getPoolAddress, getRandomFromArray, incrementChain, expectApproxEqual } from '../../utils/helpers';

import { Address } from 'hardhat-deploy/dist/types';
import { AaveYield } from '@typechain/AaveYield';
import { YearnYield } from '@typechain/YearnYield';
import { CompoundYield } from '@typechain/CompoundYield';
import { Pool } from '@typechain/Pool';
import { Verification } from '@typechain/Verification';
import { PoolFactory } from '@typechain/PoolFactory';
import { ERC20 } from '@typechain/ERC20';
import { PriceOracle } from '@typechain/PriceOracle';
import { Extension } from '@typechain/Extension';

import { Contracts } from '../../existingContracts/compound.json';
import { sha256 } from '@ethersproject/sha2';
import { PoolToken } from '@typechain/PoolToken';
import { Repayments } from '@typechain/Repayments';

import { getContractAddress } from '@ethersproject/address';

import { SublimeProxy } from '@typechain/SublimeProxy';
import { IYield } from '@typechain/IYield';
import { contracts } from 'scripts/contractsToVerify';

describe('Pool With Compound Strategy', async () => {
    let savingsAccount: SavingsAccount;
    let savingsAccountLogic: SavingsAccount;

    let strategyRegistry: StrategyRegistry;
    let strategyRegistryLogic: StrategyRegistry;

    let mockCreditLines: SignerWithAddress;
    let proxyAdmin: SignerWithAddress;
    let admin: SignerWithAddress;
    let borrower: SignerWithAddress;
    let lender: SignerWithAddress;
    let extraLenders: SignerWithAddress[];

    let aaveYield: AaveYield;
    let aaveYieldLogic: AaveYield;

    let yearnYield: YearnYield;
    let yearnYieldLogic: YearnYield;

    let compoundYield: CompoundYield;
    let compoundYieldLogic: CompoundYield;

    let BatTokenContract: ERC20;
    let LinkTokenContract: ERC20;
    let UNITokenContract: ERC20;
    let WBTCTokenContract: ERC20;
    let ETHTokenContract: ERC20;
    let DaiTokenContract: ERC20;

    let verificationLogic: Verification;
    let verification: Verification;

    let priceOracleLogic: PriceOracle;
    let priceOracle: PriceOracle;

    let Binance7: any;
    let WhaleAccount: any;
    let WBTCWhale: any;

    let extenstionLogic: Extension;
    let extenstion: Extension;

    let poolLogic: Pool;
    let poolTokenLogic: PoolToken;

    let repaymentLogic: Repayments;
    let repayments: Repayments;

    let poolFactoryLogic: PoolFactory;
    let poolFactory: PoolFactory;

    let pool: Pool;

    let poolToken: PoolToken;

    before(async () => {
        [proxyAdmin, admin, mockCreditLines, borrower, lender] = await ethers.getSigners();
        extraLenders = await (await ethers.getSigners()).slice(-100);

        let deployHelper: DeployHelper = new DeployHelper(proxyAdmin);
        savingsAccountLogic = await deployHelper.core.deploySavingsAccount();
        let savingsAccountProxy: SublimeProxy = await deployHelper.helper.deploySublimeProxy(
            savingsAccountLogic.address,
            proxyAdmin.address
        );
        savingsAccount = await deployHelper.core.getSavingsAccount(savingsAccountProxy.address);

        strategyRegistryLogic = await deployHelper.core.deployStrategyRegistry();
        let strategyRegistryProxy: SublimeProxy = await deployHelper.helper.deploySublimeProxy(
            strategyRegistryLogic.address,
            proxyAdmin.address
        );
        strategyRegistry = await deployHelper.core.getStrategyRegistry(strategyRegistryProxy.address);

        //initialize
        await savingsAccount.connect(admin).initialize(admin.address, strategyRegistry.address, mockCreditLines.address);
        await strategyRegistry.connect(admin).initialize(admin.address, 10);

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [binance7],
        });

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [whaleAccount],
        });

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [wbtcwhale],
        });

        await admin.sendTransaction({
            to: whaleAccount,
            value: ethers.utils.parseEther('100'),
        });

        await admin.sendTransaction({
            to: wbtcwhale,
            value: ethers.utils.parseEther('100'),
        });

        Binance7 = await ethers.provider.getSigner(binance7);
        WhaleAccount = await ethers.provider.getSigner(whaleAccount);
        WBTCWhale = await ethers.provider.getSigner(wbtcwhale);

        BatTokenContract = await deployHelper.mock.getMockERC20(Contracts.BAT);
        await BatTokenContract.connect(Binance7).transfer(admin.address, BigNumber.from('10').pow(23)); // 10,000 BAT tokens

        LinkTokenContract = await deployHelper.mock.getMockERC20(Contracts.LINK);
        await LinkTokenContract.connect(Binance7).transfer(admin.address, BigNumber.from('10').pow(23)); // 10,000 LINK tokens

        UNITokenContract = await deployHelper.mock.getMockERC20(Contracts.UNI);
        await UNITokenContract.connect(WhaleAccount).transfer(admin.address, BigNumber.from('10').pow(23)); // 10,000 UNI

        DaiTokenContract = await deployHelper.mock.getMockERC20(Contracts.DAI);
        await DaiTokenContract.connect(WhaleAccount).transfer(admin.address, BigNumber.from('10').pow(23)); // 10,000 UNI

        WBTCTokenContract = await deployHelper.mock.getMockERC20(Contracts.WBTC);
        await WBTCTokenContract.connect(WBTCWhale).transfer(admin.address, BigNumber.from('10').pow(10)); // 100 BTC

        ETHTokenContract = await deployHelper.mock.getMockERC20(zeroAddress);
        await ETHTokenContract.connect(WBTCWhale).transfer(admin.address, BigNumber.from('10').pow(10)); // 100 ETH

        aaveYieldLogic = await deployHelper.core.deployAaveYield();
        let aaveYieldProxy = await deployHelper.helper.deploySublimeProxy(aaveYieldLogic.address, proxyAdmin.address);
        aaveYield = await deployHelper.core.getAaveYield(aaveYieldProxy.address);

        await aaveYield
            .connect(admin)
            .initialize(
                admin.address,
                savingsAccount.address,
                aaveYieldParams._wethGateway,
                aaveYieldParams._protocolDataProvider,
                aaveYieldParams._lendingPoolAddressesProvider
            );

        await strategyRegistry.connect(admin).addStrategy(aaveYield.address);

        yearnYieldLogic = await deployHelper.core.deployYearnYield();
        let yearnYieldProxy = await deployHelper.helper.deploySublimeProxy(yearnYieldLogic.address, proxyAdmin.address);
        yearnYield = await deployHelper.core.getYearnYield(yearnYieldProxy.address);

        await yearnYield.connect(admin).initialize(admin.address, savingsAccount.address);
        await strategyRegistry.connect(admin).addStrategy(yearnYield.address);
        // await yearnYield.connect(admin).updateProtocolAddresses(zeroAddress, ETH_Yearn_Protocol_Address);
        // await yearnYield.connect(admin).updateProtocolAddresses(WBTCTokenContract.address, WBTC_Yearn_Protocol_address);

        compoundYieldLogic = await deployHelper.core.deployCompoundYield();
        let compoundYieldProxy = await deployHelper.helper.deploySublimeProxy(compoundYieldLogic.address, proxyAdmin.address);
        compoundYield = await deployHelper.core.getCompoundYield(compoundYieldProxy.address);

        await compoundYield.connect(admin).initialize(admin.address, savingsAccount.address);
        await strategyRegistry.connect(admin).addStrategy(compoundYield.address);
        await compoundYield.connect(admin).updateProtocolAddresses(Contracts.DAI, Contracts.cDAI);
        await compoundYield.connect(admin).updateProtocolAddresses(Contracts.UNI, Contracts.cUNI);
        await compoundYield.connect(admin).updateProtocolAddresses(Contracts.WBTC, Contracts.cWBTC2);
        await compoundYield.connect(admin).updateProtocolAddresses(zeroAddress, Contracts.cETH);

        await strategyRegistry.connect(admin).addStrategy(zeroAddress);

        verificationLogic = await deployHelper.helper.deployVerification();
        let verificationProxy = await deployHelper.helper.deploySublimeProxy(verificationLogic.address, proxyAdmin.address);
        verification = await deployHelper.helper.getVerification(verificationProxy.address);
        await verification.connect(admin).initialize(admin.address);
        await verification.connect(admin).registerUser(borrower.address, sha256(Buffer.from('Borrower')));

        priceOracleLogic = await deployHelper.helper.deployPriceOracle();
        let priceOracleProxy = await deployHelper.helper.deploySublimeProxy(priceOracleLogic.address, proxyAdmin.address);
        priceOracle = await deployHelper.helper.getPriceOracle(priceOracleProxy.address);
        await priceOracle.connect(admin).initialize(admin.address);

        // await priceOracle.connect(admin).setfeedAddress(Contracts.LINK, ChainLinkAggregators['LINK/USD']);
        await priceOracle.connect(admin).setfeedAddress(Contracts.DAI, ChainLinkAggregators['DAI/USD']);
        await priceOracle.connect(admin).setfeedAddress(Contracts.UNI, ChainLinkAggregators['UNI/USD']);
        await priceOracle.connect(admin).setfeedAddress(Contracts.WBTC, ChainLinkAggregators['BTC/USD']);
        await priceOracle.connect(admin).setfeedAddress(zeroAddress, ChainLinkAggregators['ETH/USD']);


        poolFactoryLogic = await deployHelper.pool.deployPoolFactory();
        let poolFactoryProxy = await deployHelper.helper.deploySublimeProxy(poolFactoryLogic.address, proxyAdmin.address);
        poolFactory = await deployHelper.pool.getPoolFactory(poolFactoryProxy.address);

        extenstionLogic = await deployHelper.pool.deployExtenstion();
        let extenstionProxy = await deployHelper.helper.deploySublimeProxy(extenstionLogic.address, proxyAdmin.address);
        extenstion = await deployHelper.pool.getExtension(extenstionProxy.address);
        await extenstion.connect(admin).initialize(poolFactory.address, extensionParams.votingPassRatio);

        repaymentLogic = await deployHelper.pool.deployRepayments();
        let repaymentProxy = await deployHelper.helper.deploySublimeProxy(repaymentLogic.address, proxyAdmin.address);
        repayments = await deployHelper.pool.getRepayments(repaymentProxy.address);
        await repayments
            .connect(admin)
            .initialize(
                admin.address,
                poolFactory.address,
                repaymentParams.gracePenalityRate,
                repaymentParams.gracePeriodFraction,
                savingsAccount.address
            );

        let {
            _collectionPeriod,
            _marginCallDuration,
            _collateralVolatilityThreshold,
            _gracePeriodPenaltyFraction,
            _liquidatorRewardFraction,
            _matchCollateralRatioInterval,
            _poolInitFuncSelector,
            _poolTokenInitFuncSelector,
            _poolCancelPenalityFraction,
        } = testPoolFactoryParams;

        await poolFactory
            .connect(admin)
            .initialize(
                verification.address,
                strategyRegistry.address,
                admin.address,
                _collectionPeriod,
                _matchCollateralRatioInterval,
                _marginCallDuration,
                _collateralVolatilityThreshold,
                _gracePeriodPenaltyFraction,
                _poolInitFuncSelector,
                _poolTokenInitFuncSelector,
                _liquidatorRewardFraction,
                priceOracle.address,
                savingsAccount.address,
                extenstion.address,
                _poolCancelPenalityFraction
            );

        poolLogic = await deployHelper.pool.deployPool();
        poolTokenLogic = await deployHelper.pool.deployPoolToken();

        await poolFactory.connect(admin).updateSupportedCollateralTokens(Contracts.DAI, true);
        await poolFactory.connect(admin).updateSupportedCollateralTokens(Contracts.UNI, true);
        await poolFactory.connect(admin).updateSupportedCollateralTokens(Contracts.LINK, true);
        await poolFactory.connect(admin).updateSupportedCollateralTokens(Contracts.WBTC, true);
        await poolFactory.connect(admin).updateSupportedCollateralTokens(zeroAddress, true); //ETH

        await poolFactory.connect(admin).updateSupportedBorrowTokens(Contracts.DAI, true);
        await poolFactory.connect(admin).updateSupportedBorrowTokens(Contracts.UNI, true);
        await poolFactory.connect(admin).updateSupportedBorrowTokens(Contracts.LINK, true);
        await poolFactory.connect(admin).updateSupportedBorrowTokens(Contracts.WBTC, true);
        await poolFactory.connect(admin).updateSupportedBorrowTokens(zeroAddress, true); //ETH

        await poolFactory.connect(admin).setImplementations(poolLogic.address, repayments.address, poolTokenLogic.address);
    });

    async function createPool() {
        let deployHelper = new DeployHelper(borrower);
        let collateralToken: ERC20 = await deployHelper.mock.getMockERC20(zeroAddress);
        let iyield: IYield = await deployHelper.mock.getYield(compoundYield.address);

        let salt = sha256(Buffer.from(`borrower-${new Date().valueOf()}`));
        // let salt = sha256(Buffer.from(`borrower}`));

        // console.log("Generate Pool Address");

        let generatedPoolAddress: Address = await getPoolAddress(
            borrower.address,
            Contracts.UNI,
            zeroAddress,
            iyield.address,
            poolFactory.address,
            salt,
            poolLogic.address,
            false,
            { _collateralAmount: createPoolParams._collateralAmountForWBTC
            }
        );

        // console.log("Generate Nonce");

        const nonce = (await poolFactory.provider.getTransactionCount(poolFactory.address)) + 1;
        let newPoolToken: string = getContractAddress({
            from: poolFactory.address,
            nonce,
        });

        let {
            _poolSize,
            _minborrowAmount,
            _collateralRatio,
            _borrowRate,
            _repaymentInterval,
            _noOfRepaymentIntervals,
            _collateralAmountForWBTC: _collateralAmount,
        } = createPoolParams;

        console.log("Transfer amount to borrower and approve");
        await collateralToken.connect(admin).transfer(borrower.address, _collateralAmount.mul(2)); // Transfer quantity to borrower
        await collateralToken.connect(borrower).approve(generatedPoolAddress, _collateralAmount.mul(2));
        // console.log("Create Pool");
        await expect(
            poolFactory
                .connect(borrower)
                .createPool(
                    _poolSize,
                    _minborrowAmount,
                    Contracts.UNI,
                    zeroAddress,
                    _collateralRatio,
                    _borrowRate,
                    _repaymentInterval,
                    _noOfRepaymentIntervals,
                    iyield.address,
                    _collateralAmount,
                    false,
                    salt
                )
        )
            .to.emit(poolFactory, 'PoolCreated')
            .withArgs(generatedPoolAddress, borrower.address, newPoolToken);

        // console.log("Pool Created");
        let newlyCreatedToken: PoolToken = await deployHelper.pool.getPoolToken(newPoolToken);

        expect(await newlyCreatedToken.name()).eq('Open Borrow Pool Tokens');
        expect(await newlyCreatedToken.symbol()).eq('OBPT');
        expect(await newlyCreatedToken.decimals()).eq(18);
        poolToken = newlyCreatedToken;

        console.log("Pool Borrow Token Created!");
        pool = await deployHelper.pool.getPool(generatedPoolAddress);
        // await pool.connect(borrower).depositCollateral(_collateralAmount, false);
    }

    describe('Check ratios', async () => {
        async function lenderLendsTokens(amount: BigNumberish, fromSavingsAccount = false): Promise<void> {
            //UNITokenContract
            await UNITokenContract.connect(admin).transfer(lender.address, amount);
            await UNITokenContract.connect(lender).approve(pool.address, amount);
            await pool.connect(lender).lend(lender.address, amount, fromSavingsAccount);
            return;
        }

        beforeEach(async () => {
            // lender supplies 1 DAI to the pool and lender.address is lender
            await createPool();
            let deployHelper = new DeployHelper(borrower);
            
            //UNITokenContract
            let token: PoolToken = await deployHelper.pool.getPoolToken(UNITokenContract.address);
            let decimals = await token.decimals();
            let expDecimals = BigNumber.from(10).pow(decimals);
            let oneToken = BigNumber.from(1).mul(expDecimals);
            await lenderLendsTokens(oneToken);
        });

        it('Check Ratio after borrowing borrow total 10 DAI with 1 UNI Collateral', async () => {
            let deployHelper = new DeployHelper(borrower);
            
            //UNITokenContract
            let token: PoolToken = await deployHelper.pool.getPoolToken(UNITokenContract.address);
            let decimals = await token.decimals();
            let numberOfTokens = 10;
            let expDecimals = BigNumber.from(numberOfTokens).pow(decimals);
            let oneToken = BigNumber.from(1).mul(expDecimals);

            let { _minborrowAmount } = createPoolParams;

            let borrowTokens = _minborrowAmount.sub(oneToken);
            await lenderLendsTokens(borrowTokens);

            const { loanStartTime } = await pool.poolConstants();
            await blockTravel(network, parseInt(loanStartTime.add(1).toString()));
            await pool.connect(borrower).withdrawBorrowedAmount();

            let pricePerToken = await priceOracle.connect(borrower).callStatic.getLatestPrice(zeroAddress, Contracts.UNI);
            let ratio = await pool.callStatic['getCurrentCollateralRatio()']();
            expectApproxEqual(pricePerToken[0], ratio.mul(numberOfTokens), BigNumber.from(10).pow(30).div(1000)); // 0.1 percent deviation
            expect(await UNITokenContract.balanceOf(borrower.address)).to.eq(_minborrowAmount);
        });

        it('User cannot borrow if lender/s has not supplied minimum number of tokens', async () => {
            const { loanStartTime } = await pool.poolConstants();
            await blockTravel(network, parseInt(loanStartTime.add(1).toString()));
            await expect(pool.connect(borrower).withdrawBorrowedAmount()).to.be.revertedWith('13');
        });
    });

    describe('Check Interest Rates', async () => {
        beforeEach(async () => {
            // lender supplies minimum DAI to the pool and lender.address is lender
            await createPool();
            
            //UNITokenContract
            await UNITokenContract.connect(admin).transfer(lender.address, createPoolParams._minborrowAmount);
            await UNITokenContract.connect(lender).approve(pool.address, createPoolParams._minborrowAmount);
            await pool.connect(lender).lend(lender.address, createPoolParams._minborrowAmount, false);
        });

        it('Increase time by one day and check interest and total Debt', async () => {
            const { loanStartTime } = await pool.poolConstants();
            await blockTravel(network, parseInt(loanStartTime.add(1).toString()));

            await pool.connect(borrower).withdrawBorrowedAmount();
            await blockTravel(network, parseInt(loanStartTime.add(BigNumber.from(1).mul(86400)).toString()));

            let interestFromChain = await pool.callStatic.interestTillNow(createPoolParams._minborrowAmount);
            let expectedInterest = BigNumber.from(createPoolParams._minborrowAmount)
                .mul(createPoolParams._borrowRate)
                .div(BigNumber.from(10).pow(30))
                .div(365);
            // console.table({ interestFromChain: interestFromChain.toString(), expectedInterest: expectedInterest.toString() });
            expectApproxEqual(interestFromChain, expectedInterest, expectedInterest.div(10000)); // 0.01 %
        });

        it('Increase time by one month and check interest and total Debt', async () => {
            const { loanStartTime } = await pool.poolConstants();
            await blockTravel(network, parseInt(loanStartTime.add(1).toString()));

            await pool.connect(borrower).withdrawBorrowedAmount();
            await blockTravel(network, parseInt(loanStartTime.add(BigNumber.from(30).mul(86400)).toString()));

            let interestFromChain = await pool.callStatic.interestTillNow(createPoolParams._minborrowAmount);
            let expectedInterest = BigNumber.from(createPoolParams._minborrowAmount)
                .mul(createPoolParams._borrowRate)
                .div(BigNumber.from(10).pow(30))
                .mul(30)
                .div(365);
            // console.table({ interestFromChain: interestFromChain.toString(), expectedInterest: expectedInterest.toString() });
            expectApproxEqual(interestFromChain, expectedInterest, expectedInterest.div(10000)); // 0.01 %
        });

        it('Increase time by 6 months and check interest and total Debt', async () => {
            const { loanStartTime } = await pool.poolConstants();
            await blockTravel(network, parseInt(loanStartTime.add(1).toString()));

            await pool.connect(borrower).withdrawBorrowedAmount();
            await blockTravel(network, parseInt(loanStartTime.add(BigNumber.from(182).mul(86400)).toString()));

            let interestFromChain = await pool.callStatic.interestTillNow(createPoolParams._minborrowAmount);
            let expectedInterest = BigNumber.from(createPoolParams._minborrowAmount)
                .mul(createPoolParams._borrowRate)
                .div(BigNumber.from(10).pow(30))
                .mul(182)
                .div(365);
            // console.table({ interestFromChain: interestFromChain.toString(), expectedInterest: expectedInterest.toString() });
            expectApproxEqual(interestFromChain, expectedInterest, expectedInterest.div(10000)); // 0.01 %
        });

        it('Increase time by 1 year and check interest and total Debt', async () => {
            const { loanStartTime } = await pool.poolConstants();
            await blockTravel(network, parseInt(loanStartTime.add(1).toString()));

            await pool.connect(borrower).withdrawBorrowedAmount();
            await blockTravel(network, parseInt(loanStartTime.add(BigNumber.from(365).mul(86400)).toString()));

            let interestFromChain = await pool.callStatic.interestTillNow(createPoolParams._minborrowAmount);
            let expectedInterest = BigNumber.from(createPoolParams._minborrowAmount)
                .mul(createPoolParams._borrowRate)
                .div(BigNumber.from(10).pow(30));
            // console.table({ interestFromChain: interestFromChain.toString(), expectedInterest: expectedInterest.toString() });
            expectApproxEqual(interestFromChain, expectedInterest, expectedInterest.div(10000)); // 0.01 %
        });
    });
});
