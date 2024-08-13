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
            name: "Skale Titan AI Hub Testnet",
            network: "Skale",
            nativeCurrency: {
                decimals: 18,
                name: "sFUEL",
                symbol: "sFUEL",
            },
            rpcUrls: {
                default: {
                    http: ["https://testnet.skalenodes.com/v1/aware-fake-trim-testnet"],
                },
            },
            blockExplorers: {
                default: {
                    name: "Explorer",
                    url: "https://aware-fake-trim-testnet.explorer.testnet.skalenodes.com",
                },
            },
        },
        {
            id: 1350216234,
            name: "Skale Titan AI Hub",
            network: "Skale",
            nativeCurrency: {
                decimals: 18,
                name: "sFUEL",
                symbol: "sFUEL",
            },
            rpcUrls: {
                default: {
                    http: ["https://mainnet.skalenodes.com/v1/parallel-stormy-spica"],
                },
            },
            blockExplorers: {
                default: {
                    name: "Explorer",
                    url: "https://parallel-stormy-spica.explorer.mainnet.skalenodes.com",
                },
            },
        },
    ];
};

export const getBlockExplorer = chainId => {
    switch (chainId) {
        case 1020352220:
            return "https://aware-fake-trim-testnet.explorer.testnet.skalenodes.com";
        case 1350216234:
            return "https://parallel-stormy-spica.explorer.mainnet.skalenodes.com";
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
        default:
            return "https://testnet.skalenodes.com/v1/aware-fake-trim-testnet";
    }
};

export const getFileStorageUrl = chainId => {
    switch (chainId) {
        case 1020352220:
            return "https://testnet.skalenodes.com/fs/aware-fake-trim-testnet";
        case 1350216234:
            return "https://mainnet.skalenodes.com/fs/parallel-stormy-spica";
        default:
            return "https://testnet.skalenodes.com/fs/aware-fake-trim-testnet";
    }
};

export const getChainName = chainId => {
    switch (chainId) {
        case 1020352220:
            return "Skale Titan AI Hub Testnet";
        case 1350216234:
            return "Skale Titan AI Hub";
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
