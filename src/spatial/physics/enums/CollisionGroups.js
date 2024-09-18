export const DefaultCollisionMask = (1 << 0) | (1 << 1) | (1 << 2);

export const AvatarCollisionMask = (1 << 0) | (1 << 2) | (1 << 3);

export const AllCollisionMask = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3);

export const CollisionGroups = {
    None: 0,
    Default: 1 << 0,
    Avatars: 1 << 1,
    Ground: 1 << 2,
    Trigger: 1 << 3,
};
