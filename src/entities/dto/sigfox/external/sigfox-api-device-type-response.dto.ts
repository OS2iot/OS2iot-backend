import { SigFoxApiIdReferenceDto } from "./sigfox-api-id-reference.dto";

export interface SigFoxApiDeviceTypeResponse {
    data: SigFoxApiDeviceTypeContent[];
}

export interface SigFoxApiDeviceTypeContent {
    id: string;
    automaticRenewal: boolean;
    name: string;
    description: string;
    keepAlive: number;
    payloadType: number;
    downlinkMode: number;
    downlinkDataString: string;
    group: SigFoxApiIdReferenceDto;
    contract: SigFoxApiIdReferenceDto;
    contracts: SigFoxApiIdReferenceDto[];
    detachedContracts: SigFoxApiIdReferenceDto[];
    creationTime: any;
    createdBy: string;
    lastEditionTime: any;
    lastEditedBy: string;
}
