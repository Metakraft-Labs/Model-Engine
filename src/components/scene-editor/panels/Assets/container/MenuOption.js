import React from "react";

export default function MenuOption({ setType, setOpenModal, setOpenMenu }) {
    const openType = type => {
        setType(type);
        setOpenMenu(false);
        setOpenModal(true);
    };

    return (
        <>
            <ul
                role="menu"
                data-popover="menu"
                data-popover-placement="bottom"
                className="border-blue-gray-50 shadow-blue-gray-500/10 absolute top-10 z-10 min-w-[140px] overflow-auto rounded-md border bg-[#212226] p-3 font-sans text-sm font-normal text-white shadow-lg focus:outline-none"
            >
                <li
                    onClick={() => openType("ai")}
                    role="menuitem"
                    className="hover:bg-blue-gray-50 hover:text-blue-gray-900 focus:bg-blue-gray-50 focus:text-blue-gray-900 active:bg-blue-gray-50 active:text-blue-gray-900 block w-full cursor-pointer select-none rounded-md px-3 pb-2 pt-[9px] text-start leading-tight transition-all hover:bg-opacity-80 focus:bg-opacity-80 active:bg-opacity-80"
                >
                    Generate from AI
                </li>
                <li
                    onClick={() => openType("library")}
                    role="menuitem"
                    className="hover:bg-blue-gray-50 hover:text-blue-gray-900 focus:bg-blue-gray-50 focus:text-blue-gray-900 active:bg-blue-gray-50 active:text-blue-gray-900 block w-full cursor-pointer select-none rounded-md px-3 pb-2 pt-[9px] text-start leading-tight transition-all hover:bg-opacity-80 focus:bg-opacity-80 active:bg-opacity-80"
                >
                    Search Assets Library
                </li>
            </ul>
        </>
    );
}
