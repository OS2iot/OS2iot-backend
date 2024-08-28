import { AuthorizationType } from "@enum/authorization-type.enum";

export interface FiwareDataTargetConfiguration {
  url: string;
  timeout: number;
  authorizationType: AuthorizationType;
  username?: string;
  password?: string;
  authorizationHeader?: string;
  tenant?: string;
  context?: string;
  clientId?: string;
  clientSecret?: string;
  tokenEndpoint?: string;
  updatedAt: Date;
}
