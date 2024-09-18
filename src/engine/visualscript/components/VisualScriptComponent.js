import React, { useEffect } from "react";
import matches from "ts-matches";

import {
    cleanStorageProviderURLs,
    parseStorageProviderURLs,
} from "../../../common/src/utils/parseSceneJSON";
import {
    defineComponent,
    hasComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { useMutableState } from "../../../hyperflux";
import { useAncestorWithComponent } from "../../../spatial/transform/components/EntityTree";
import { VisualScriptState, defaultVisualScript } from "../../../visual-script";

import { GLTFComponent } from "../../gltf/GLTFComponent";
import { useVisualScriptRunner } from "../systems/useVisualScriptRunner";

export const VisualScriptDomain = {
    ECS: "ECS",
};

export const VisualScriptComponent = defineComponent({
    name: "VisualScriptComponent",
    jsonID: "EE_visual_script",

    onInit: _entity => {
        const domain = VisualScriptDomain.ECS;
        const visualScript = parseStorageProviderURLs(defaultVisualScript);
        return {
            domain: domain,
            visualScript: visualScript,
            run: false,
            disabled: false,
        };
    },

    toJSON: (_entity, component) => {
        return {
            domain: component.domain.value,
            visualScript: cleanStorageProviderURLs(
                JSON.parse(JSON.stringify(component.visualScript.get({ noproxy: true }))),
            ),
            run: false,
            disabled: component.disabled.value,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (typeof json.disabled === "boolean") component.disabled.set(json.disabled);
        if (typeof json.run === "boolean") component.run.set(json.run);
        const domainValidator = matches.string;
        if (domainValidator.test(json.domain)) {
            component.domain.value !== json.domain && component.domain.set(json.domain);
        }
        const visualScriptValidator = matches.object;
        if (visualScriptValidator.test(json.visualScript)) {
            component.visualScript.set(parseStorageProviderURLs(json.visualScript));
        }
    },

    // we make reactor for each component handle the engine
    reactor: () => {
        const entity = useEntityContext();
        const visualScript = useComponent(entity, VisualScriptComponent);
        const visualScriptState = useMutableState(VisualScriptState);
        const canPlay = visualScript.run.value && !visualScript.disabled.value;
        const registry = visualScriptState.registries[visualScript.domain.value].get({
            noproxy: true,
        });
        const gltfAncestor = useAncestorWithComponent(entity, GLTFComponent);

        const visualScriptRunner = useVisualScriptRunner({
            visualScriptJson: visualScript.visualScript.get({ noproxy: true }),
            autoRun: canPlay,
            registry,
        });

        useEffect(() => {
            if (visualScript.disabled.value) return;
            visualScript.run.value ? visualScriptRunner.play() : visualScriptRunner.pause();
        }, [visualScript.run]);

        useEffect(() => {
            if (!visualScript.disabled.value) return;
            visualScript.run.set(false);
        }, [visualScript.disabled]);

        if (!gltfAncestor) return null;

        return <LoadReactor entity={entity} gltfAncestor={gltfAncestor} key={gltfAncestor} />;
    },
});

const LoadReactor = props => {
    const loaded = GLTFComponent.useSceneLoaded(props.gltfAncestor);

    useEffect(() => {
        setComponent(props.entity, VisualScriptComponent, { run: true });

        return () => {
            if (!hasComponent(props.entity, VisualScriptComponent)) return;
            setComponent(props.entity, VisualScriptComponent, { run: false });
        };
    }, [loaded]);

    return null;
};
