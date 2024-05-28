import { useEffect } from "react";

export default function Title({ title }) {
    useEffect(() => {
        document.title = `${title} | ${process.env.REACT_APP_NAME}`;
    }, [title]);
    return ("");
};
