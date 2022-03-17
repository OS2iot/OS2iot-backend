import { hasProps, nameof } from "./type-helper";

export interface LoRaWANPayload {
    rxInfo: LoRaWANSignalData[];
}

export interface LoRaWANSignalData {
    name: string;
    rssi: number;
    time: string;
    loRaSNR: number;
    location: {
        altitude: number;
        latitude: number;
        longitude: number;
    };
    uplinkID: string;
    gatewayID: string;
}

export interface SigfoxPayload {
    duplicates: SigfoxSignalData[];
}

/**
 * @see https://support.sigfox.com/docs/data-advanced
 */
export interface SigfoxSignalData {
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
            hasProps(unknownInfo[0], nameof<LoRaWANSignalData>("loRaSNR")) &&
            typeof unknownInfo[0].loRaSNR === "number"
        );
    }

    return false;
};

export const isValidSigfoxPayload = (payload: unknown): payload is SigfoxPayload => {
    return (
        payload &&
        typeof payload === "object" &&
        hasProps(payload, nameof<SigfoxPayload>("duplicates")) &&
        isValidSigfoxSignalData(payload.duplicates)
    );
};

export const isValidSigfoxSignalData = (rxInfo: unknown): rxInfo is SigfoxSignalData[] => {
    if (Array.isArray(rxInfo)) {
        // TS narrows it to any[]. Issue: https://github.com/microsoft/TypeScript/issues/17002
        const unknownInfo = rxInfo as unknown[];

        return (
            typeof unknownInfo[0] === "object" &&
            hasProps(unknownInfo[0], nameof<SigfoxSignalData>("rssi")) &&
            typeof unknownInfo[0].rssi === "number" &&
            hasProps(unknownInfo[0], nameof<SigfoxSignalData>("snr")) &&
            typeof unknownInfo[0].snr === "number"
        );
    }

    return false;
};
