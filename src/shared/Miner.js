import { ethers, getNumber, isHexString, keccak256, randomBytes, toBeHex, toBigInt } from "ethers";

class Miner {
    static MAX_NUMBER = ethers.MaxUint256;

    async mineGasForTransaction(nonce, gas, from) {
        let address = from;
        nonce = isHexString(nonce) ? getNumber(nonce) : nonce;
        gas = isHexString(gas) ? getNumber(gas) : gas;
        return await this.mineFreeGas(gas, address, nonce);
    }

    async mineFreeGas(gasAmount, address, nonce) {
        let nonceHash = toBigInt(keccak256(toBeHex(nonce, 32)));
        let addressHash = toBigInt(keccak256(address));
        let nonceAddressXOR = nonceHash ^ addressHash;
        let divConstant = Miner.MAX_NUMBER;
        let candidate;
        let iterations = 0;

        const start = performance.now();

        while (true) {
            candidate = randomBytes(32);
            let candidateHash = toBigInt(keccak256(candidate));
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
            gasPrice: toBigInt(candidate),
        };
    }
}

export default Miner;
