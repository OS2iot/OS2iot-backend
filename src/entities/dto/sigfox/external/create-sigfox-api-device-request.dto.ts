export class CreateSigFoxApiDeviceRequestDto {
  id: string;
  name: string;
  pac: string;
  deviceTypeId: string;

  activable?: boolean;
  automaticRenewal?: boolean;
  lat?: number;
  lng?: number;
  productCertificate?: ProductCertificate;
  prototype?: boolean;
}

export class ProductCertificate {
  key: string;
}
