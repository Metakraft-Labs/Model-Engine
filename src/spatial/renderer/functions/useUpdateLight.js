import { Vector3 } from "three";

import { useExecute } from "../../../ecs/SystemFunctions";
import { TransformSystem } from "../../transform/systems/TransformSystem";

export const useUpdateLight = light => {
    useExecute(
        () => {
            light.getWorldDirection(_vec3);
            light.getWorldPosition(light.target.position).add(_vec3);
            light.target.updateMatrixWorld();
        },
        { after: TransformSystem },
    );
};

const _vec3 = new Vector3();
