import { useEffect } from "react";
import { featureFlagSettingPath } from "../../common/src/schema.type.module";
import { defineState, getMutableState } from "../../hyperflux/functions/StateFunctions";
import { useFind } from "../../spatial/common/functions/FeathersHooks";

export const FeatureFlagsState = defineState({
    name: "ee.engine.FeatureFlagsState",
    initial: {},
    enabled(flagName) {
        const state = getMutableState(FeatureFlagsState)[flagName].value;
        return typeof state === "boolean" ? state : true;
    },
    reactor: () => {
        const featureFlagQuery = useFind(featureFlagSettingPath, { query: { paginate: false } });

        useEffect(() => {
            const data = featureFlagQuery.data;
            getMutableState(FeatureFlagsState).merge(
                Object.fromEntries(data.map(({ flagName, flagValue }) => [flagName, flagValue])),
            );
        }, [featureFlagQuery.data]);

        return null;
    },
});
