import { Quaternion, Vector3 } from "three";

const { defineProperties } = Object;

export const proxifyVector3 = (store, entity, vector3 = new Vector3()) => {
    // Set the initial values
    store.x[entity] = vector3.x;
    store.y[entity] = vector3.y;
    store.z[entity] = vector3.z;
    return defineProperties(vector3, {
        entity: { value: entity, configurable: true, writable: true },
        store: { value: store, configurable: true, writable: true },
        dirtyRecord: { value: {}, configurable: true, writable: true },
        x: {
            get() {
                return this.store.x[this.entity];
            },
            set(n) {
                return (this.store.x[this.entity] = n);
            },
            configurable: true,
        },
        y: {
            get() {
                return this.store.y[this.entity];
            },
            set(n) {
                return (this.store.y[this.entity] = n);
            },
            configurable: true,
        },
        z: {
            get() {
                return this.store.z[this.entity];
            },
            set(n) {
                return (this.store.z[this.entity] = n);
            },
            configurable: true,
        },
    });
};

export const proxifyVector3WithDirty = (store, entity, dirty, vector3 = new Vector3()) => {
    // Set the initial values
    store.x[entity] = vector3.x;
    store.y[entity] = vector3.y;
    store.z[entity] = vector3.z;
    dirty[entity] = true;
    return defineProperties(vector3, {
        entity: { value: entity, configurable: true, writable: true },
        store: { value: store, configurable: true, writable: true },
        dirtyRecord: { value: dirty, configurable: true, writable: true },
        x: {
            get() {
                return this.store.x[this.entity];
            },
            set(n) {
                this.dirtyRecord[this.entity] = true;
                return (this.store.x[this.entity] = n);
            },
            configurable: true,
        },
        y: {
            get() {
                return this.store.y[this.entity];
            },
            set(n) {
                this.dirtyRecord[this.entity] = true;
                return (this.store.y[this.entity] = n);
            },
            configurable: true,
        },
        z: {
            get() {
                return this.store.z[this.entity];
            },
            set(n) {
                this.dirtyRecord[this.entity] = true;
                return (this.store.z[this.entity] = n);
            },
            configurable: true,
        },
    });
};

export const proxifyQuaternion = (store, entity, quaternion = new Quaternion()) => {
    // Set the initial values
    store.x[entity] = quaternion.x;
    store.y[entity] = quaternion.y;
    store.z[entity] = quaternion.z;
    store.w[entity] = quaternion.w;
    return defineProperties(quaternion, {
        entity: { value: entity, configurable: true, writable: true },
        store: { value: store, configurable: true, writable: true },
        dirtyRecord: { value: {}, configurable: true, writable: true },
        _x: {
            get() {
                return this.store.x[this.entity];
            },
            set(n) {
                return (this.store.x[this.entity] = n);
            },
            configurable: true,
        },
        _y: {
            get() {
                return this.store.y[this.entity];
            },
            set(n) {
                return (this.store.y[this.entity] = n);
            },
            configurable: true,
        },
        _z: {
            get() {
                return this.store.z[this.entity];
            },
            set(n) {
                return (this.store.z[this.entity] = n);
            },
            configurable: true,
        },
        _w: {
            get() {
                return this.store.w[this.entity];
            },
            set(n) {
                return (this.store.w[this.entity] = n);
            },
            configurable: true,
        },
    });
};

export const proxifyQuaternionWithDirty = (store, entity, dirty, quaternion = new Quaternion()) => {
    // Set the initial values
    store.x[entity] = quaternion.x;
    store.y[entity] = quaternion.y;
    store.z[entity] = quaternion.z;
    store.w[entity] = quaternion.w;
    dirty[entity] = true;
    return defineProperties(quaternion, {
        entity: { value: entity, configurable: true, writable: true },
        store: { value: store, configurable: true, writable: true },
        dirtyRecord: { value: dirty, configurable: true, writable: true },
        _x: {
            get() {
                return this.store.x[this.entity];
            },
            set(n) {
                this.dirtyRecord[this.entity] = true;
                return (this.store.x[this.entity] = n);
            },
            configurable: true,
        },
        _y: {
            get() {
                return this.store.y[this.entity];
            },
            set(n) {
                this.dirtyRecord[this.entity] = true;
                return (this.store.y[this.entity] = n);
            },
            configurable: true,
        },
        _z: {
            get() {
                return this.store.z[this.entity];
            },
            set(n) {
                this.dirtyRecord[this.entity] = true;
                return (this.store.z[this.entity] = n);
            },
            configurable: true,
        },
        _w: {
            get() {
                return this.store.w[this.entity];
            },
            set(n) {
                this.dirtyRecord[this.entity] = true;
                return (this.store.w[this.entity] = n);
            },
            configurable: true,
        },
    });
};
