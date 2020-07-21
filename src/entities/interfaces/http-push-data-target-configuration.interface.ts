import { AuthorizationType } from "@enum/authorization-type.enum";

export interface HttpPushDataTargetConfiguration {
    url: string;
    timeout: number;
    authorizationType: AuthorizationType;
    username?: string;
    password?: string;
    authorizationHeader?: string;
}
