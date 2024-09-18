import {
    BoxGeometry,
    CapsuleGeometry,
    CircleGeometry,
    CylinderGeometry,
    DodecahedronGeometry,
    IcosahedronGeometry,
    OctahedronGeometry,
    PlaneGeometry,
    RingGeometry,
    SphereGeometry,
    TetrahedronGeometry,
    TorusGeometry,
    TorusKnotGeometry,
} from "three";

export const GeometryTypeEnum = {
    BoxGeometry: "BoxGeometry",
    SphereGeometry: "SphereGeometry",
    CylinderGeometry: "CylinderGeometry",
    CapsuleGeometry: "CapsuleGeometry",
    PlaneGeometry: "PlaneGeometry",
    CircleGeometry: "CircleGeometry",
    RingGeometry: "RingGeometry",
    TorusGeometry: "TorusGeometry",
    DodecahedronGeometry: "DodecahedronGeometry",
    IcosahedronGeometry: "IcosahedronGeometry",
    OctahedronGeometry: "OctahedronGeometry",
    TetrahedronGeometry: "TetrahedronGeometry",
    TorusKnotGeometry: "TorusKnotGeometry",
};

export const GeometryTypeToClass = {
    BoxGeometry: BoxGeometry,
    SphereGeometry: SphereGeometry,
    CylinderGeometry: CylinderGeometry,
    CapsuleGeometry: CapsuleGeometry,
    PlaneGeometry: PlaneGeometry,
    CircleGeometry: CircleGeometry,
    RingGeometry: RingGeometry,
    TorusGeometry: TorusGeometry,
    DodecahedronGeometry: DodecahedronGeometry,
    IcosahedronGeometry: IcosahedronGeometry,
    OctahedronGeometry: OctahedronGeometry,
    TetrahedronGeometry: TetrahedronGeometry,
    TorusKnotGeometry: TorusKnotGeometry,
};

export const GeometryTypeToFactory = {
    [GeometryTypeEnum.BoxGeometry]: data =>
        new BoxGeometry(
            data.width,
            data.height,
            data.depth,
            data.widthSegments,
            data.heightSegments,
            data.depthSegments,
        ),
    [GeometryTypeEnum.CapsuleGeometry]: data =>
        new CapsuleGeometry(data.radius, data.length, data.capSegments, data.radialSegments),
    [GeometryTypeEnum.CircleGeometry]: data =>
        new CircleGeometry(data.radius, data.segments, data.thetaStart, data.thetaLength),
    [GeometryTypeEnum.CylinderGeometry]: data =>
        new CylinderGeometry(
            data.radiusTop,
            data.radiusBottom,
            data.height,
            data.radialSegments,
            data.heightSegments,
            data.openEnded,
            data.thetaStart,
            data.thetaLength,
        ),
    [GeometryTypeEnum.DodecahedronGeometry]: data =>
        new DodecahedronGeometry(data.radius, data.detail),
    [GeometryTypeEnum.IcosahedronGeometry]: data =>
        new IcosahedronGeometry(data.radius, data.detail),
    [GeometryTypeEnum.OctahedronGeometry]: data => new OctahedronGeometry(data.radius, data.detail),
    [GeometryTypeEnum.PlaneGeometry]: data =>
        new PlaneGeometry(data.width, data.height, data.widthSegments, data.heightSegments),
    [GeometryTypeEnum.RingGeometry]: data =>
        new RingGeometry(
            data.innerRadius,
            data.outerRadius,
            data.thetaSegments,
            data.phiSegments,
            data.thetaStart,
            data.thetaLength,
        ),
    [GeometryTypeEnum.SphereGeometry]: data =>
        new SphereGeometry(
            data.radius,
            data.widthSegments,
            data.heightSegments,
            data.phiStart,
            data.phiLength,
            data.thetaStart,
            data.thetaLength,
        ),
    [GeometryTypeEnum.TetrahedronGeometry]: data =>
        new TetrahedronGeometry(data.radius, data.detail),
    [GeometryTypeEnum.TorusGeometry]: data =>
        new TorusGeometry(
            data.radius,
            data.tube,
            data.radialSegments,
            data.tubularSegments,
            data.arc,
        ),
    [GeometryTypeEnum.TorusKnotGeometry]: data =>
        new TorusKnotGeometry(
            data.radius,
            data.tube,
            data.tubularSegments,
            data.radialSegments,
            data.p,
            data.q,
        ),
};
