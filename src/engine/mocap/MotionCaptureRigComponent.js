import { VRMHumanBoneList } from "@pixiv/three-vrm";

import { defineComponent } from "../../ecs/ComponentFunctions";
import { useEntityContext } from "../../ecs/EntityFunctions";
import {
    QuaternionSchema,
    Vector3Schema,
} from "../../spatial/transform/components/TransformComponent";

export const MotionCaptureRigComponent = defineComponent({
    name: "MotionCaptureRigComponent",
    onInit: () => {
        return {
            prevWorldLandmarks: null,
            prevScreenLandmarks: null,
        };
    },
    schema: {
        rig: Object.fromEntries(VRMHumanBoneList.map(b => [b, QuaternionSchema])),
        slerpedRig: Object.fromEntries(VRMHumanBoneList.map(b => [b, QuaternionSchema])),
        hipPosition: Vector3Schema,
        hipRotation: QuaternionSchema,
        footOffset: "f64",
        solvingLowerBody: "ui8",
    },

    reactor: function () {
        const entity = useEntityContext();

        useEffect(() => {
            for (const boneName of VRMHumanBoneList) {
                //causes issues with ik solves, commenting out for now
                //proxifyVector3(AvatarRigComponent.rig[boneName].position, entity)
                //proxifyQuaternion(AvatarRigComponent.rig[boneName].rotation, entity)
            }
            MotionCaptureRigComponent.solvingLowerBody[entity] = 1;
        }, []);

        return null;
    },
});
