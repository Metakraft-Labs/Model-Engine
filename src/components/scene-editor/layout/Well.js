import React from "react";

const wellStyles = {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "6px",
    padding: "4px",
    margin: "8px",
};

const Well = ({ children }) => {
    return <div style={wellStyles}>{children}</div>;
};

export default Well;
