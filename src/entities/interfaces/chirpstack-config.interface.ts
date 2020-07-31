import { AuthorizationType } from "@enum/authorization-type.enum";

export interface ChirpstackInterface {
    url: string;
    timeout: number;
    authorizationType: AuthorizationType;
    authorizationHeader: string;
}
