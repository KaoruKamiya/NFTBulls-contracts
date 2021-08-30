import { Contracts } from "../../existingContracts/compound.json";

import { 
    ChainLinkAggregators, 
    WBTCWhale, 
    WhaleAccount, 
    UNIWhale
} from '../../utils/constants-Additions';

export const psLoanStagesTestCases = [
    {   
        Amount: 1,
        Whale1: WBTCWhale,
        Whale2: WhaleAccount,
        BorrowTokenParam: Contracts.DAI,
        CollateralTokenParam: Contracts.WBTC,
        liquidityBorrowTokenParam: Contracts.cDAI,
        liquidityCollateralTokenParam: Contracts.cWBTC2,
        chainlinkBorrowParam: ChainLinkAggregators['DAI/USD'],
        chainlinkCollateralParam: ChainLinkAggregators['BTC/USD']
    },
    {   
        Amount: 1,
        Whale1: WBTCWhale,
        Whale2: WhaleAccount,
        BorrowTokenParam: Contracts.UNI,
        CollateralTokenParam: Contracts.WBTC,
        liquidityBorrowTokenParam: Contracts.cUNI,
        liquidityCollateralTokenParam: Contracts.cWBTC2,
        chainlinkBorrowParam: ChainLinkAggregators['UNI/USD'],
        chainlinkCollateralParam: ChainLinkAggregators['BTC/USD']
    },
    {   
        Amount: 1,
        Whale1: WBTCWhale,
        Whale2: WhaleAccount,
        BorrowTokenParam: Contracts.USDC,
        CollateralTokenParam: Contracts.WBTC,
        liquidityBorrowTokenParam: Contracts.cUSDC,
        liquidityCollateralTokenParam: Contracts.cWBTC2,
        chainlinkBorrowParam: ChainLinkAggregators['USDC/USD'],
        chainlinkCollateralParam: ChainLinkAggregators['BTC/USD']
    },
    {   
        Amount: 1,
        Whale1: WBTCWhale,
        Whale2: WhaleAccount,
        BorrowTokenParam: Contracts.USDT,
        CollateralTokenParam: Contracts.WBTC,
        liquidityBorrowTokenParam: Contracts.cUSDT,
        liquidityCollateralTokenParam: Contracts.cWBTC2,
        chainlinkBorrowParam: ChainLinkAggregators['USDT/USD'],
        chainlinkCollateralParam: ChainLinkAggregators['BTC/USD']
    },
    {   
        Amount: 10,
        Whale1: WBTCWhale,
        Whale2: WhaleAccount,
        BorrowTokenParam: Contracts.Comp,
        CollateralTokenParam: Contracts.WBTC,
        liquidityBorrowTokenParam: Contracts.cComp,
        liquidityCollateralTokenParam: Contracts.cWBTC2,
        chainlinkBorrowParam: ChainLinkAggregators['COMP/USD'],
        chainlinkCollateralParam: ChainLinkAggregators['BTC/USD']
    },
    {   
        Amount: 100,
        Whale1: UNIWhale,
        Whale2: WhaleAccount,
        BorrowTokenParam: Contracts.USDC,
        CollateralTokenParam: Contracts.UNI,
        liquidityBorrowTokenParam: Contracts.cUSDC,
        liquidityCollateralTokenParam: Contracts.cUNI,
        chainlinkBorrowParam: ChainLinkAggregators['USDC/USD'],
        chainlinkCollateralParam: ChainLinkAggregators['UNI/USD']
    },
    {   
        Amount: 100,
        Whale1: UNIWhale,
        Whale2: WhaleAccount,
        BorrowTokenParam: Contracts.USDT,
        CollateralTokenParam: Contracts.UNI,
        liquidityBorrowTokenParam: Contracts.cUSDT,
        liquidityCollateralTokenParam: Contracts.cUNI,
        chainlinkBorrowParam: ChainLinkAggregators['USDT/USD'],
        chainlinkCollateralParam: ChainLinkAggregators['UNI/USD']
    },
    {   
        Amount: 100,
        Whale1: UNIWhale,
        Whale2: WhaleAccount,
        BorrowTokenParam: Contracts.DAI,
        CollateralTokenParam: Contracts.UNI,
        liquidityBorrowTokenParam: Contracts.cDAI,
        liquidityCollateralTokenParam: Contracts.cUNI,
        chainlinkBorrowParam: ChainLinkAggregators['DAI/USD'],
        chainlinkCollateralParam: ChainLinkAggregators['UNI/USD']
    },
    {   
        Amount: 100,
        Whale1: UNIWhale,
        Whale2: WhaleAccount,
        BorrowTokenParam: Contracts.DAI,
        CollateralTokenParam: Contracts.Comp,
        liquidityBorrowTokenParam: Contracts.cDAI,
        liquidityCollateralTokenParam: Contracts.cComp,
        chainlinkBorrowParam: ChainLinkAggregators['DAI/USD'],
        chainlinkCollateralParam: ChainLinkAggregators['COMP/USD']
    },
    {   
        Amount: 100,
        Whale1: UNIWhale,
        Whale2: WhaleAccount,
        BorrowTokenParam: Contracts.USDC,
        CollateralTokenParam: Contracts.Comp,
        liquidityBorrowTokenParam: Contracts.cUSDC,
        liquidityCollateralTokenParam: Contracts.cComp,
        chainlinkBorrowParam: ChainLinkAggregators['USDC/USD'],
        chainlinkCollateralParam: ChainLinkAggregators['COMP/USD']
    },
    {   
        Amount: 100,
        Whale1: UNIWhale,
        Whale2: WhaleAccount,
        BorrowTokenParam: Contracts.USDT,
        CollateralTokenParam: Contracts.Comp,
        liquidityBorrowTokenParam: Contracts.cUSDT,
        liquidityCollateralTokenParam: Contracts.cComp,
        chainlinkBorrowParam: ChainLinkAggregators['USDT/USD'],
        chainlinkCollateralParam: ChainLinkAggregators['COMP/USD']
    },
    {   
        Amount: 100,
        Whale1: UNIWhale,
        Whale2: WhaleAccount,
        BorrowTokenParam: Contracts.UNI,
        CollateralTokenParam: Contracts.Comp,
        liquidityBorrowTokenParam: Contracts.cUNI,
        liquidityCollateralTokenParam: Contracts.cComp,
        chainlinkBorrowParam: ChainLinkAggregators['UNI/USD'],
        chainlinkCollateralParam: ChainLinkAggregators['COMP/USD']
    }
];