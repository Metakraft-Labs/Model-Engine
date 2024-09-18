import { featureFlagSettingPath } from "../common/src/schema.type.module";
import { useFind } from "../spatial/common/functions/FeathersHooks";

const useFeatureFlags = flagNames => {
    const response = useFind(featureFlagSettingPath, {
        query: {
            $or: flagNames.map(flagName => ({ flagName })),
            paginate: false,
        },
    });

    if (response.status !== "success") {
        return [];
    }

    return flagNames.map(flagName => {
        const flag = response.data.find(({ flagName: name }) => name === flagName);
        return flag ? flag.flagValue : true;
    });
};

export default useFeatureFlags;
