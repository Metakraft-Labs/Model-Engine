import { EventDispatcher, Matrix4, Quaternion, Vector3 } from "three";

import { getComponent } from "../../../ecs/ComponentFunctions";
import { Engine } from "../../../ecs/Engine";
import { getState } from "../../../hyperflux";

import { CameraComponent } from "../../camera/components/CameraComponent";
import { Vector3_One } from "../../common/constants/MathConstants";
import { XRState } from "../XRState";
import { XR8 } from "./XR8";

export class XRPose {
    transform;
    constructor(transform) {
        this.transform = transform;
    }
}

export class XRView {
    eye = "left";
    projectionMatrix;
    transform;

    constructor(transform) {
        this.transform = transform;
        const camera = getComponent(Engine.instance.cameraEntity, CameraComponent);
        this.projectionMatrix = camera.projectionMatrix.toArray();
    }
}

export class XRViewerPose extends XRPose {
    views = [];

    constructor(transform) {
        super(transform);
        this.views.push(new XRView(transform));
    }
}

export class XRHitTestResultProxy {
    _mat4;
    constructor(position, rotation) {
        this._mat4 = new Matrix4().compose(position, rotation, Vector3_One);
    }

    getPose(baseSpace) {
        const _pos = new Vector3();
        const _rot = new Quaternion();
        this._mat4.decompose(_pos, _rot, _scale);
        if (!XRFrameProxy._lastFrame) throw new Error("XRFrameProxy._lastFrame is null");
        return XRFrameProxy._lastFrame.getPose(new XRSpace(_pos, _rot), baseSpace);
    }

    /** @todo */
    createAnchor = undefined;
}

export class XRSpace {
    _position = new Vector3();
    _rotation = new Quaternion();
    _matrix = new Matrix4();

    constructor(position, rotation) {
        if (position) this._position.copy(position);
        if (rotation) this._rotation.copy(rotation);
        this._matrix.compose(this._position, this._rotation, new Vector3(1, 1, 1));
    }
}

export class XRReferenceSpace extends XRSpace {
    getOffsetReferenceSpace(originOffset) {
        const offsetSpace = new XRReferenceSpace(this._position, this._rotation);
        offsetSpace._matrix.multiplyMatrices(this._matrix, originOffset._matrix);
        offsetSpace._matrix.decompose(offsetSpace._position, offsetSpace._rotation, _scale);
        return offsetSpace;
    }
    onreset = undefined;

    _listeners = {};

    addEventListener(eventName, listener) {
        const listeners = this._listeners;
        if (listeners[eventName] === undefined) {
            listeners[eventName] = [];
        }

        if (listeners[eventName].indexOf(listener) === -1) {
            listeners[eventName].push(listener);
        }
    }

    removeEventListener(eventName, listener) {
        const listenerArray = this._listeners[eventName];
        if (listenerArray !== undefined) {
            const index = listenerArray.indexOf(listener);
            if (index !== -1) {
                listenerArray.splice(index, 1);
            }
        }
    }

    dispatchEvent(event, ...args) {
        const listenerArray = this._listeners[event.type];
        if (listenerArray !== undefined) {
            const array = listenerArray.slice(0);

            for (let i = 0; i < array.length; i++) {
                array[i].call(this, event, ...args);
            }
        }
    }
}

export class XRRigidTransform {
    position = new Vector3();
    orientation = new Quaternion();
    _matrix = new Matrix4();

    constructor(position, orientation) {
        if (position) this.position.copy(position);
        if (orientation) this.orientation.copy(orientation);
        this._matrix.compose(this.position, this.orientation, Vector3_One);
    }

    get matrix() {
        return this._matrix.toArray();
    }

    get inverse() {
        const inverse = this._matrix.clone().invert();
        const pos = new Vector3();
        const rot = new Quaternion();
        inverse.decompose(pos, rot, new Vector3());
        return new XRRigidTransform(pos, rot);
    }
}

export class XRHitTestSource {
    cancel() {}
}

export class XRSessionProxy extends EventDispatcher {
    inputSources;
    interactionMode = "screen-space";
    environmentBlendMode = "alpha-blend";
    // visibilityState = 'visible' // Do not enable this
    domOverlayState = { type: "screen" };

    constructor(inputSources) {
        super();
        this.inputSources = inputSources;
    }

    async requestReferenceSpace(_type) {
        const space = new XRReferenceSpace();
        return space;
    }

    async requestHitTestSource(_args) {
        const source = new XRHitTestSource();
        return source;
    }

    updateRenderState() {
        // intentional noop
    }
}

const _mat4 = new Matrix4();
const _pos = new Vector3();
const _rot = new Quaternion();
const _scale = new Vector3();

/**
 * currently, the hit test proxy only supports viewer space
 */
export class XRFrameProxy {
    _viewerPose = null;
    static _lastFrameProxy = null;

    constructor() {
        const sessionActive = getState(XRState).sessionActive;
        const xr8scene = XR8.Threejs.xrScene();
        if (sessionActive && xr8scene) {
            const { camera } = xr8scene;
            this._viewerPose = new XRViewerPose(
                new XRRigidTransform(camera.position, camera.quaternion),
            );
        }
        XRFrameProxy._lastFrame = this;
    }

    getHitTestResults(_source) {
        const hits = XR8.XrController.hitTest(0.5, 0.5, ["FEATURE_POINT"]);
        return hits.map(
            ({ position, rotation }) =>
                new XRHitTestResultProxy(
                    position,
                    new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
                ),
        );
    }

    get session() {
        return getState(XRState).session;
    }

    getPose(space, baseSpace) {
        _mat4.copy(baseSpace._matrix).invert().multiply(space._matrix);
        _mat4.decompose(_pos, _rot, _scale);
        return new XRPose(new XRRigidTransform(_pos, _rot));
    }

    getViewerPose(_space) {
        return this._viewerPose;
    }
}
