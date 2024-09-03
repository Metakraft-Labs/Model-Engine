import { MeshLambertMaterial as Lambert } from "three";

import { BasicArgs, EmissiveMapArgs, EnvMapArgs } from "../constants/BasicArgs";
import { BoolArg } from "../constants/DefaultArgs";

export const MeshLambertArguments = {
    ...BasicArgs,
    ...EmissiveMapArgs,
    ...EnvMapArgs,
    fog: BoolArg,
};

export const MeshLambertMaterial = {
    prototypeId: "MeshLambertMaterial",
    prototypeConstructor: Lambert,
    argumentsLambertArguments,
};

// export const MeshLambertMaterial = defineComponent({
//   name: 'MeshLambertMaterial',
//   onInit: (entity) => {
//     return {
//       material: new Lambert()
//     }
//   },
// })

export default MeshLambertMaterial;
