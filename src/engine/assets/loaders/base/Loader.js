import { DefaultLoadingManager } from "three";
import { ResourceLoadingManagerState } from "../../state/ResourceLoadingManagerState";

class Loader {
    static DEFAULT_MATERIAL_NAME = "__DEFAULT";

    manager;
    crossOrigin;
    withCredentials;
    path;
    resourcePath;
    requestHeader;

    constructor(manager) {
        this.manager = manager !== undefined ? manager : DefaultLoadingManager;

        this.crossOrigin = "anonymous";
        this.withCredentials = false;
        this.path = "";
        this.resourcePath = "";
        this.requestHeader = {};

        ResourceLoadingManagerState.initialize();
    }

    load(url, onLoad, onProgress, onError, signal) {}

    loadAsync(url, onProgress) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const scope = this;

        return new Promise(function (resolve, reject) {
            scope.load(url, resolve, onProgress, reject);
        });
    }

    parse(data, path, onLoad, onError, url = "") {}

    setCrossOrigin(crossOrigin) {
        this.crossOrigin = crossOrigin;
        return this;
    }

    setWithCredentials(value) {
        this.withCredentials = value;
        return this;
    }

    setPath(path) {
        this.path = path;
        return this;
    }

    setResourcePath(resourcePath) {
        this.resourcePath = resourcePath;
        return this;
    }

    setRequestHeader(requestHeader) {
        this.requestHeader = requestHeader;
        return this;
    }
}

export { Loader };
