import { Types } from "bitecs";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";

import {
    defineComponent,
    getComponent,
    getOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import {
    EntityTreeComponent,
    getAncestorWithComponent,
} from "../../../spatial/transform/components/EntityTree";

import { isZero } from "../../common/functions/MathFunctions";
import {
    proxifyQuaternionWithDirty,
    proxifyVector3WithDirty,
} from "../../common/proxies/createThreejsProxy";
import { SceneComponent } from "../../renderer/components/SceneComponents";

const { f64 } = Types;
export const Vector3Schema = { x: f64, y: f64, z: f64 };
export const QuaternionSchema = { x: f64, y: f64, z: f64, w: f64 };
export const PoseSchema = {
    positionSchema,
    rotationSchema,
};
export const TransformSchema = {
    positionSchema,
    rotationSchema,
    scaleSchema,
};

export const TransformComponent = defineComponent({
    name: "TransformComponent",
    jsonID: "EE_transform",
    schema: TransformSchema,

    onInit: _entity => {
        const dirtyTransforms = TransformComponent.dirtyTransforms;
        const component = {
            position: proxifyVector3WithDirty(TransformComponent.position, entity, dirtyTransforms),
            rotation: proxifyQuaternionWithDirty(
                TransformComponent.rotation,
                entity,
                dirtyTransforms,
            ),
            scale: proxifyVector3WithDirty(
                TransformComponent.scale,
                entity,
                dirtyTransforms,
                new Vector3(1, 1, 1),
            ),
            matrix: new Matrix4(),
            matrixWorld: new Matrix4(),
        };
        return component;
    },

    onSet: (entity, component, json) => {
        const rotation = json?.rotation
            ? typeof json.rotation.w === "number"
                ? json.rotation
                : new Quaternion().setFromEuler(new Euler().setFromVector3(json.rotation))
            : undefined;
        if (json?.position) component.position.value.copy(json.position);
        if (rotation) component.rotation.value.copy(rotation);
        if (json?.scale && !isZero(json.scale)) component.scale.value.copy(json.scale);

        const transform = getComponent(entity, TransformComponent);
        composeMatrix(entity);
        const entityTree = getOptionalComponent(entity, EntityTreeComponent);
        const parentEntity = entityTree?.parentEntity;
        if (parentEntity) {
            const parentTransform = getOptionalComponent(parentEntity, TransformComponent);
            if (parentTransform)
                transform.matrixWorld.multiplyMatrices(
                    parentTransform.matrixWorld,
                    transform.matrix,
                );
        } else {
            transform.matrixWorld.copy(transform.matrix);
        }
    },

    toJSON: (entity, component) => {
        return {
            position: component.position.value,
            rotation: component.rotation.value,
            scale: component.scale.value,
        };
    },

    onRemove: entity => {
        delete TransformComponent.dirtyTransforms[entity];
    },

    getWorldPosition: (entity, vec3) => {
        const transform = getComponent(entity, TransformComponent);
        vec3.x = transform.matrixWorld.elements[12];
        vec3.y = transform.matrixWorld.elements[13];
        vec3.z = transform.matrixWorld.elements[14];
        return vec3;
    },

    getMatrixRelativeToEntity: (entity, relativeEntity, outMatrix) => {
        const transform = getComponent(entity, TransformComponent);
        const relativeTransform = getComponent(relativeEntity, TransformComponent);
        return outMatrix
            .copy(relativeTransform.matrixWorld)
            .invert()
            .multiply(transform.matrixWorld);
    },

    getMatrixRelativeToScene: (entity, outMatrix) => {
        const relativeEntity = getAncestorWithComponent(entity, SceneComponent);
        if (!relativeEntity)
            return outMatrix.copy(getComponent(entity, TransformComponent).matrixWorld);
        return TransformComponent.getMatrixRelativeToEntity(entity, relativeEntity, outMatrix);
    },

    // this method is essentially equivalent to Matrix4.decompose
    getWorldRotation: (entity, quaternion) => {
        const transform = getComponent(entity, TransformComponent);
        const te = transform.matrixWorld.elements;

        let sx = _v1.set(te[0], te[1], te[2]).length();
        const sy = _v1.set(te[4], te[5], te[6]).length();
        const sz = _v1.set(te[8], te[9], te[10]).length();

        // if determine is negative, we need to invert one scale
        const det = transform.matrixWorld.determinant();
        if (det < 0) sx = -sx;

        // scale the rotation part
        _m1.copy(transform.matrixWorld);

        const invSX = 1 / sx;
        const invSY = 1 / sy;
        const invSZ = 1 / sz;

        _m1.elements[0] *= invSX;
        _m1.elements[1] *= invSX;
        _m1.elements[2] *= invSX;

        _m1.elements[4] *= invSY;
        _m1.elements[5] *= invSY;
        _m1.elements[6] *= invSY;

        _m1.elements[8] *= invSZ;
        _m1.elements[9] *= invSZ;
        _m1.elements[10] *= invSZ;

        quaternion.setFromRotationMatrix(_m1);

        return quaternion;
    },

    getWorldScale: (entity, vec3) => {
        const transform = getComponent(entity, TransformComponent);
        const te = transform.matrixWorld.elements;

        let sx = _v1.set(te[0], te[1], te[2]).length();
        const sy = _v1.set(te[4], te[5], te[6]).length();
        const sz = _v1.set(te[8], te[9], te[10]).length();

        // if determine is negative, we need to invert one scale
        const det = transform.matrixWorld.determinant();
        if (det < 0) sx = -sx;

        vec3.x = sx;
        vec3.y = sy;
        vec3.z = sz;

        return vec3;
    },

    getSceneScale: (entity, vec3) => {
        const sceneEntity = getAncestorWithComponent(entity, SceneComponent);
        if (!sceneEntity) return vec3.set(1, 1, 1);

        TransformComponent.getMatrixRelativeToEntity(entity, sceneEntity, _m1);
        const te = _m1.elements;

        let sx = _v1.set(te[0], te[1], te[2]).length();
        const sy = _v1.set(te[4], te[5], te[6]).length();
        const sz = _v1.set(te[8], te[9], te[10]).length();

        // if determine is negative, we need to invert one scale
        const det = _m1.determinant();
        if (det < 0) sx = -sx;

        vec3.x = sx;
        vec3.y = sy;
        vec3.z = sz;

        return vec3;
    },

    /**
     * Updates the matrixWorld property of the transform component
     * @param entity
     */
    updateFromWorldMatrix: entity => {
        const transform = getComponent(entity, TransformComponent);
        const parentEntity = getComponent(entity, EntityTreeComponent)?.parentEntity;
        if (parentEntity) {
            const parentTransform = getComponent(parentEntity, TransformComponent);
            mat4.copy(parentTransform.matrixWorld).invert();
            transform.matrix.multiplyMatrices(mat4, transform.matrixWorld);
        } else {
            transform.matrix.copy(transform.matrixWorld);
        }
        decomposeMatrix(entity);
        TransformComponent.dirtyTransforms[entity] = true;
    },

    /**
     * Updates the position aspect of the matrixWorld property of the transform component
     * @param entity
     * @param position
     */
    setWorldPosition: (entity, position) => {
        const transform = getComponent(entity, TransformComponent);
        transform.matrixWorld.elements[12] = position.x;
        transform.matrixWorld.elements[13] = position.y;
        transform.matrixWorld.elements[14] = position.z;
    },

    /**
     * Updates the rotation aspect of the matrixWorld property of the transform component
     * @param entity
     * @param quaternion
     */
    setWorldRotation: (entity, quaternion) => {
        const transform = getComponent(entity, TransformComponent);
        transform.matrixWorld.decompose(vec3, quat, vec3_2);
        transform.matrixWorld.compose(vec3, quaternion, vec3_2);
    },

    /**
     * Updates the scale aspect of the matrixWorld property of the transform component
     * @param entity
     * @param scale
     */
    setWorldScale: (entity, scale) => {
        const transform = getComponent(entity, TransformComponent);
        transform.matrixWorld.decompose(vec3, quat, vec3_2);
        transform.matrixWorld.compose(vec3, quat, scale);
    },

    /**Transforms forward vector*/
    forward: (entity, outVector) => {
        const matrixElements = getComponent(entity, TransformComponent).matrixWorld.elements;
        outVector.set(matrixElements[8], matrixElements[9], matrixElements[10]).normalize();
        return outVector;
    },

    /**Transforms back vector*/
    back: (entity, outVector) => {
        const matrixElements = getComponent(entity, TransformComponent).matrixWorld.elements;
        outVector
            .set(matrixElements[8], matrixElements[9], matrixElements[10])
            .normalize()
            .negate();
        return outVector;
    },

    /**Transforms up vector*/
    up: (entity, outVector) => {
        const matrixElements = getComponent(entity, TransformComponent).matrixWorld.elements;
        outVector.set(matrixElements[4], matrixElements[5], matrixElements[6]).normalize();
        return outVector;
    },

    /**Transforms down vector*/
    down: (entity, outVector) => {
        const matrixElements = getComponent(entity, TransformComponent).matrixWorld.elements;
        outVector.set(matrixElements[4], matrixElements[5], matrixElements[6]).normalize().negate();
        return outVector;
    },

    /**Transforms right vector*/
    right: (entity, outVector) => {
        const matrixElements = getComponent(entity, TransformComponent).matrixWorld.elements;
        outVector.set(matrixElements[0], matrixElements[1], matrixElements[2]).normalize();
        return outVector;
    },

    /**Transforms left vector*/
    left: (entity, outVector) => {
        const matrixElements = getComponent(entity, TransformComponent).matrixWorld.elements;
        outVector.set(matrixElements[0], matrixElements[1], matrixElements[2]).normalize().negate();
        return outVector;
    },

    dirtyTransforms: {},
    transformsNeedSorting: false,
});

const vec3 = new Vector3();
const vec3_2 = new Vector3();
const quat = new Quaternion();
const mat4 = new Matrix4();

const _v1 = new Vector3();
const _m1 = new Matrix4();

export const composeMatrix = entity => {
    const te = getComponent(entity, TransformComponent).matrix.elements;

    const x = TransformComponent.rotation.x[entity];
    const y = TransformComponent.rotation.y[entity];
    const z = TransformComponent.rotation.z[entity];
    const w = TransformComponent.rotation.w[entity];

    const x2 = x + x,
        y2 = y + y,
        z2 = z + z;
    const xx = x * x2,
        xy = x * y2,
        xz = x * z2;
    const yy = y * y2,
        yz = y * z2,
        zz = z * z2;
    const wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    const sx = TransformComponent.scale.x[entity];
    const sy = TransformComponent.scale.y[entity];
    const sz = TransformComponent.scale.z[entity];

    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz - wy) * sx;
    te[3] = 0;

    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;

    te[8] = (xz + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;

    te[12] = TransformComponent.position.x[entity];
    te[13] = TransformComponent.position.y[entity];
    te[14] = TransformComponent.position.z[entity];
    te[15] = 1;
};

export const decomposeMatrix = entity => {
    const matrix = getComponent(entity, TransformComponent).matrix;
    const te = matrix.elements;

    let sx = _v1.set(te[0], te[1], te[2]).length();
    const sy = _v1.set(te[4], te[5], te[6]).length();
    const sz = _v1.set(te[8], te[9], te[10]).length();

    // if determine is negative, we need to invert one scale
    const det = matrix.determinant();
    if (det < 0) sx = -sx;

    TransformComponent.position.x[entity] = te[12];
    TransformComponent.position.y[entity] = te[13];
    TransformComponent.position.z[entity] = te[14];

    // scale the rotation part
    _m1.copy(matrix);

    const invSX = 1 / sx;
    const invSY = 1 / sy;
    const invSZ = 1 / sz;

    _m1.elements[0] *= invSX;
    _m1.elements[1] *= invSX;
    _m1.elements[2] *= invSX;

    _m1.elements[4] *= invSY;
    _m1.elements[5] *= invSY;
    _m1.elements[6] *= invSY;

    _m1.elements[8] *= invSZ;
    _m1.elements[9] *= invSZ;
    _m1.elements[10] *= invSZ;

    setFromRotationMatrix(entity, _m1);

    TransformComponent.scale.x[entity] = sx;
    TransformComponent.scale.y[entity] = sy;
    TransformComponent.scale.z[entity] = sz;
};

export const setFromRotationMatrix = (entity, m) => {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

    const te = m.elements,
        m11 = te[0],
        m12 = te[4],
        m13 = te[8],
        m21 = te[1],
        m22 = te[5],
        m23 = te[9],
        m31 = te[2],
        m32 = te[6],
        m33 = te[10],
        trace = m11 + m22 + m33;

    if (trace > 0) {
        const s = 0.5 / Math.sqrt(trace + 1.0);

        TransformComponent.rotation.w[entity] = 0.25 / s;
        TransformComponent.rotation.x[entity] = (m32 - m23) * s;
        TransformComponent.rotation.y[entity] = (m13 - m31) * s;
        TransformComponent.rotation.z[entity] = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
        const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

        TransformComponent.rotation.w[entity] = (m32 - m23) / s;
        TransformComponent.rotation.x[entity] = 0.25 * s;
        TransformComponent.rotation.y[entity] = (m12 + m21) / s;
        TransformComponent.rotation.z[entity] = (m13 + m31) / s;
    } else if (m22 > m33) {
        const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

        TransformComponent.rotation.w[entity] = (m13 - m31) / s;
        TransformComponent.rotation.x[entity] = (m12 + m21) / s;
        TransformComponent.rotation.y[entity] = 0.25 * s;
        TransformComponent.rotation.z[entity] = (m23 + m32) / s;
    } else {
        const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

        TransformComponent.rotation.w[entity] = (m21 - m12) / s;
        TransformComponent.rotation.x[entity] = (m13 + m31) / s;
        TransformComponent.rotation.y[entity] = (m23 + m32) / s;
        TransformComponent.rotation.z[entity] = 0.25 * s;
    }
};

export const TransformGizmoTagComponent = defineComponent({ name: "TransformGizmoTag" });
