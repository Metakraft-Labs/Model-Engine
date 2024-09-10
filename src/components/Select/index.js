import { Select as MuiSelect } from "@mui/material";
import React from "react";

const Select = props => <MuiSelect {...props} />;

Select.displayName = "Select";

Select.defaultProps = { children: null };

export default Select;
