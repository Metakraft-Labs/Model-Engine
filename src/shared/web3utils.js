import { ethers } from "ethers";

export const minifyAddress = (address, middleChars = 4, endChars = 4) => {
    if (!address) return "";
    if (address.length < 20) return address;
    if (address.substr(-4) == ".eth") return address;
    return `${address.substring(0, middleChars + 2)}...${address.substring(
        address.length - endChars,
    )}`;
};

export const getSupportedChains = () => {
    return [
        {
            id: 1020352220,
            name: getChainName(1020352220),
            network: "Skale",
            nativeCurrency: {
                decimals: 18,
                name: "sFUEL",
                symbol: "sFUEL",
            },
            rpcUrls: {
                default: {
                    http: [getRPCURL(1020352220)],
                },
            },
            blockExplorers: {
                default: {
                    name: "Explorer",
                    url: getBlockExplorer(1020352220),
                },
            },
            testnet: true,
        },
        {
            id: 1350216234,
            name: getChainName(1350216234),
            network: "Skale",
            nativeCurrency: {
                decimals: 18,
                name: "sFUEL",
                symbol: "sFUEL",
            },
            rpcUrls: {
                default: {
                    http: [getRPCURL(1350216234)],
                },
            },
            blockExplorers: {
                default: {
                    name: "Explorer",
                    url: getBlockExplorer(1350216234),
                },
            },
            testnet: false,
        },
        {
            id: 80084,
            name: getChainName(80084),
            network: "Berachain",
            nativeCurrency: {
                decimals: 18,
                name: "BERA",
                symbol: "BERA",
            },
            rpcUrls: {
                default: {
                    http: [getRPCURL(80084)],
                },
            },
            blockExplorers: {
                default: {
                    name: "Explorer",
                    url: getBlockExplorer(80084),
                },
            },
            testnet: true,
        },
    ];
};

export const getBlockExplorer = chainId => {
    switch (chainId) {
        case 1020352220:
            return "https://aware-fake-trim-testnet.explorer.testnet.skalenodes.com";
        case 1350216234:
            return "https://parallel-stormy-spica.explorer.mainnet.skalenodes.com";
        case 80084:
            return "https://bartio.beratrail.io";
        default:
            return "https://aware-fake-trim-testnet.explorer.testnet.skalenodes.com";
    }
};

export const getRPCURL = chainId => {
    switch (chainId) {
        case 1020352220:
            return "https://testnet.skalenodes.com/v1/aware-fake-trim-testnet";
        case 1350216234:
            return "https://mainnet.skalenodes.com/v1/parallel-stormy-spica";
        case 80084:
            return "https://bartio.rpc.berachain.com";
        default:
            return "https://testnet.skalenodes.com/v1/aware-fake-trim-testnet";
    }
};

export const getChainName = chainId => {
    switch (chainId) {
        case 1020352220:
            return "Skale Titan AI Hub Testnet";
        case 1350216234:
            return "Skale Titan AI Hub";
        case 80084:
            return "Berachain bArtio";
        default:
            return "Skale Titan AI Hub Testnet";
    }
};

export const getTransactionContract = chainId => {
    switch (chainId) {
        case 1020352220:
            return "0xa162fA28D99735F3Afd5647da019B3CBBA4B00C5";
        case 1350216234:
            return "Titan AI Hub";
        default:
            return "0xa162fA28D99735F3Afd5647da019B3CBBA4B00C5";
    }
};

export const getTransactionAbi = async chainId => {
    switch (chainId) {
        case 1020352220:
            return (await import("../abis/TitanTestnetTransaction.json")).abi;
        case 1350216234:
            return "Titan AI Hub";
        default:
            return (await import("../abis/TitanTestnetTransaction.json")).abi;
    }
};

export const getMintContract = chainId => {
    switch (chainId) {
        case 1020352220:
            return "0xCc9d605CAe26e3C9F004c641952812E3D202b888";
        case 1350216234:
            return "0x17f2B4DeB46CfE6b864Fd3B397dA92F9AEe51D56";
        case 80084:
            return "0x933A21bc4F91Ad614302d7f5bbF3DfAbA004634f";
        default:
            return "0xCc9d605CAe26e3C9F004c641952812E3D202b888";
    }
};

export const getMintAbi = async chainId => {
    switch (chainId) {
        case 1020352220:
            return (await import("../abis/Mint.json")).abi;
        case 1350216234:
            return (await import("../abis/Mint.json")).abi;
        case 80084:
            return (await import("../abis/Mint.json")).abi;
        default:
            return (await import("../abis/Mint.json")).abi;
    }
};

export const getUSDCContract = chainId => {
    switch (chainId) {
        case 1020352220:
            return "0x10a30e73ab2da5328fc09b06443dde3e656e82f4";
        case 1350216234:
            return "Titan AI Hub";
        default:
            return "0x10a30e73ab2da5328fc09b06443dde3e656e82f4";
    }
};

export const getUSDCAbi = async chainId => {
    switch (chainId) {
        case 1020352220:
            return (await import("../abis/TitanTestnetUSDC.json")).abi;
        case 1350216234:
            return "Titan AI Hub";
        default:
            return (await import("../abis/TitanTestnetUSDC.json")).abi;
    }
};

export const getTokenSymbol = chainId => {
    switch (chainId) {
        case 1020352220:
            return "sFUEL";
        case 1350216234:
            return "sFUEL";
        case 80084:
            return "BERA";
        default:
            return "sFUEL";
    }
};

export const getPoWContract = chainId => {
    switch (chainId) {
        case 1020352220:
            return "0x08f98Af60eb83C18184231591A8F89577E46A4B9";
        case 1350216234:
            return "0xa5C297dF8f8386E4b940D61EF9A8f2bB367a6fAB";
        default:
            return "0x08f98Af60eb83C18184231591A8F89577E46A4B9";
    }
};

export const fixedBalance = (value, decimals = 18, decimalPlaces = 4) => {
    return Number(
        Math.round(parseFloat(ethers.formatUnits(value, decimals) + "e" + decimalPlaces)) +
            "e-" +
            decimalPlaces,
    );
};
