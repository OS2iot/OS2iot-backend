import { hasProps, nameof } from "./type-helper";

export interface LoRaWANPayload {
  rxInfo: LoRaWANSignalData[];
}

export interface LoRaWANSignalData {
  name: string;
  rssi: number;
  time: string;
  snr: number;
  location: {
    altitude: number;
    latitude: number;
    longitude: number;
  };
  uplinkID: string;
  gatewayID: string;
}

export interface SigFoxPayload {
  duplicates: SigFoxSignalData[];
}

/**
 * @see https://support.sigfox.com/docs/data-advanced
 */
export interface SigFoxSignalData {
  rssi: number;
  snr: number;
}

export const isValidLoRaWANPayload = (payload: unknown): payload is LoRaWANPayload => {
  return (
    payload &&
    typeof payload === "object" &&
    hasProps(payload, nameof<LoRaWANPayload>("rxInfo")) &&
    isValidLoRaWANSignalData(payload.rxInfo)
  );
};

export const isValidLoRaWANSignalData = (rxInfo: unknown): rxInfo is LoRaWANSignalData[] => {
  if (Array.isArray(rxInfo)) {
    // TS narrows it to any[]. Issue: https://github.com/microsoft/TypeScript/issues/17002
    const unknownInfo = rxInfo as unknown[];
    return (
      typeof unknownInfo[0] === "object" &&
      hasProps(unknownInfo[0], nameof<LoRaWANSignalData>("rssi")) &&
      typeof unknownInfo[0].rssi === "number" &&
      hasProps(unknownInfo[0], nameof<LoRaWANSignalData>("snr")) &&
      typeof unknownInfo[0].snr === "number"
    );
  }

  return false;
};

export const isValidSigFoxPayload = (payload: unknown): payload is SigFoxPayload => {
  return (
    payload &&
    typeof payload === "object" &&
    hasProps(payload, nameof<SigFoxPayload>("duplicates")) &&
    isValidSigFoxSignalData(payload.duplicates)
  );
};

export const isValidSigFoxSignalData = (rxInfo: unknown): rxInfo is SigFoxSignalData[] => {
  if (Array.isArray(rxInfo)) {
    // TS narrows it to any[]. Issue: https://github.com/microsoft/TypeScript/issues/17002
    const unknownInfo = rxInfo as unknown[];

    return (
      typeof unknownInfo[0] === "object" &&
      hasProps(unknownInfo[0], nameof<SigFoxSignalData>("rssi")) &&
      typeof unknownInfo[0].rssi === "number" &&
      hasProps(unknownInfo[0], nameof<SigFoxSignalData>("snr")) &&
      typeof unknownInfo[0].snr === "number"
    );
  }

  return false;
};
