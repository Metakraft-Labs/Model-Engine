import {
    Box,
    CircularProgress,
    IconButton,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TablePagination,
    TableRow,
    Tabs,
    Typography,
} from "@mui/material";
import moment from "moment";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IoEyeSharp } from "react-icons/io5";
import { useSearchParams } from "react-router-dom";
import { list } from "../../../apis/nft";
import DisplayModel from "../../../components/DisplayModel";
import Modal from "../../../components/Modal";
import TItle from "../../../shared/Title";
import { getBlockExplorer, getChainName, minifyAddress } from "../../../shared/web3utils";

export default function Nfts() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [nfts, setNfts] = useState([]);
    const [page, setPage] = useState(0);
    const [pagination, setPagination] = useState({});
    const [limit, setLimit] = useState(10);
    const [nftLoading, setNftLoading] = useState(false);
    const [nft, setNft] = useState(null);
    const [open, setOpen] = useState(false);

    const TABS = ["3d", "motion", "texture"];

    const tab = useMemo(() => {
        // get query string
        const params = new URLSearchParams(searchParams);
        const tab = params.get("type");
        setPage(0);
        setNfts([]);

        if (tab && TABS.includes(tab?.toLowerCase())) {
            return TABS.indexOf(tab) === -1 ? 0 : TABS.indexOf(tab);
        }
        return 0;
    }, [searchParams]);

    const handleTabChange = (_e, newValue) => {
        setSearchParams({ type: TABS[newValue] });
    };

    const getNfts = useCallback(async () => {
        setNftLoading(true);
        const res = await list({ page: page + 1, type: TABS[tab], limit });

        if (res?.data) {
            setNfts(res.data);
            setPagination(res.pagination);
        }
        setNftLoading(false);
    }, [page, tab, limit]);

    useEffect(() => {
        getNfts();
    }, [getNfts]);

    const handleView = nft => {
        setNft(nft);
        setOpen(true);
    };

    return (
        <>
            <TItle title={"Your NFTs"} />

            <Typography variant="h4" gutterBottom textAlign={"center"}>
                Your NFTs
            </Typography>

            <Tabs value={tab} onChange={handleTabChange}>
                {TABS.map((tab, index) => (
                    <Tab key={index} label={tab} />
                ))}
            </Tabs>

            {nftLoading ? (
                <Box
                    display={"flex"}
                    justifyContent={"center"}
                    alignItems={"center"}
                    width={"100%"}
                    height={"100%"}
                >
                    <CircularProgress />
                </Box>
            ) : nfts?.length ? (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Prompt</TableCell>
                            <TableCell>Transaction Hash</TableCell>
                            <TableCell>Chain</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {nfts?.map((nft, index) => (
                            <TableRow key={index}>
                                <TableCell>{nft.prompt}</TableCell>
                                <TableCell>
                                    {
                                        <a
                                            href={`${getBlockExplorer(nft.chainId)}/tx/${nft.transactionHash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {minifyAddress(nft.transactionHash)}
                                        </a>
                                    }
                                </TableCell>
                                <TableCell>{getChainName(nft.chainId)}</TableCell>
                                <TableCell>{moment(nft.created_at).format("ll")}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleView(nft)}>
                                        <IoEyeSharp />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>

                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={5}>
                                <TablePagination
                                    component="div"
                                    count={pagination?.total}
                                    page={page}
                                    onPageChange={(_e, newPage) => setPage(newPage)}
                                    rowsPerPage={limit}
                                    onRowsPerPageChange={e => setLimit(e.target.value)}
                                />
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            ) : (
                <Typography variant="h6" gutterBottom textAlign={"center"}>
                    No NFTs found
                </Typography>
            )}

            {/* View modal */}
            <Modal open={open} onClose={() => setOpen(false)} heading={nft?.prompt}>
                <Box
                    display={"flex"}
                    justifyContent={"center"}
                    alignItems={"center"}
                    height={"100%"}
                    width={"90%"}
                >
                    {nft?.type === "3d" ? (
                        <DisplayModel link={nft?.url} />
                    ) : nft?.type === "motion" ? (
                        <video controls height="100%" src={nft?.url}></video>
                    ) : (
                        <img src={nft?.url} alt={nft?.prompt} style={{ maxWidth: "100%" }} />
                    )}
                </Box>
            </Modal>
        </>
    );
}
