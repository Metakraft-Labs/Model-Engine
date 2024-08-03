import { BigNumber, ethers } from "ethers";

const { isHexString, keccak256, randomBytes, hexlify } = ethers.utils;

export default class Miner {
    static MAX_NUMBER = ethers.constants.MaxUint256;

    async mineGasForTransaction(nonce, gas, from) {
        let address = from;
        nonce = isHexString(nonce) ? BigInt(nonce).toString() : nonce;
        gas = isHexString(gas) ? BigInt(gas).toString() : gas;
        return await this.mineFreeGas(gas, address, nonce);
    }

    async mineFreeGas(gasAmount, address, nonce) {
        let nonceHash = BigNumber.from(keccak256(hexlify(nonce, 32)));
        let addressHash = BigNumber.from(keccak256(address));
        let nonceAddressXOR = nonceHash ^ addressHash;
        let divConstant = Miner.MAX_NUMBER;
        let candidate;
        let iterations = 0;

        const start = performance.now();

        while (true) {
            candidate = randomBytes(32);
            let candidateHash = BigNumber.from(keccak256(candidate));
            let resultHash = nonceAddressXOR ^ candidateHash;
            let externalGas = divConstant / resultHash;

            if (externalGas >= gasAmount) {
                break;
            }
            // every 2k iterations, yield to the event loop
            if (iterations++ % 1_000 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        const end = performance.now();

        return {
            duration: start - end,
            gasPrice: BigNumber.from(candidate),
        };
    }
}
