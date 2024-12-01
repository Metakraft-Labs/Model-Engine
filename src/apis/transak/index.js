import { Transak } from "@transak/transak-sdk";

export const transakConfig = {
    apiKey: process.env.REACT_APP_TRANSAK_API,
    environment: Transak.ENVIRONMENTS.STAGING,
    defaultFiatCurrency: "USD",
    networks: "skale",
    disableWalletAddressForm: true,
    //add email
    //add wallet
};
