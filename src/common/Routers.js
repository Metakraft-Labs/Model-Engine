import React, { useContext, useEffect, useMemo, useRef } from "react";
import { Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import LoadingBar from "react-top-loading-bar";
import UserStore from "../contexts/UserStore";
import Auth from "../pages/Auth";
import { Links } from "./Links";

export default function Routers() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const ref = useRef(null);

    const { user, userWallet } = useContext(UserStore);

    useEffect(() => {
        const refBy = searchParams.get("ref");
        if (refBy) {
            localStorage.setItem("ref_by", refBy);
        }
        ref.current.complete();
    }, [location, searchParams]);

    const showRoutes = useMemo(() => {
        return (user && userWallet) || location.pathname === "/model-viewer";
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
