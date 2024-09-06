import {
    bytesFromBase64,
    Client,
    Long,
    RedundancyType,
    VisibilityType,
} from "@bnb-chain/greenfield-js-sdk";
import { ReedSolomon } from "@bnb-chain/reed-solomon";
import { getMessage } from "../../apis/greenfield";
import { randomString } from "../../shared/strings";

const ADMIN = "0xcb1e08E5867C262F00813f6fCc5398727952f098";

export default function useGreenfield() {
    const client = Client.create(
        "https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org",
        String(5600),
    );

    const getSps = async () => {
        const sps = await client.sp.getStorageProviders();

        return sps;
    };

    const getAllSps = async () => {
        const sps = await getSps();

        return sps.map(sp => {
            return {
                address: sp.operatorAddress,
                endpoint: sp.endpoint,
                name: sp.description?.moniker,
            };
        });
    };

    const getOffchainAuthKeys = async () => {
        const address = ADMIN;
        const provider = {};
        provider.request = async ({ params }) => {
            params[0] = `0x${Buffer.from(params[0], "utf8").toString("hex")}`;
            await getMessage({ message: params[0], type: "personal" });
        };
        const storageResStr = localStorage.getItem(`storage-res-str-${address}`);

        if (storageResStr) {
            const storageRes = JSON.parse(storageResStr);
            if (storageRes.expirationTime < Date.now()) {
                alert("Your auth key has expired, please generate a new one");
                localStorage.removeItem(`storage-res-str-${address}`);
                return;
            }

            return storageRes;
        }

        const allSps = await getAllSps();
        const offchainAuthRes = await client.offchainauth.genOffChainAuthKeyPairAndUpload(
            {
                sps: allSps,
                chainId: 5600,
                expirationMs: 5 * 24 * 60 * 60 * 1000,
                domain: window.location.origin,
                address,
            },
            provider,
        );

        const { code, body: offChainData } = offchainAuthRes;
        if (code !== 0 || !offChainData) {
            throw offchainAuthRes;
        }

        localStorage.setItem(`storage-res-str-${address}`, JSON.stringify(offChainData));
        return offChainData;
    };

    const createObject = async (name, file) => {
        name = `${name}-${randomString(6)}`;
        const rs = new ReedSolomon();
        const fileBytes = await file.arrayBuffer();
        const expectCheckSums = rs.encode(new Uint8Array(fileBytes));
        const tx = await client.object.createObject({
            bucketName: "spark",
            objectName: name,
            creator: ADMIN,
            visibility: VisibilityType.VISIBILITY_TYPE_PRIVATE,
            contentType: file.type,
            redundancyType: RedundancyType.REDUNDANCY_EC_TYPE,
            payloadSize: Long.fromInt(file.size),
            expectChecksums: expectCheckSums.map(x => bytesFromBase64(x)),
        });
        const simulateInfo = await tx.simulate({
            denom: "BNB",
        });
        const broadcastRes = await tx.broadcast({
            denom: "BNB",
            gasLimit: Number(simulateInfo.gasLimit),
            gasPrice: simulateInfo.gasPrice,
            payer: ADMIN,
            granter: "",
            signTypedDataCallback: async (_addr, message) => {
                return await getMessage({
                    message,
                });
            },
        });
        return { txHash: broadcastRes.transactionHash, objNewName: name };
    };

    const uploadObject = async ({ file, name, txHash }) => {
        const offChainData = await getOffchainAuthKeys();

        const uploadRes = await client.object.uploadObject(
            {
                bucketName: "spark",
                objectName: name,
                body: file,
                txnHash: txHash,
            },
            {
                type: "EDDSA",
                domain: window.location.origin,
                seed: offChainData.seedString,
                address: ADMIN,
            },
        );
        console.log({ uploadRes });
        return "";
    };
    return {
        createObject,
        uploadObject,
    };
}
