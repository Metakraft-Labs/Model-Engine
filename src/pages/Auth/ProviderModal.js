import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { Box, Button, Typography } from "@mui/material";
import React, { useState } from "react";
import Modal from "../../components/Modal";
import { getSupportedChains } from "../../shared/web3utils";

export default function ProviderModal({
    loginModal,
    defaultSelections,
    open,
    onClose,
    // query,
    // email,
}) {
    const [selectedProvider, setSelectedProvider] = useState("");
    const [selectedChain, setSelectedChain] = useState();
    const {
        data: { bech32Address },
    } = useAbstraxionAccount();

    React.useEffect(() => {
        if (bech32Address) {
            loginModal("xion");
        }
    }, [bech32Address]);

    // const handleXion = () => {
    //     const data = {
    //         email: email,
    //         provider: "xion",
    //     };
    //     if (query) {
    //         data["ref"] = query;
    //     }
    //     localStorage.setItem("xionSign", JSON.stringify(data));
    //     loginModal("xion");
    // };

    return (
        <Modal
            heading={selectedProvider ? "Select a Chain" : "Select a provider to login"}
            open={open}
            onClose={onClose}
        >
            {!selectedProvider ? (
                <Box
                    display={"flex"}
                    justifyContent={"space-around"}
                    width={"100%"}
                    alignItems={"center"}
                    mt={3}
                >
                    <Box
                        display={"flex"}
                        flexDirection={"column"}
                        justifyContent={"center"}
                        padding={"20px"}
                        alignItems={"center"}
                        gap={"20px"}
                        sx={{
                            cursor: "pointer",
                            border: "1px solid #000000",
                            borderRadius: "10px",
                            background:
                                defaultSelections?.provider === "metakeep" ? "#f2cf6f" : "#FFFFFF",
                        }}
                        onClick={() => setSelectedProvider("metakeep")}
                    >
                        <img
                            src={"https://metakeep.xyz/images/MetaKeep-1.png"}
                            alt={"metakeep logo"}
                        />
                        <Typography fontWeight={800}>Choose for Skale Titan AI Hubs</Typography>
                    </Box>

                    {/* <Box
                        display={"flex"}
                        flexDirection={"column"}
                        justifyContent={"center"}
                        padding={"20px"}
                        alignItems={"center"}
                        gap={"20px"}
                        sx={{
                            cursor: "pointer",
                            border: "1px solid #000000",
                            borderRadius: "10px",
                            background:
                                defaultSelections?.provider === "privy" ? "#f2cf6f" : "#FFFFFF",
                        }}
                        onClick={() => setSelectedProvider("privy")}
                    >
                        <svg
                            width="129"
                            height="41"
                            viewBox="0 0 129 41"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ height: "28px", width: "96px" }}
                        >
                            <path
                                d="M30.2631 37.5605C30.2631 39.2539 23.8315 40.6266 15.8977 40.6266C7.96392 40.6266 1.53231 39.2539 1.53231 37.5605C1.53231 35.8671 7.96392 34.4943 15.8977 34.4943C23.8315 34.4943 30.2631 35.8671 30.2631 37.5605Z"
                                fill="#FF8271"
                            ></path>
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M0.455615 24.2448C0.455615 29.1946 5.01917 31.4142 9.48116 31.428C19.9212 31.428 31.4722 25.0107 31.4121 14.2713C31.3688 6.52859 24.2544 -0.0628907 15.8357 0.000452793C7.82477 0.000452793 0.000529064 5.23097 0 12.3567C0 14.2703 1.09781 16.1216 3.96753 16.33C1.57478 18.6994 0.455615 21.5383 0.455615 24.2448ZM15.8632 17.2471C17.5367 17.2471 18.8934 15.617 18.8934 13.6061C18.8934 11.5952 17.5367 9.96502 15.8632 9.96502C14.1897 9.96502 12.8331 11.5952 12.8331 13.6061C12.8331 15.617 14.1897 17.2471 15.8632 17.2471ZM24.5514 17.2472C26.2249 17.2472 27.5816 15.617 27.5816 13.6061C27.5816 11.5952 26.2249 9.96503 24.5514 9.96503C22.8779 9.96503 21.5213 11.5952 21.5213 13.6061C21.5213 15.617 22.8779 17.2472 24.5514 17.2472Z"
                                fill="#FF8271"
                            ></path>
                            <path
                                d="M45.3547 33.1573C45.8638 33.1573 46.2804 32.7376 46.2804 32.2246C46.2804 29.5186 46.2804 26.8126 46.2804 24.1066C47.9005 24.1066 49.5206 24.1066 51.1406 24.1066C56.7414 24.1066 60.861 19.9557 60.861 14.3125C60.861 8.66924 56.7414 4.51841 51.1406 4.51841H42.8089C42.2997 4.51841 41.8831 4.93816 41.8831 5.45118V32.2246C41.8831 32.7376 42.2997 33.1573 42.8089 33.1573H45.3547ZM46.2804 19.6759C46.2804 16.1003 46.2804 12.5247 46.2804 8.94907C47.9005 8.94907 49.5206 8.94907 51.1406 8.94907C54.1956 8.94907 56.3248 11.1411 56.3248 14.3125C56.3248 17.4839 54.1956 19.6759 51.1406 19.6759C49.5206 19.6759 47.9005 19.6759 46.2804 19.6759Z"
                                fill="#FF8271"
                            ></path>
                            <path
                                d="M66.8609 33.1573C67.3701 33.1573 67.7867 32.7376 67.7867 32.2246V21.0313C67.7867 16.0877 71.0731 14.2221 74.7298 14.2221H75.6555C76.1647 14.2221 76.5813 13.8024 76.5813 13.2894V10.7709C76.5813 10.2579 76.1647 9.83811 75.6555 9.83811H74.7298C69.1743 9.83811 67.2555 13.6935 67.2555 13.6935C67.2555 13.6935 67.2555 11.2893 67.2555 10.7709C67.2555 10.0349 66.8389 9.83811 66.3297 9.83811H64.5465C64.0374 9.83811 63.6208 10.2579 63.6208 10.7709V32.2246C63.6208 32.7376 64.0374 33.1573 64.5465 33.1573H66.8609Z"
                                fill="#FF8271"
                            ></path>
                            <path
                                d="M82.5484 33.1573C83.0575 33.1573 83.4741 32.7376 83.4741 32.2246V10.7709C83.4741 10.2579 83.0575 9.83811 82.5484 9.83811H80.1414C79.6323 9.83811 79.2157 10.2579 79.2157 10.7709V32.2246C79.2157 32.7376 79.6323 33.1573 80.1414 33.1573H82.5484Z"
                                fill="#FF8271"
                            ></path>
                            <path
                                d="M97.8721 33.1573C98.2886 33.1573 98.5664 32.9241 98.7515 32.4578L106.759 11.2839C106.852 11.0507 106.944 10.7709 106.944 10.491C106.944 10.1646 106.574 9.83811 106.019 9.83811H103.149C102.732 9.83811 102.455 10.0247 102.269 10.5377C100.396 15.9569 96.5701 26.4462 96.5701 26.4462C96.5701 26.4462 92.7606 15.9694 90.8827 10.5377C90.6975 10.0247 90.4198 9.83811 90.0032 9.83811H87.1334C86.5779 9.83811 86.2076 10.1646 86.2076 10.5377C86.2076 10.7709 86.3002 11.0507 86.3928 11.2839L94.4468 32.4578C94.6319 32.9241 94.9097 33.1573 95.3263 33.1573H97.8721Z"
                                fill="#FF8271"
                            ></path>
                            <path
                                d="M117.084 40.6266C117.5 40.6266 117.778 40.4401 117.963 39.9271L128.815 11.2839C128.907 11.0507 129 10.7709 129 10.5377C129 10.1646 128.63 9.83811 128.074 9.83811H125.251C124.834 9.83811 124.556 10.0247 124.371 10.5377C122.635 15.5261 118.909 26.4462 118.909 26.4462C118.909 26.4462 114.924 15.5774 113.031 10.5377C112.846 10.0247 112.568 9.83811 112.151 9.83811H109.328C108.772 9.83811 108.402 10.1646 108.402 10.5377C108.402 10.7709 108.495 11.0507 108.587 11.2839L116.317 31.0586C116.41 31.2918 116.456 31.4317 116.456 31.525C116.456 31.6649 116.41 31.7582 116.317 32.038L113.797 39.2741C113.705 39.5073 113.658 39.6939 113.658 39.8804C113.658 40.2535 113.982 40.6266 114.584 40.6266H117.084Z"
                                fill="#FF8271"
                            ></path>
                        </svg>
                        <Typography fontWeight={800}>Choose for Berachain</Typography>
                    </Box>

                    <Box
                        display={"flex"}
                        flexDirection={"column"}
                        justifyContent={"center"}
                        padding={"20px"}
                        alignItems={"center"}
                        gap={"20px"}
                        sx={{
                            cursor: "pointer",
                            border: "1px solid #000000",
                            background:
                                defaultSelections && defaultSelections?.provider === "xion"
                                    ? "#f2cf6f"
                                    : "#FFFFFF",
                            border: "1px solid #FFFFFF",
                            borderRadius: "10px",
                            background:
                                defaultSelections?.provider === "xion" ? "#f2cf6f" : "#FFFFFF",
                        }}
                        // onClick={() => loginModal("privy")}
                        onClick={() => handleXion()}
                    >
                        <svg
                            width="100px"
                            height="100px"
                            viewBox="0.004 0 64 64"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M63.04 39.741c-4.274 17.143-21.638 27.575-38.783 23.301C7.12 58.768-3.313 41.404.962 24.262 5.234 7.117 22.597-3.317 39.737.957c17.144 4.274 27.576 21.64 23.302 38.784z"
                                fill="#f7931a"
                            />
                            <path
                                d="M46.11 27.441c.636-4.258-2.606-6.547-7.039-8.074l1.438-5.768-3.512-.875-1.4 5.616c-.922-.23-1.87-.447-2.812-.662l1.41-5.653-3.509-.875-1.439 5.766c-.764-.174-1.514-.346-2.242-.527l.004-.018-4.842-1.209-.934 3.75s2.605.597 2.55.634c1.422.355 1.68 1.296 1.636 2.042l-1.638 6.571c.098.025.225.061.365.117l-.37-.092-2.297 9.205c-.174.432-.615 1.08-1.609.834.035.051-2.552-.637-2.552-.637l-1.743 4.02 4.57 1.139c.85.213 1.683.436 2.502.646l-1.453 5.835 3.507.875 1.44-5.772c.957.26 1.887.5 2.797.726L27.504 50.8l3.511.875 1.453-5.823c5.987 1.133 10.49.676 12.383-4.738 1.527-4.36-.075-6.875-3.225-8.516 2.294-.531 4.022-2.04 4.483-5.157zM38.087 38.69c-1.086 4.36-8.426 2.004-10.807 1.412l1.928-7.729c2.38.594 10.011 1.77 8.88 6.317zm1.085-11.312c-.99 3.966-7.1 1.951-9.083 1.457l1.748-7.01c1.983.494 8.367 1.416 7.335 5.553z"
                                fill="#ffffff"
                            />
                        </svg>
                        <Typography fontWeight={800}>Choose for Xion</Typography>
                    </Box> */}
                </Box>
            ) : (
                selectedProvider !== "xion" && (
                    <Box>
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "10px",
                                justifyContent: "center",
                            }}
                            mb={3}
                        >
                            {getSupportedChains().map(chain => (
                                <Box key={chain.id}>
                                    <Box
                                        sx={{
                                            border: "1px solid #fff",
                                            width: "100px",
                                            aspectRatio: 1,
                                            borderRadius: "5px",
                                            display: "grid",
                                            placeItems: "center",
                                            textAlign: "center",
                                            borderColor:
                                                chain.id === selectedChain ? "#f2cf6f" : "#fff",
                                            cursor: "pointer",
                                            backgroundColor:
                                                chain.id === defaultSelections?.chainId
                                                    ? "#f2cf6f"
                                                    : null,
                                        }}
                                        onClick={() => setSelectedChain(chain.id)}
                                    >
                                        <Typography
                                            style={{
                                                color: "#fff",
                                                fontSize: "14px",
                                                padding: "8px",
                                            }}
                                        >
                                            {chain.name}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Button variant="outlined" onClick={() => setSelectedProvider("")}>
                                Back
                            </Button>
                            {selectedChain && (
                                <Button
                                    variant="contained"
                                    onClick={() => loginModal(selectedProvider, selectedChain)}
                                >
                                    Connect
                                </Button>
                            )}
                        </Box>
                    </Box>
                )
            )}
            {/* <Abstraxion onClose={() => setShow(false)} /> */}
        </Modal>
    );
}
