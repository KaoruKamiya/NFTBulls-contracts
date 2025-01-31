import { calculateNewPoolAddress, createEnvironment, createNewPool } from '../../utils/createEnv';
import {
    CompoundPair,
    CreditLineDefaultStrategy,
    CreditLineInitParams,
    Environment,
    ExtensionInitParams,
    PoolCreateParams,
    PoolFactoryInitParams,
    PriceOracleSource,
    RepaymentsInitParams,
    YearnPair,
} from '../../utils/types';
import hre from 'hardhat';
import { Contracts } from '../../existingContracts/compound.json';

import {
    WBTCWhale,
    WhaleAccount,
    Binance7,
    ChainLinkAggregators,
    extensionParams,
    repaymentParams,
    testPoolFactoryParams,
} from '../../utils/constants-rahul';

import DeployHelper from '../../utils/deploys';
import { ERC20 } from '../../typechain/ERC20';
import { sha256 } from '@ethersproject/sha2';
import { BigNumber } from 'ethers';
import { IYield } from '../../typechain/IYield';
import { zeroAddress } from '../../utils/constants';

describe('Pool, Strategy: Compound, Borrow Token: USDT, CollateralToken: ETH', async () => {
    let env: Environment;
    before(async () => {
        env = await createEnvironment(
            hre,
            [WBTCWhale, WhaleAccount, Binance7],
            [
                { asset: Contracts.USDT, liquidityToken: Contracts.cUSDT },
                { asset: zeroAddress, liquidityToken: Contracts.cETH },
            ] as CompoundPair[],
            [] as YearnPair[],
            [
                { tokenAddress: zeroAddress, feedAggregator: ChainLinkAggregators['ETH/USD'] },
                { tokenAddress: Contracts.USDT, feedAggregator: ChainLinkAggregators['USDT/USD'] },
            ] as PriceOracleSource[],
            {
                votingPassRatio: extensionParams.votingPassRatio,
            } as ExtensionInitParams,
            {
                gracePenalityRate: repaymentParams.gracePenalityRate,
                gracePeriodFraction: repaymentParams.gracePeriodFraction,
            } as RepaymentsInitParams,
            {
                admin: '',
                _collectionPeriod: testPoolFactoryParams._collectionPeriod,
                _matchCollateralRatioInterval: testPoolFactoryParams._matchCollateralRatioInterval,
                _marginCallDuration: testPoolFactoryParams._marginCallDuration,
                _gracePeriodPenaltyFraction: testPoolFactoryParams._gracePeriodPenaltyFraction,
                _poolInitFuncSelector: testPoolFactoryParams._poolInitFuncSelector,
                _poolTokenInitFuncSelector: testPoolFactoryParams._poolTokenInitFuncSelector,
                _liquidatorRewardFraction: testPoolFactoryParams._liquidatorRewardFraction,
                _poolCancelPenalityFraction: testPoolFactoryParams._poolCancelPenalityFraction,
                _protocolFeeFraction: testPoolFactoryParams._protocolFeeFraction,
                protocolFeeCollector: '',
            } as PoolFactoryInitParams,
            CreditLineDefaultStrategy.Compound,
            { _protocolFeeFraction: testPoolFactoryParams._protocolFeeFraction } as CreditLineInitParams
        );
    });

    it('Sample', async function () {
        let salt = sha256(Buffer.from(`borrower-${new Date().valueOf()}`)); // one pool factory - one salt => 1 unique pool
        let { admin, borrower, lender } = env.entities;
        let deployHelper: DeployHelper = new DeployHelper(admin);
        let USDT: ERC20 = await deployHelper.mock.getMockERC20(Contracts.USDT);
        let ETH: ERC20 = await deployHelper.mock.getMockERC20(zeroAddress); // this is made into type only for matching the signature
        let iyield: IYield = await deployHelper.mock.getYield(env.yields.compoundYield.address);

        let poolAddress = await calculateNewPoolAddress(env, USDT, ETH, iyield, salt, false, {
            _poolSize: BigNumber.from(100).mul(BigNumber.from(10).pow(6)), // max possible borrow tokens in pool
            _minborrowAmount: BigNumber.from(10).mul(BigNumber.from(10).pow(6)), // 10 usdt
            _borrowRate: BigNumber.from(5).mul(BigNumber.from(10).pow(28)), // 100 * 10^28 in contract means 100% to outside
            _collateralAmount: BigNumber.from(1).mul(BigNumber.from(10).pow(18)), // 1 eth
            _collateralRatio: BigNumber.from(250).mul(BigNumber.from(10).pow(28)), //250 * 10**28
            _collectionPeriod: 10000,
            _matchCollateralRatioInterval: 200,
            _noOfRepaymentIntervals: 100,
            _repaymentInterval: 1000,
        });

        console.log({ calculatedPoolAddress: poolAddress });

        console.log(env.mockTokenContracts[1].name);
        await env.mockTokenContracts[1].contract.connect(env.impersonatedAccounts[0]).transfer(admin.address, '100000000');
        await env.mockTokenContracts[1].contract.connect(admin).transfer(borrower.address, '100000000');
        await env.mockTokenContracts[1].contract.connect(borrower).approve(poolAddress, '100000000');

        let pool = await createNewPool(env, USDT, ETH, iyield, salt, false, {
            _poolSize: BigNumber.from(100).mul(BigNumber.from(10).pow(6)), // max possible borrow tokens in pool
            _minborrowAmount: BigNumber.from(10).mul(BigNumber.from(10).pow(6)), // 10 usdt
            _borrowRate: BigNumber.from(5).mul(BigNumber.from(10).pow(28)), // 100 * 10^28 in contract means 100% to outside
            _collateralAmount: BigNumber.from(1).mul(BigNumber.from(10).pow(18)), // 1 eth
            _collateralRatio: BigNumber.from(250).mul(BigNumber.from(10).pow(28)), //250 * 10**28
            _collectionPeriod: 10000,
            _matchCollateralRatioInterval: 200,
            _noOfRepaymentIntervals: 100,
            _repaymentInterval: 1000,
        });

        console.log({ actualPoolAddress: pool.address });
    });
});
