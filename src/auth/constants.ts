import { AuthenticatedUser } from "@dto/internal/authenticated-user";

export type HeaderApiVerifiedCallback = (
    err: Error | null,
    user?: AuthenticatedUser,
    info?: Record<string, unknown>
) => void;

export const ApiKeyStrategyName = "api-key";
export const ApiKeyHeader = "X-API-KEY";
export const LocalStrategyName = "local";
export const JwtStrategyName = "jwt";
export const RolesMetaData = "roles";
