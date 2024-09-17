import { Button, TextField } from "@mui/material";
import React from "react";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { RiAiGenerate } from "react-icons/ri";

export default function TypeModal({
    close,
    type,
    generate,
    search,
    prompt,
    setPrompt,
    loading,
    showSearch,
    setShowSearch,
}) {
    return (
        <div
            id="default-modal"
            tabIndex={-1}
            className="top-30 left-50 relative right-0 z-50 h-[calc(100%-1rem)] max-h-full w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0"
        >
            <div className="relative max-h-full w-full max-w-2xl p-4">
                <div className="relative rounded-lg bg-white shadow dark:bg-gray-700">
                    <div className="flex items-center justify-between rounded-t border-b p-4 dark:border-gray-600 md:p-5">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {type === "ai" ? "Generate From AI" : "Search Asset Library"}
                        </h3>
                        {!loading && (
                            <button
                                type="button"
                                className="ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                                data-modal-hide="default-modal"
                                onClick={() => {
                                    setShowSearch(false);
                                    setPrompt("");
                                    close();
                                }}
                            >
                                <svg
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 14 14"
                                >
                                    <path
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                                    />
                                </svg>
                                <span className="sr-only">Close modal</span>
                            </button>
                        )}
                    </div>
                    <div className="space-y-4 p-4 md:p-5" style={{ overflowY: "auto" }}>
                        {showSearch ? (
                            <form
                                onSubmit={e => {
                                    e.preventDefault();
                                    if (type === "ai") {
                                        generate();
                                    } else {
                                        search();
                                    }
                                }}
                            >
                                <TextField
                                    placeholder={
                                        type === "ai" ? "Enter prompt" : "Enter text to search"
                                    }
                                    value={prompt}
                                    onChange={e => {
                                        setPrompt(e.target.value);
                                    }}
                                    containerClassname="flex h-full w-auto"
                                    disabled={loading}
                                    className="h-7 rounded-lg border border-theme-input bg-[#141619] px-2 py-0 text-lg text-[#A3A3A3] placeholder:text-[#A3A3A3] focus-visible:ring-0"
                                    startComponent={
                                        type === "ai" ? (
                                            <RiAiGenerate className="h-[14px] w-[14px] text-[#A3A3A3]" />
                                        ) : (
                                            <HiMagnifyingGlass className="h-[14px] w-[14px] text-[#A3A3A3]" />
                                        )
                                    }
                                />
                                <Button
                                    rounded="none"
                                    className="mt-3 h-full whitespace-nowrap bg-theme-highlight px-2"
                                    size="small"
                                    disabled={loading}
                                >
                                    {type === "ai"
                                        ? loading
                                            ? "Generating"
                                            : "Generate"
                                        : loading
                                          ? "Searching"
                                          : "Search"}
                                </Button>
                            </form>
                        ) : (
                            <></>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
