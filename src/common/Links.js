import React from "react";
import Error404 from "../pages/404";
import Home from "../pages/Home";
import Text23D from "../pages/Text23D";
import Text2Texture from "../pages/Text2Texture";
import Text2Motion from "../pages/Text2Motion";

export const Links = [
    {
        name: "Home",
        path: "/",
        element: <Home />,
        showInNavigation: true,
    },
    {
        name: "Text 2 3D",
        path: "/text-2-3d",
        element: <Text23D />,
        showInNavigation: true,
    },
    {
        name: "Text 2 Motion",
        path: "/text-2-motion",
        element: <Text2Motion />,
        showInNavigation: true,
    },
    {
        name: "Text 2 Texture",
        path: "/text-2-texture",
        element: <Text2Texture />,
        showInNavigation: true,
    },
    {
        name: "Error404",
        path: "*",
        element: <Error404 />,
        showInNavigation: false,
    },
];
