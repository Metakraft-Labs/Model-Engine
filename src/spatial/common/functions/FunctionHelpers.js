export function throttle(func, wait, options = {}) {
    let timeout, context, _args, result;
    let previous = 0;

    const later = function () {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        result = func.apply(context, _args);
        if (!timeout) context = _args = null;
    };

    const throttled = function () {
        const _now = Date.now();
        if (!previous && options.leading === false) previous = _now;
        const remaining = wait - (_now - previous);
        context = this;
        _args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = _now;
            result = func.apply(context, _args);
            if (!timeout) context = _args = null;
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };

    throttled.cancel = function () {
        clearTimeout(timeout);
        previous = 0;
        timeout = context = _args = null;
    };

    return throttled;
}
