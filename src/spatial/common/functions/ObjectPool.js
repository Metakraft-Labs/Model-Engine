const EMPTY_SLOT = Object.freeze(Object.create(null));

export function createObjectPool(objectFactory, autoGrow = false) {
    const objPool = [];
    let nextFreeSlot = null; // pool location to look for a free object to use

    return {
        use,
        recycle,
        grow,
        size,
        objPool,
    };

    // ******************************

    function use() {
        if (nextFreeSlot == null || nextFreeSlot == objPool.length) {
            if (autoGrow) grow(objPool.length || 5);
        }

        let objToUse = objPool[nextFreeSlot];
        if (objToUse) objPool[nextFreeSlot++] = EMPTY_SLOT;
        return objToUse;
    }

    function recycle(obj) {
        if (nextFreeSlot == null || nextFreeSlot == -1) {
            objPool[objPool.length] = obj;
        } else {
            objPool[--nextFreeSlot] = obj;
        }
    }

    function grow(count = objPool.length) {
        if (count > 0 && nextFreeSlot == null) {
            nextFreeSlot = 0;
        }

        if (count > 0) {
            let curLen = objPool.length;
            objPool.length += Number(count);

            for (let i = curLen; i < objPool.length; i++) {
                // add new obj to pool
                objPool[i] = objectFactory();
            }
        }

        return objPool.length;
    }

    function size() {
        return objPool.length;
    }
}
