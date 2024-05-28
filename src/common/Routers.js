import React, { useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import LoadingBar from "react-top-loading-bar";
import { Links } from "./Links";

export default function Routers() {
  const location = useLocation();
  const ref = useRef(null);
  useEffect(() => {
    ref.current.complete();
  }, [location]);
  return (
    <>
      <LoadingBar ref={ref} />
      <Routes>
        {Links.map((route, i) => {
          return (
            <Route key={i} exact element={route.element} path={route.path} />
          );
        })}
      </Routes>
    </>
  )
}
