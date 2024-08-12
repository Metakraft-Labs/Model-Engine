import React from "react";

export const ArrowDividerIcon = ({ width = "195", height = "22" }) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M84 0H0V2.5H82.5L97.5 21.5V16.857C97.5 16.6261 97.4201 16.4024 97.274 16.2237L84 0Z"
                fill="url(#paint0_linear_798_95)"
            />
            <path
                d="M111 0H195V2.5H112.5L97.5 21.5V16.857C97.5 16.6261 97.5799 16.4024 97.726 16.2237L111 0Z"
                fill="url(#paint1_linear_798_95)"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_798_95"
                    x1="202"
                    y1="0.499985"
                    x2="2.49999"
                    y2="0.499986"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="white" stopOpacity="0" />
                    <stop offset="0.53" stopColor="#F757FF" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_798_95"
                    x1="-6.99999"
                    y1="0.499985"
                    x2="192.5"
                    y2="0.499986"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="white" stopOpacity="0" />
                    <stop offset="0.53" stopColor="#F757FF" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    );
};
