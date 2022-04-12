import { AuthorizationType } from "@enum/authorization-type.enum";

export interface MqttDataTargetConfiguration {
    url: string;
    topic: string;
    timeout: number;
    // TODO: Is auth type necessary?
    // authorizationType: AuthorizationType;
    username?: string;
    password?: string;
}
