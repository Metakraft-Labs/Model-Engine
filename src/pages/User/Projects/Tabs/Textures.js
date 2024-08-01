import { Box, CircularProgress, Grid, TablePagination, Typography } from "@mui/material";
import React, { useCallback, useContext, useEffect } from "react";
import { list } from "../../../../apis/text2texture";
import { UserStore } from "../../../../contexts/UserStore";

export default function Textures({
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
    const { user } = useContext(UserStore);
    const getProjects = useCallback(async () => {
        setProjectsLoading(true);
        const res = await list({ page: page + 1, limit, filters: { user_id: user.id } });

        if (res?.data) {
            setProjects(res.data);
            setPagination(res.pagination);
        }
        setProjectsLoading(false);
    }, [page, limit]);

    useEffect(() => {
        getProjects();
    }, [getProjects]);
    return (
        <Grid container spacing={2}>
            {projectsLoading ? (
                <Grid
                    item
                    xs={12}
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        height: "100%",
                        alignItems: "center",
                    }}
                >
                    <CircularProgress />
                </Grid>
            ) : projects?.length ? (
                <>
                    {projects?.map((project, index) => {
                        return (
                            <Grid item xs={6} md={4} key={`textures-list-${index}`}>
                                <Box
                                    sx={{
                                        borderRadius: "10px",
                                        border: "1px solid #373737",
                                        boxShadow: "0px 0px 0px 3px rgba(0, 0, 0, 1)",
                                    }}
                                >
                                    <img
                                        src={project?.texture}
                                        width={"100%"}
                                        style={{ borderRadius: "10px" }}
                                        height={"100%"}
                                    />
                                </Box>
                            </Grid>
                        );
                    })}

                    <TablePagination
                        component="div"
                        count={pagination?.total}
                        sx={{
                            color: "#FFFFFF",
                            display: "flex",
                            justifyContent: "end",
                            width: "100%",
                        }}
                        page={page}
                        onPageChange={(_e, newPage) => setPage(newPage)}
                        rowsPerPage={limit}
                        onRowsPerPageChange={e => setLimit(e.target.value)}
                    />
                </>
            ) : (
                <Grid
                    item
                    xs={12}
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        height: "100%",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="h6" color={"#FFFFFF"} gutterBottom textAlign={"center"}>
                        No models found
                    </Typography>
                </Grid>
            )}
        </Grid>
    );
}
