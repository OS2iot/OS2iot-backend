export interface SigFoxApiSingleDeviceResponseDto {
    id: string;
    name: string;
    satelliteCapable: boolean;
    deviceType: DeviceType;
    contract: Contract;
    group: Group;
    modemCertificate: ModemCertificate;
    prototype: boolean;
    productCertificate: ProductCertificate;
    location: Location;
    lastComputedLocation: LastComputedLocation;
    pac: string;
    sequenceNumber: number;
    trashSequenceNumber: number;
    lastCom: number;
    lqi: number;
    activationTime: number;
    creationTime: number;
    state: number;
    comState: number;
    token: Token;
    unsubscriptionTime: number;
    createdBy: string;
    lastEditionTime: number;
    lastEditedBy: string;
    automaticRenewal: boolean;
    automaticRenewalStatus: number;
    activable: boolean;
    actions: string[];
    resources: string[];
}

export interface DeviceType {
    id: string;
    name: string;
    actions: string[];
    resources: string[];
}

export interface Contract {
    id: string;
    name: string;
    actions: string[];
    resources: string[];
}

export interface Group {
    id: string;
    name: string;
    type: number;
    level: number;
    actions: string[];
}

export interface ModemCertificate {
    id: string;
    key: string;
}

export interface ProductCertificate {
    id: string;
    key: string;
}

export interface Location {
    lat: number;
    lng: number;
}

export interface LastComputedLocation {
    lat: number;
    lng: number;
    radius: number;
    sourceCode: number;
    placeIds: string[];
}

export interface Token {
    state: number;
    detailMessage: string;
    end: number;
    unsubscriptionTime: number;
    freeMessages: number;
    freeMessagesSent: number;
}
