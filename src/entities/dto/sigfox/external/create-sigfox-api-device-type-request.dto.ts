import { SigFoxApiIdReferenceDto } from "./sigfox-api-id-reference.dto";

export class CreateSigFoxApiDeviceTypeRequestDto {
    name: string;
    description: string;
    downlinkMode: number;
    downlinkDataString: string;
    payloadType: number;
    payloadConfig: string;
    keepAlive: number;
    alertEmail: string;
    automaticRenewal: boolean;
    groupId: string;
    contractId: string;
    contracts: SigFoxApiIdReferenceDto[];
    geolocPayloadConfigId: string;
}
