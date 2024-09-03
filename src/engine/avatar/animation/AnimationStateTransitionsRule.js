export function booleanTransitionRule(object, property, negate = false) {
    if (negate) return () => !object[property];
    return () => object[property];
}

export function animationTimeTransitionRule(action, threshold, lowerThan = false) {
    if (lowerThan) return () => action.time / action.getClip().duration <= threshold;
    return () => action.time / action.getClip().duration >= threshold;
}

export function vectorLengthTransitionRule(value, threshold, lowerThan = false, exact = false) {
    if (exact) {
        if (lowerThan) return () => value.length() <= threshold;
        return () => value.length() >= threshold;
    }

    if (lowerThan) return () => value.lengthSq() <= threshold;
    return () => value.lengthSq() >= threshold;
}

export function compositeTransitionRule(rules, operator) {
    if (operator === "and")
        return () => {
            let result = false;
            for (const rle of rules) {
                result = rle();
                if (!result) break;
            }
            return result;
        };

    return () => {
        let result = false;
        for (const rle of rules) {
            result = rle();
            if (result) break;
        }
        return result;
    };
}

// Allows state transition based on an object's numerical property
export function thresholdTransitionRule(object, property, threshold = 0, largerThan = false) {
    if (largerThan) return () => object[property] > threshold;
    return () => object[property] < threshold;
}
