import { SigFoxApiIdReferenceDto } from "./sigfox-api-id-reference.dto";

export interface SigFoxApiDeviceResponse {
  data: SigFoxApiDeviceContent[];
}

export interface SigFoxApiDeviceContent {
  id: string;
  name: string;
  satelliteCapable: boolean;
  sequenceNumber: number;
  lastCom: any;
  state: number;
  comState: number;
  pac: string;
  location: Location;
  deviceType: SigFoxApiIdReferenceDto;
  group: SigFoxApiIdReferenceDto;
  lqi: number;
  activationTime: any;
  token: Token;
  contract: SigFoxApiIdReferenceDto;
  creationTime: any;
  modemCertificate: SigFoxApiIdReferenceDto;
  prototype: boolean;
  productCertificate: SigFoxProductCertificateIdKey;
  automaticRenewal: boolean;
  automaticRenewalStatus: number;
  createdBy: string;
  lastEditionTime: any;
  lastEditedBy: string;
  activable: boolean;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Token {
  state: number;
  detailMessage: string;
  end: any;
  freeMessages?: number;
  freeMessagesSent?: number;
}

export interface SigFoxProductCertificateIdKey {
  id: number;
  key: string;
}
