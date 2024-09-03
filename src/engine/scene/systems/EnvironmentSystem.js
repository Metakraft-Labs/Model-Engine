import React, { useEffect } from "react";

import {
    defineSystem,
    PresentationSystemGroup,
    QueryReactor,
    useComponent,
    useEntityContext,
} from "../../../ecs";
import { GroupComponent } from "../../../spatial/renderer/components/GroupComponent";
import { BackgroundComponent } from "../../../spatial/renderer/components/SceneComponents";
import { haveCommonAncestor } from "../../../spatial/transform/components/EntityTree";

import { EnvmapComponent, updateEnvMap } from "../components/EnvmapComponent";
import { EnvMapSourceType } from "../constants/EnvMapEnum";

const EnvmapReactor = props => {
    const entity = useEntityContext();
    const envmapComponent = useComponent(entity, EnvmapComponent);
    const backgroundComponent = useComponent(props.backgroundEntity, BackgroundComponent);
    const groupComponent = useComponent(entity, GroupComponent);

    useEffect(() => {
        // TODO use spatial queries
        if (!haveCommonAncestor(entity, props.backgroundEntity)) return;
        if (envmapComponent.type.value !== EnvMapSourceType.Skybox) return;
        for (const obj of groupComponent.value) {
            updateEnvMap(obj, backgroundComponent.value);
        }
    }, [envmapComponent.type, backgroundComponent]);

    return null;
};

const BackgroundReactor = () => {
    const backgroundEntity = useEntityContext();
    return (
        <QueryReactor
            Components={[EnvmapComponent]}
            ChildEntityReactor={EnvmapReactor}
            props={{ backgroundEntity }}
        />
    );
};

export const EnvironmentSystem = defineSystem({
    uuid: "ee.engine.EnvironmentSystem",
    insert: { after: PresentationSystemGroup },
    reactor: () => (
        <QueryReactor Components={[BackgroundComponent]} ChildEntityReactor={BackgroundReactor} />
    ),
});
