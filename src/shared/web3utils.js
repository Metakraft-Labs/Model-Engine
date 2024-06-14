import { ethers } from "ethers";

export const minifyAddress = (address, middleChars = 4, endChars = 4) => {
    if (!address) return "";
    if (address.length < 20) return address;
    if (address.substr(-4) == ".eth") return address;
    return `${address.substring(0, middleChars + 2)}...${address.substring(
        address.length - endChars,
    )}`;
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
            return "Titan AI Hub Testnet";
        case 1350216234:
            return "Titan AI Hub";
        default:
            return "Titan AI Hub Testnet";
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

export const fixedBalance = (value, decimals = 18, decimalPlaces = 4) => {
    return Number(
        Math.round(parseFloat(ethers.formatUnits(value, decimals) + "e" + decimalPlaces)) +
            "e-" +
            decimalPlaces,
    );
};
