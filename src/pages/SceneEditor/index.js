import {
    Box,
    Button,
    ButtonGroup,
    Drawer,
    Grid,
    IconButton,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { IoMdMenu } from "react-icons/io";
import { save } from "../../apis/scene-editor";
import { generate } from "../../apis/text23d";
import { UserStore } from "../../contexts/UserStore";

export default function SceneEditor() {
    const { updateUser } = useContext(UserStore);
    const [openMenu, setOpenMenu] = useState(false);
    const [models, setModels] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [sc, setSc] = useState(null);
    const [en, setEn] = useState(null);
    const [quality, setQuality] = useState("normal");

    const doDownload = async (scene, download = true) => {
        const serializedScene = BABYLON.SceneSerializer.Serialize(scene);
        if (download) {
            const strScene = JSON.stringify(serializedScene);
            const blob = new Blob([strScene], { type: "octet/stream" });
            const objectUrl = (window.webkitURL || window.URL).createObjectURL(blob);
            const link = window.document.createElement("a");
            link.href = objectUrl;
            link.download = "spark-scene.gltf";
            link.click();
            link.remove();
        } else {
            await save(serializedScene);
        }
    };

    const setDraggable = mesh => {
        const dragBehaviour = new BABYLON.PointerDragBehavior({
            dragAxis: new BABYLON.Vector3(1.5, 0, 0),
        });
        dragBehaviour.useObjectOrientationForDragging = true;

        dragBehaviour.attach(mesh);
        const dragBehavioury = new BABYLON.PointerDragBehavior({
            dragAxis: new BABYLON.Vector3(0, 1.5, 0),
        });
        dragBehavioury.useObjectOrientationForDragging = true;
        dragBehavioury.attach(mesh);
        const dragBehaviourz = new BABYLON.PointerDragBehavior({
            dragAxis: new BABYLON.Vector3(0, 0, 1.5),
        });
        dragBehaviourz.useObjectOrientationForDragging = true;
        dragBehaviourz.attach(mesh);
    };

    const importModel = (url, scene, position) => {
        url = url?.split("/");
        const obj = url.pop();
        BABYLON.SceneLoader.ImportMesh("", url?.join("/") + "/", obj, scene, function (newMeshes) {
            if (newMeshes[0]) {
                en.hideLoadingUI();
            }
            newMeshes[0].position = position;
            setDraggable(newMeshes[0]);
        });
    };

    useEffect(() => {
        var canvas = document.getElementById("renderCanvas"); // Get the canvas element
        //Option 1:
        //babylon pre-loaded, you can created engine already
        //var engine = new BABYLON.Engine(canvas, true);
        var engine;
        let scene;

        // Watch for browser/canvas resize events
        window.addEventListener("resize", function () {
            engine.resize();
        });

        // Dynamic Import
        // Option 1:
        // pre-load babylonjs from CDN, and use small vrspace script
        // this one imports all of vrspace
        import(/* webpackIgnore: true */ "/babylon/js/vrspace-min.js").then(ui => {
            if (!engine) {
                engine = new BABYLON.Engine(canvas, true);
            }

            // create the world
            class Connect extends ui.World {
                async createScene() {
                    this.engine = engine;
                    this.scene = new BABYLON.Scene(engine);
                    this.camera = new BABYLON.UniversalCamera(
                        "UniversalCamera",
                        new BABYLON.Vector3(0, 2, -10),
                        this.scene,
                    );
                    this.camera.maxZ = 100000;
                    this.camera.setTarget(BABYLON.Vector3.Zero());
                    this.camera.attachControl(canvas);
                    this.camera.checkCollisions = true;
                    var skybox = BABYLON.Mesh.CreateBox("skyBox", 100.0, this.scene);
                    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
                    skyboxMaterial.backFaceCulling = false;
                    skyboxMaterial.disableLighting = true;
                    skybox.material = skyboxMaterial;
                    skybox.infiniteDistance = true;
                    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
                        "https://www.babylonjs.com/assets/skybox/TropicalSunnyDay",
                        this.scene,
                    );
                    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
                    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
                    var light = new BABYLON.HemisphericLight(
                        "light",
                        new BABYLON.Vector3(0, 5, 0),
                        scene,
                    );

                    // Default intensity is 1. Let's dim the light a small amount
                    light.intensity = 10;

                    scene = this.scene;
                    setSc(scene);
                    setEn(engine);
                }
            }
            var connect = new Connect();
            connect.createScene();
            BABYLON.SceneLoader.ImportMesh(
                "",
                "https://spark3d-images.s3.us-east-1.amazonaws.com/3d-models/glb/",
                "5f85b48b-b0c3-40f2-b5e5-93e8c0c75031-tmp4g23dry4.glb",
                scene,
                function (newMeshes) {
                    if (newMeshes[0]) {
                        engine.hideLoadingUI();
                    }
                    newMeshes[0].position = new BABYLON.Vector3(0, 1, 1);
                    newMeshes[0].scaling = new BABYLON.Vector3(2, 3, 1);
                    setDraggable(newMeshes[0]);
                },
            );
            BABYLON.SceneLoader.ImportMesh(
                "",
                "https://spark3d-images.s3.us-east-1.amazonaws.com/3d-models/glb/",
                "ecb066cc-bbfb-4162-80c7-9268093a586a-tmpftxtns4h.glb",
                scene,
                function (newMeshes) {
                    if (newMeshes[0]) {
                        engine.hideLoadingUI();
                    }
                    newMeshes[0].position = new BABYLON.Vector3(-1, 0, 0);
                    setDraggable(newMeshes[0]);
                },
            );
            connect.registerRenderLoop();

            document
                .getElementById("export-scene")
                .addEventListener("click", () => doDownload(scene));

            document
                .getElementById("save-scene")
                .addEventListener("click", () => doDownload(scene, false));

            // create the world manager
            let world = ui.WorldManager.instance;
            if (!world) {
                world = new ui.WorldManager(connect);
            }
            world.debug = true; // world debug
            world.VRSPACE.debug = true; // network debug

            // all set, connect
            world.VRSPACE.connect();
        });

        return () => {
            document
                .getElementById("export-scene")
                .removeEventListener("click", () => doDownload(scene));
            document
                .getElementById("save-scene")
                .removeEventListener("click", () => doDownload(scene, false));
        };
    }, []);

    const generateModel = async e => {
        setLoading(true);
        e.preventDefault();

        const res = await generate({ prompt, quality: quality, type: "text" });

        if (res?.glbUrl) {
            setModels(models => {
                return [...models, { model: res?.glbUrl, image: res?.image, prompt }];
            });
        }
        await updateUser();

        setLoading(false);
    };

    return (
        <>
            <Box position={"absolute"} sx={{ right: "0" }}>
                <IconButton onClick={() => setOpenMenu(true)}>
                    <IoMdMenu />
                </IconButton>
            </Box>
            <canvas
                id="renderCanvas"
                style={{
                    width: "100vw",
                    height: "100vh",
                    paddingLeft: 0,
                    paddingRight: 0,
                    marginLeft: 0,
                    marginRight: 0,
                    display: "block",
                }}
                onDragOver={e => {
                    e.preventDefault();
                }}
                onDrop={e => {
                    console.log({ sc: sc.pointerZ });
                    importModel(e.dataTransfer.getData("model"), sc, new BABYLON.Vector3(0, 0, 0));
                    e.preventDefault();
                }}
            ></canvas>

            <div id="videos" hidden></div>

            <div id="iframe" style={{ position: "absolute", top: "0px", width: "100%" }}>
                <iframe
                    id="customAvatarFrame"
                    allow="camera *; microphone *"
                    width="100%"
                    height="800"
                    hidden={true}
                ></iframe>
            </div>
            <button style={{ display: "none" }} id="export-scene">
                export
            </button>
            <button style={{ display: "none" }} id="save-scene">
                save
            </button>
            <Drawer
                open={openMenu}
                onClose={() => setOpenMenu(false)}
                sx={{ zIndex: 999 }}
                anchor="right"
            >
                <Box
                    sx={{
                        width: 500,
                        height: "100vh",
                        background: "linear-gradient(79.98deg, #4A1995 -3.67%, #0F061F 101.19%)",
                        padding: "20px",
                    }}
                    role="presentation"
                >
                    <Box display={"flex"} gap={"20px"} flexDirection={"column"}>
                        <Box
                            display={"flex"}
                            justifyContent={"space-between"}
                            gap={"10px"}
                            alignItems={"center"}
                        >
                            <Typography color="#FFFFFF">Generate a Model</Typography>
                            <ButtonGroup
                                variant={"outlined"}
                                color={"secondary"}
                                fullWidth
                                sx={{
                                    flex: 0.1,
                                    border: "1px solid #A557CA",
                                    borderRadius: "8px",
                                }}
                            >
                                <Button
                                    variant={"outlined"}
                                    color={"secondary"}
                                    fullWidth
                                    sx={{
                                        border: "1px solid #A557CA",
                                        borderRadius: "8px",
                                    }}
                                    id={"save-scene-view"}
                                    disabled={loading}
                                    onClick={() => document.getElementById("save-scene").click()}
                                >
                                    Save
                                </Button>
                                <Button
                                    variant={"outlined"}
                                    color={"secondary"}
                                    fullWidth
                                    sx={{
                                        border: "1px solid #A557CA",
                                        borderRadius: "8px",
                                    }}
                                    id={"export-scene-view"}
                                    onClick={() => document.getElementById("export-scene").click()}
                                    disabled={!sc || loading}
                                >
                                    Export
                                </Button>
                            </ButtonGroup>
                        </Box>

                        <TextField
                            multiline
                            rows={4}
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            sx={{
                                border: "2px solid #202020",
                                background: "#000000",
                                borderRadius: "7px",
                                color: "#FFFFFF",
                                "& textarea": {
                                    color: "#FFFFFF",
                                },
                            }}
                        />
                        <Box
                            display={"flex"}
                            justifyContent={"space-between"}
                            gap={"10px"}
                            alignItems={"center"}
                        >
                            <Select
                                value={quality}
                                onChange={e => setQuality(e.target.value)}
                                sx={{
                                    border: "1px solid #B158F6",
                                    color: "#FFFFFF",
                                }}
                                size="small"
                            >
                                <MenuItem value={"normal"}>Quality - Basic | 1 credit</MenuItem>
                                <MenuItem value={"advanced"}>
                                    Quality - Advanced | 20 credit
                                </MenuItem>
                            </Select>
                            <Button
                                sx={{
                                    backgroundColor: "#B054F8",
                                    color: "white",
                                    borderRadius: "12px",
                                    padding: theme => theme.spacing(1.5, 3),
                                    textTransform: "none",
                                    "&:hover": {
                                        backgroundColor: "#B054F8",
                                        boxShadow: " 0px 0px 0px 3px rgba(81, 19, 103, 1)",
                                    },
                                }}
                                onClick={e => generateModel(e)}
                                disabled={!prompt || loading}
                            >
                                Generate
                            </Button>
                        </Box>
                    </Box>

                    <Grid container spacing={2} mt={2}>
                        {models?.map((model, index) => {
                            return (
                                <Grid
                                    item
                                    xs={6}
                                    md={6}
                                    key={`3d-models-list-${index}`}
                                    component={"div"}
                                    draggable={true}
                                    sx={{ cursor: "move" }}
                                    onDragStart={e => {
                                        e.dataTransfer.dropEffect = "copy";
                                        e.dataTransfer.setData("model", model?.model);
                                        setOpenMenu(false);
                                    }}
                                >
                                    <Box
                                        sx={{
                                            borderRadius: "10px",
                                            border: "1px solid #373737",
                                            boxShadow: "0px 0px 0px 3px rgba(0, 0, 0, 1)",
                                        }}
                                    >
                                        <img
                                            src={model?.image}
                                            width={"100%"}
                                            style={{ borderRadius: "10px" }}
                                            height={"100%"}
                                        />
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>
            </Drawer>
        </>
    );
}
