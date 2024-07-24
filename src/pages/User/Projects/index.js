import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import bg from "../../../assets/img/text-2-3d/bg.svg";
import TItle from "../../../shared/Title";
import Models from "./Tabs/Models";
import Nfts from "./Tabs/Nfts";
import Textures from "./Tabs/Textures";

export default function Projects() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [projects, setProjects] = useState([]);
    const [page, setPage] = useState(0);
    const [pagination, setPagination] = useState({});
    const [limit, setLimit] = useState(12);
    const [projectsLoading, setProjectsLoading] = useState(false);

    const TABS = ["3d models", "texture", "nfts"];

    const tab = useMemo(() => {
        // get query string
        const params = new URLSearchParams(searchParams);
        const tab = params.get("type");
        setPage(0);
        setProjects([]);

        if (tab && TABS.includes(tab?.toLowerCase())) {
            return TABS.indexOf(tab) === -1 ? 0 : TABS.indexOf(tab);
        }
        return 0;
    }, [searchParams]);

    const handleTabChange = (_e, newValue) => {
        setSearchParams({ type: TABS[newValue] });
    };

    return (
        <Box
            sx={{
                pt: 6,
                pb: 8,
                px: 4,
                width: "100%",
                minHeight: "100dvh",
                maxHeight: "auto",
                backgroundImage: `url(${bg})`, // Replace with your image URLs
                backgroundPosition: "top left, bottom right", // Positions
                backgroundSize: "cover, cover", // First image covers the box, second image is 100x100 pixels
                backgroundRepeat: "no-repeat, no-repeat", // Prevents repeating
            }}
        >
            <TItle title={"My Projects"} />
            <Box
                sx={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                }}
                mb={2}
            >
                <Link
                    to="/"
                    style={{
                        color: "#fff",
                        textDecoration: "none",
                        flex: 0.8,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <ArrowBackIosNewIcon
                            sx={{
                                fontSize: 15,
                            }}
                        />
                        <Typography variant="body2" component="h1" color="#898A8C">
                            Back to Homepage
                        </Typography>
                    </Box>
                </Link>

                <Tabs value={tab} onChange={handleTabChange} sx={{ width: "50%" }}>
                    {TABS.map((tab, index) => (
                        <Tab key={index} label={tab} sx={{ color: "#FFFFFF", fontWeight: 500 }} />
                    ))}
                </Tabs>
            </Box>

            {tab === 0 ? (
                <Models
                    projects={projects}
                    setProjects={setProjects}
                    setPagination={setPagination}
                    pagination={pagination}
                    projectsLoading={projectsLoading}
                    setProjectsLoading={setProjectsLoading}
                    page={page}
                    limit={limit}
                    setPage={setPage}
                    setLimit={setLimit}
                />
            ) : tab === 1 ? (
                <Textures
                    projects={projects}
                    setProjects={setProjects}
                    setPagination={setPagination}
                    pagination={pagination}
                    projectsLoading={projectsLoading}
                    setProjectsLoading={setProjectsLoading}
                    page={page}
                    limit={limit}
                    setPage={setPage}
                    setLimit={setLimit}
                />
            ) : (
                <Nfts
                    projects={projects}
                    setProjects={setProjects}
                    setPagination={setPagination}
                    pagination={pagination}
                    projectsLoading={projectsLoading}
                    setProjectsLoading={setProjectsLoading}
                    page={page}
                    limit={limit}
                    setPage={setPage}
                    setLimit={setLimit}
                />
            )}
        </Box>
    );
}
