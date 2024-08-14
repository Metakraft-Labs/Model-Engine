import React, { createContext, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { status } from "../apis/auth";
import useConnectWallet from "../hooks/useConnectWallet";

export const UserStore = createContext(null);

export default function UserProvider({ children, theme, setTheme, setLoading }) {
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [user, setUser] = useState(null);
    const [contract, setContract] = useState(null);
    const [connected, setConnected] = useState(false);
    const [userWallet, setUserWallet] = useState(null);
    const [signer, setSigner] = useState(null);
    const [balance, setBalance] = useState(0);
    const [chainId, setChainId] = useState(0);
    const [skynetBrowserInstance, setSkynetBrowserInstance] = useState(null);
    const { connectWallet, RenderPrivyOtpModal } = useConnectWallet({
        setContract,
        setUserWallet,
        user,
        setToken,
        setBalance,
        setChainId,
        setSigner,
        setSkynetBrowserInstance,
    });

    const getUser = useCallback(async () => {
        setLoading(true);
        if (token) {
            const res = await status();
            if (res) {
                setUser(res);
                const data = await connectWallet({
                    emailAddress: res?.email,
                    auth: false,
                    walletProvider: res?.provider,
                });

                if (data === 0) {
                    await new Promise(resolve => {
                        setTimeout(resolve, 2000);
                    });
                }
            } else {
                toast.error(`Cannot fetch user`);
            }
        }
        setLoading(false);
    }, [token]);

    const updateUser = async () => {
        const res = await status();
        if (res) {
            setUser(res);
        } else {
            toast.error(`Cannot fetch user`);
        }
    };

    useEffect(() => {
        getUser();
    }, [getUser]);

    return (
        <UserStore.Provider
            value={{
                theme,
                setTheme,
                token,
                setToken,
                user,
                setUser,
                contract,
                setContract,
                userWallet,
                setUserWallet,
                connected,
                setConnected,
                balance,
                setBalance,
                chainId,
                setChainId,
                updateUser,
                signer,
                setSigner,
                skynetBrowserInstance,
                setSkynetBrowserInstance,
            }}
        >
            {children}
            <RenderPrivyOtpModal />
        </UserStore.Provider>
    );
}
