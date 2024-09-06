export function getNestedObject(object, propertyName) {
    const props = propertyName.split(".");
    let result = object;

    for (let i = 0; i < props.length - 1; i++) {
        let isNumber = false;

        try {
            Number(props[0]);
            isNumber = true;
        } catch (e) {
            isNumber = false;
        }

        let val = props[i] | number;

        if (isNumber) {
            val = Number(val);
        }

        if (typeof result[props[i]] === "undefined") result[props[i]] = {};
        result = result[props[i]];
    }

    return { result, finalProp: props[props.length - 1] };
}
