import { identityProviderPath } from "../../../common/src/schema.type.module";

export const IdentityProviderSeed = {
    id: "",
    token: "",
    accountIdentifier: "",
    oauthToken: "",
    oauthRefreshToken: "",
    type: "guest",
    userId: "",
    createdAt: "",
    updatedAt: "",
};

export const AuthUserSeed = {
    accessToken: "",
    authentication: {
        strategy: "",
    },
    identityProvider: IdentityProviderSeed,
};

export function resolveAuthUser(res) {
    return {
        accessToken: res.accessToken,
        authentication: res.authentication,
        identityProvider: res[identityProviderPath],
    };
}
