import React from "react";
import Error404 from "../pages/404";
import Auth from "../pages/Auth";
import Home from "../pages/Home";
import ModelViewer from "../pages/ModelViewer";
import SceneEditor from "../pages/SceneEditor";
import Text23D from "../pages/Text23D";
import Text2Motion from "../pages/Text2Motion";
import Text2Scene from "../pages/Text2Scene";
import Text2Texture from "../pages/Text2Texture";
import UserAccount from "../pages/User/Account";
import UserProjects from "../pages/User/Projects";

export const Links = [
    {
        name: "Home",
        path: "/",
        element: <Home />,
        showInNavigation: true,
    },
    {
        name: "Login",
        path: "/login",
        element: <Auth />,
        showInNavigation: true,
    },
    {
        name: "User Account Settings",
        path: "/user/account",
        element: <UserAccount />,
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
        name: "Text 2 Scene",
        path: "/text-2-scene",
        element: <Text2Scene />,
        showInNavigation: true,
    },
    {
        name: "Model Viewer",
        path: "/model-viewer",
        element: <ModelViewer />,
        showInNavigation: false,
    },
    {
        name: "Scene Editor",
        path: "/scene-editor",
        element: <SceneEditor />,
        showInNavigation: false,
    },
    {
        name: "My Projects",
        path: "/user/projects",
        element: <UserProjects />,
        showInNavigation: true,
    },
    {
        name: "Error404",
        path: "*",
        element: <Error404 />,
        showInNavigation: false,
    },
];
