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
        default:
            return "https://aware-fake-trim-testnet.explorer.testnet.skalenodes.com";
    }
};

export const getChainName = chainId => {
    switch (chainId) {
        case 1020352220:
            return "Titan AI Hub Testnet";
        default:
            return "Titan AI Hub Testnet";
    }
};

export const getTokenSymbol = chainId => {
    switch (chainId) {
        case 1020352220:
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
