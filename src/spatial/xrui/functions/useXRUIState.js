import { useContext } from "react";

import { useHookstate } from "../../../hyperflux";

import { XRUIStateContext } from "../XRUIStateContext";

//@ts-ignore
export const useXRUIState = () => useHookstate < S > useContext(XRUIStateContext);
