import { makeInNOutFunctionDesc, toCamelCase } from "../VisualScriptModule";

export function getStringConversionsForValueType({
    values,
    valueTypeName,
}: {
    values;
    valueTypeName;
}) {
    const camelCaseValueTypeName = toCamelCase(valueTypeName);

    return [
        makeInNOutFunctionDesc({
            name: `logic/string/convert/to${camelCaseValueTypeName}`,
            label: `To ${camelCaseValueTypeName}`,
            in: ["string"],
            out: valueTypeName,
            exec: a => values[valueTypeName]?.deserialize(a),
        }),
        makeInNOutFunctionDesc({
            name: `math/${valueTypeName}/convert/toString`,
            label: "To String",
            in: [valueTypeName],
            out: "string",
            exec: a => `${values[valueTypeName]?.serialize(a)}`,
        }),
    ];
}
