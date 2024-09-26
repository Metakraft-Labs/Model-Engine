import { defineComponent } from "../../../ecs";
export const LookAtComponent = defineComponent({
    name: "LookAtComponent",
    jsonID: "IR_lookAt",
    onInit: _entity => ({
        target: null,
        xAxis: true,
        yAxis: true,
    }),
    onSet: (_entity, component, props) => {
        if (typeof props?.target === "string") {
            component.target.set(props.target);
        }
        if (typeof props?.xAxis === "boolean") {
            component.xAxis.set(props.xAxis);
        }
        if (typeof props?.yAxis === "boolean") {
            component.yAxis.set(props.yAxis);
        }
    },
    toJSON: (_entity, component) => ({
        target: component.target.value,
        xAxis: component.xAxis.value,
        yAxis: component.yAxis.value,
    }),
});
