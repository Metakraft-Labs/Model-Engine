import {
    Box,
    CircularProgress,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
} from "@mui/material";
import moment from "moment";
import React, { Suspense, useCallback, useEffect, useState } from "react";
import { IoEyeSharp } from "react-icons/io5";
import { list } from "../../../../apis/nft";
import DisplayModel from "../../../../components/DisplayModel";
import Modal from "../../../../components/Modal";
import { getBlockExplorer, getChainName, minifyAddress } from "../../../../shared/web3utils";

export default function Nfts({
    projects,
    setProjects,
    setPagination,
    pagination,
    projectsLoading,
    setProjectsLoading,
    page,
    limit,
    setPage,
    setLimit,
}) {
    const [project, setProject] = useState(null);
    const [open, setOpen] = useState(false);

    const getNfts = useCallback(async () => {
        setProjectsLoading(true);
        const res = await list({ page: page + 1, limit });

        if (res?.data) {
            setProjects(res.data);
            setPagination(res.pagination);
        }
        setProjectsLoading(false);
    }, [page, limit]);

    useEffect(() => {
        getNfts();
    }, [getNfts]);

    const handleView = project => {
        setProject(project);
        setOpen(true);
    };

    return (
        <>
            {projectsLoading ? (
                <Box
                    display={"flex"}
                    justifyContent={"center"}
                    alignItems={"center"}
                    width={"100%"}
                    height={"100%"}
                >
                    <CircularProgress />
                </Box>
            ) : projects?.length ? (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: "#FFFFFF" }}>Prompt</TableCell>
                            <TableCell sx={{ color: "#FFFFFF" }}>Transaction Hash</TableCell>
                            <TableCell sx={{ color: "#FFFFFF" }}>Chain</TableCell>
                            <TableCell sx={{ color: "#FFFFFF" }}>Created At</TableCell>
                            <TableCell sx={{ color: "#FFFFFF" }}></TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {projects?.map((project, index) => (
                            <TableRow key={index}>
                                <TableCell sx={{ color: "#FFFFFF" }}>{project.prompt}</TableCell>
                                <TableCell sx={{ color: "#FFFFFF" }}>
                                    {
                                        <a
                                            href={`${getBlockExplorer(project.chainId)}/tx/${project.transactionHash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {minifyAddress(project.transactionHash)}
                                        </a>
                                    }
                                </TableCell>
                                <TableCell sx={{ color: "#FFFFFF" }}>
                                    {getChainName(project.chainId)}
                                </TableCell>
                                <TableCell sx={{ color: "#FFFFFF" }}>
                                    {moment(project.created_at).format("ll")}
                                </TableCell>
                                <TableCell sx={{ color: "#FFFFFF" }}>
                                    <IconButton
                                        onClick={() => handleView(project)}
                                        sx={{ color: "#FFFFFF" }}
                                    >
                                        <IoEyeSharp />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>

                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={5} sx={{ color: "#FFFFFF" }}>
                                <TablePagination
                                    component="div"
                                    sx={{ color: "#FFFFFF" }}
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
                    No nfts found
                </Typography>
            )}
            {/* View modal */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                heading={project?.prompt}
                sx={{
                    "> .MuiBox-root": {
                        backgroundColor: "transparent",
                        boxShadow: "none",
                        "> .MuiBox-root:first-child": { background: "#606060" },
                    },
                }}
            >
                <Box
                    display={"flex"}
                    justifyContent={"center"}
                    alignItems={"center"}
                    height={"100%"}
                    width={"90%"}
                    padding={"10px"}
                >
                    {project?.type === "3d" ? (
                        <Suspense fallback={<CircularProgress />}>
                            <Box mt={30}>
                                <DisplayModel link={project?.url} type="textured" />
                            </Box>
                        </Suspense>
                    ) : project?.type === "motion" ? (
                        <video controls height="100%" src={project?.url}></video>
                    ) : (
                        <img
                            src={project?.url}
                            alt={project?.prompt}
                            style={{ maxWidth: "100%" }}
                        />
                    )}
                </Box>
            </Modal>
        </>
    );
}
