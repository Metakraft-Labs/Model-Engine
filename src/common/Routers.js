import React, { useContext, useEffect, useMemo, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import LoadingBar from "react-top-loading-bar";
import UserStore from "../contexts/UserStore";
import Auth from "../pages/Auth";
import { Links } from "./Links";

export default function Routers() {
    const location = useLocation();
    const ref = useRef(null);

    const { user, userWallet } = useContext(UserStore);

    useEffect(() => {
        ref.current.complete();
    }, [location]);

    const showRoutes = useMemo(() => {
        return user && userWallet;
    }, [user, userWallet, location]);

    return (
        <>
            <LoadingBar ref={ref} />
            {showRoutes ? (
                <Routes>
                    {Links.map((route, i) => {
                        return <Route key={i} exact element={route.element} path={route.path} />;
                    })}
                </Routes>
            ) : (
                <Auth />
            )}
        </>
    );
}
