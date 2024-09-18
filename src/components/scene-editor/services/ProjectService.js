import { useEffect } from "react";
import {
    builderInfoPath,
    githubRepoAccessRefreshPath,
    projectBranchesPath,
    projectBuilderTagsPath,
    projectBuildPath,
    projectCheckSourceDestinationMatchPath,
    projectCheckUnfetchedCommitPath,
    projectCommitsPath,
    projectDestinationCheckPath,
    projectGithubPushPath,
    projectInvalidatePath,
    projectPath,
    projectPermissionPath,
} from "../../../common/src/schema.type.module";
import { defineState, getMutableState, useHookstate } from "../../../hyperflux";

import { toast } from "react-toastify";

const API = {};
//State
export const PROJECT_PAGE_LIMIT = 100;

export const ProjectState = defineState({
    name: "ProjectState",
    initial: () => ({
        projects: [],
        updateNeeded: true,
        rebuilding: false,
        succeeded: false,
        failed: false,
        builderTags: [],
        builderInfo: {
            engineVersion: "",
            engineCommit: "",
        },
        refreshingGithubRepoAccess: false,
    }),
});

//Service
export const ProjectService = {
    fetchProjects: async () => {
        try {
            const projects = await API?.instance.service(projectPath).find({
                query: {
                    action: "admin",
                    allowed: true,
                },
            });
            getMutableState(ProjectState).merge({
                updateNeeded: false,
                projects: projects.data,
            });
        } catch (err) {
            toast.error(err.message || JSON.stringify(err));
        }
    },

    // restricted to admin scope
    createProject: async (name, params) => {
        const result = await API?.instance.service(projectPath).create({ name }, params);
        console.info({ result }, "Create project result");
        await ProjectService.fetchProjects();
    },

    // restricted to admin scope
    uploadProject: async data => {
        const result = await API?.instance.service(projectPath).update("", {
            sourceURL: data.sourceURL,
            destinationURL: data.destinationURL,
            name: data.name,
            reset: data.reset,
            commitSHA: data.commitSHA,
            sourceBranch: data.sourceBranch,
            updateType: data.updateType,
            updateSchedule: data.updateSchedule,
        });
        console.info({ result }, "Upload project result");
        await API?.instance.service(projectInvalidatePath).patch(null, { projectName: data.name });
        await ProjectService.fetchProjects();
    },

    // restricted to admin scope
    removeProject: async (id, params) => {
        const result = await API?.instance.service(projectPath).remove(id, params);
        console.info({ result }, "Remove project result");
        await ProjectService.fetchProjects();
    },

    // restricted to admin scope
    checkReloadStatus: async () => {
        const result = await API?.instance.service(projectBuildPath).find();
        console.info({ result }, "Check reload projects result");
        getMutableState(ProjectState).merge({
            rebuilding: result.running,
            succeeded: result.succeeded,
            failed: result.failed,
        });
    },

    // restricted to admin scope
    invalidateProjectCache: async projectName => {
        try {
            await API?.instance.service(projectInvalidatePath).patch(null, { projectName });
            await ProjectService.fetchProjects();
        } catch (err) {
            console.error(err, "Error invalidating project cache.");
        }
    },

    setEnabled: async (id, enabled) => {
        try {
            await API?.instance.service(projectPath).patch(id, {
                enabled,
            });
        } catch (err) {
            console.error(err, "Error setting project enabled");
            throw err;
        }
    },

    setVisibility: async (id, visibility) => {
        try {
            await API?.instance.service(projectPath).patch(id, {
                visibility,
            });
        } catch (err) {
            console.error(err, "Error setting project visibility");
            throw err;
        }
    },

    setRepositoryPath: async (id, url) => {
        try {
            await API?.instance.service(projectPath).patch(id, {
                repositoryPath: url,
            });
        } catch (err) {
            console.error(err, "Error setting project repository path");
            throw err;
        }
    },

    pushProject: async id => {
        try {
            await API?.instance.service(projectGithubPushPath).patch(id, {});
        } catch (err) {
            console.error("Error with project push", err);
            throw err;
        }
    },

    createPermission: async (userInviteCode, projectId, type) => {
        try {
            return API?.instance.service(projectPermissionPath).create({
                inviteCode: userInviteCode,
                userId: "",
                projectId: projectId,
                type,
            });
        } catch (err) {
            console.error("Error with creating new project-permission", err);
            throw err;
        }
    },

    patchPermission: async (id, type) => {
        try {
            return API?.instance.service(projectPermissionPath).patch(id, {
                type: type,
            });
        } catch (err) {
            console.error("Error with patching project-permission", err);
            throw err;
        }
    },

    removePermission: async id => {
        try {
            return API?.instance.service(projectPermissionPath).remove(id);
        } catch (err) {
            console.error("Error with removing project-permission", err);
            throw err;
        }
    },
    useAPIListeners: () => {
        const updateNeeded = useHookstate(getMutableState(ProjectState).updateNeeded);

        useEffect(() => {
            if (updateNeeded.value) ProjectService.fetchProjects();
        }, [updateNeeded]);

        useEffect(() => {
            // TODO #7254
            // API?.instance.service(projectBuildPath).on('patched', (params) => {})

            const projectPatchedListener = params => {
                getMutableState(ProjectState).updateNeeded.set(true);
            };

            API?.instance.service(projectPath).on("patched", projectPatchedListener);

            return () => {
                API?.instance.service(projectPath).off("patched", projectPatchedListener);
            };
        }, []);
    },

    fetchProjectBranches: async url => {
        try {
            return (await API?.instance.service(projectBranchesPath).get(url)).branches;
        } catch (err) {
            console.error("Error with fetching tags for a project", err);
            throw err;
        }
    },

    fetchProjectCommits: async (url, branchName) => {
        try {
            const projectCommits = await API?.instance.service(projectCommitsPath).get(url, {
                query: {
                    sourceBranch: branchName,
                },
            });

            return projectCommits.commits;
        } catch (err) {
            console.error("Error with fetching commits for a project", err);
            throw err;
        }
    },

    checkDestinationURLValid: async ({ url, inputProjectURL }) => {
        try {
            return API?.instance.service(projectDestinationCheckPath).get(url, {
                query: {
                    inputProjectURL,
                },
            });
        } catch (err) {
            console.error("Error with checking destination for a project", err);
            throw err;
        }
    },

    checkUnfetchedCommit: async ({ url, selectedSHA }) => {
        try {
            return API?.instance.service(projectCheckUnfetchedCommitPath).get(url, {
                query: {
                    selectedSHA,
                },
            });
        } catch (err) {
            console.error("Error with checking destination for a project", err);
            throw err;
        }
    },

    checkSourceMatchesDestination: async ({
        sourceURL,
        selectedSHA,
        destinationURL,
        existingProject = false,
    }) => {
        try {
            return API?.instance.service(projectCheckSourceDestinationMatchPath).find({
                query: {
                    sourceURL,
                    selectedSHA,
                    destinationURL,
                    existingProject,
                },
            });
        } catch (err) {
            console.error("Error with checking source matches destination", err);
            throw err;
        }
    },

    updateEngine: async (tag, updateProjects, projectsToUpdate) => {
        try {
            await API?.instance.service(projectBuildPath).patch(tag, {
                updateProjects,
                projectsToUpdate,
            });
        } catch (err) {
            console.error("Error with updating engine version", err);
            throw err;
        }
    },

    fetchBuilderTags: async () => {
        try {
            const result = await API?.instance.service(projectBuilderTagsPath).find();
            getMutableState(ProjectState).builderTags.set(result);
        } catch (err) {
            console.error("Error with getting builder tags", err);
            throw err;
        }
    },

    getBuilderInfo: async () => {
        try {
            const result = await API?.instance.service(builderInfoPath).get();
            getMutableState(ProjectState).builderInfo.set(result);
        } catch (err) {
            console.error("Error with getting engine info", err);
            throw err;
        }
    },

    refreshGithubRepoAccess: async () => {
        try {
            getMutableState(ProjectState).refreshingGithubRepoAccess.set(true);
            await API?.instance.service(githubRepoAccessRefreshPath).find();
            getMutableState(ProjectState).refreshingGithubRepoAccess.set(false);
            await ProjectService.fetchProjects();
        } catch (err) {
            console.error("Error with refreshing Github repo access", err);
            throw err;
        }
    },
};
