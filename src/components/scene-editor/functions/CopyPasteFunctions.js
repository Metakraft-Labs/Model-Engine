import { getAllComponents, serializeComponent } from "../../../ecs/ComponentFunctions";
import { defineState, getMutableState, getState } from "../../../hyperflux";

// fallback to avoid error at readText
export const CopyState = defineState({
    name: "CopyState",
    initial: "",
});

export const CopyPasteFunctions = {
    _generateComponentCopyData: entities =>
        entities.map(entity =>
            getAllComponents(entity)
                .map(component => {
                    if (!component.jsonID) return;
                    const json = serializeComponent(entity, component);
                    if (!json) return;
                    return {
                        name: component.jsonID,
                        json,
                    };
                })
                .filter(c => typeof c?.json === "object" && c.json !== null),
        ),

    copyEntities: async entities => {
        const copyData = JSON.stringify(CopyPasteFunctions._generateComponentCopyData(entities));
        await navigator.clipboard.writeText(copyData);
        getMutableState(CopyState).set(copyData);
    },

    getPastedEntities: async () => {
        let clipboardText = "";
        try {
            clipboardText = await navigator.clipboard.readText();
        } catch {
            clipboardText = getState(CopyState);
        }

        // eslint-disable-next-line no-useless-catch
        try {
            const nodeComponentJSONs = JSON.parse(clipboardText);
            return nodeComponentJSONs.map(nodeComponentJSON =>
                nodeComponentJSON.map(c => ({ name: c.name, props: c.json })),
            );
        } catch (err) {
            throw err;
        }
    },
};
