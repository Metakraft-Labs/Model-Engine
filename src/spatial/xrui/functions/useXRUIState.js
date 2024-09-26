import { useContext } from "react";

import { useHookstate } from "../../../hyperflux";

import { XRUIStateContext } from "../XRUIStateContext";

export const useXRUIState = () => useHookstate(useContext(XRUIStateContext));
