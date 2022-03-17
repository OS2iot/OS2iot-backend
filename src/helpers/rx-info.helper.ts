import { nameof } from "./type-helper";

export interface LoRaWANRxInfo {
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

/**
 * @see https://support.sigfox.com/docs/data-advanced
 */
export interface SigfoxRxInfo {
    rssi: number;
    snr: number;
}

export const isValidLoRaWANRxInfo = (rxInfo: unknown): rxInfo is LoRaWANRxInfo[] => {
    return (
        Array.isArray(rxInfo) &&
        nameof<LoRaWANRxInfo>("rssi") in rxInfo[0] &&
        typeof rxInfo[0][nameof<LoRaWANRxInfo>("rssi")] === "number" &&
        nameof<LoRaWANRxInfo>("loRaSNR") in rxInfo[0] &&
        typeof rxInfo[0][nameof<LoRaWANRxInfo>("loRaSNR")] === "number"
    );
};

export const isValidSigfoxRxInfo = (rxInfo: unknown): rxInfo is SigfoxRxInfo[] => {
    return (
        Array.isArray(rxInfo) &&
        nameof<SigfoxRxInfo>("rssi") in rxInfo[0] &&
        typeof rxInfo[0][nameof<SigfoxRxInfo>("rssi")] === "number" &&
        nameof<SigfoxRxInfo>("snr") in rxInfo[0] &&
        typeof rxInfo[0][nameof<SigfoxRxInfo>("snr")] === "number"
    );
};
