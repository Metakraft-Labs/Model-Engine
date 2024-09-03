import { defineComponent } from "../../../ecs/ComponentFunctions";

export const ScreenshareTargetComponent = defineComponent({
    name: "ScreenshareTargetComponent",
    jsonID: "EE_screenshare_target",
    toJSON: () => true,
});
