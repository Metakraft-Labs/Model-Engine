import { ShapeType } from "@dimforge/rapier3d-compat";
import { BoxGeometry, CapsuleGeometry, CylinderGeometry, SphereGeometry } from "three";

export const SceneQueryType = {
    Closest: "Closest",
};

export const CollisionEvents = {
    COLLISION_START: "COLLISION_START",
    COLLISION_PERSIST: "COLLISION_PERSIST",
    COLLISION_END: "COLLISION_END",
    TRIGGER_START: "TRIGGER_START",
    TRIGGER_PERSIST: "TRIGGER_PERSIST",
    TRIGGER_END: "TRIGGER_END",
};

export const BodyTypes = {
    Fixed: "fixed",
    Dynamic: "dynamic",
    Kinematic: "kinematic",
};

export const Shapes = {
    Sphere: "sphere",
    Capsule: "capsule",
    Cylinder: "cylinder",
    Box: "box",
    Plane: "plane",
    ConvexHull: "convex_hull",
    Mesh: "mesh",
    Heightfield: "heightfield",
};

export const RapierShapeToString = {
    [ShapeType.Ball]: "sphere",
    [ShapeType.Cuboid]: "box",
    [ShapeType.Capsule]: "capsule",
    // [ShapeType.Segment]:
    // [ShapeType.Polyline]:
    // [ShapeType.Triangle]:
    [ShapeType.TriMesh]: "mesh",
    [ShapeType.HeightField]: "heightfield",
    [ShapeType.ConvexPolyhedron]: "convex_hull",
    [ShapeType.Cylinder]: "cylinder",
    // [ShapeType.Cone]:
    // [ShapeType.RoundCuboid]:
    // [ShapeType.RoundTriangle]:
    // [ShapeType.RoundCylinder]:
    // [ShapeType.RoundCone]:
    // [ShapeType.RoundConvexPolyhedron]:
    // [ShapeType.HalfSpace]:
};

export const OldShapeTypes = {
    Cuboid: "box",
    Ball: "sphere",
    Cylinder: "cylinder",
    Capsule: "capsule",
    TriMesh: "mesh",
    box: "box",
    ball: "sphere",
    cylinder: "cylinder",
    capsule: "capsule",
    trimesh: "mesh",
    [1]: "box",
    [0]: "sphere",
    [10]: "cylinder",
    [2]: "capsule",
    [6]: "mesh",
};

/** Maps Three.js geometry types to physics shapes */
export const ThreeToPhysics = {
    [SphereGeometry.prototype.type]: "sphere",
    [CapsuleGeometry.prototype.type]: "capsule",
    [CylinderGeometry.prototype.type]: "cylinder",
    [BoxGeometry.prototype.type]: "box",
};
