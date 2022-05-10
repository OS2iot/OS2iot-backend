export interface StatusTimestamp {
    timestamp: Date;
    wasOnline: boolean;
}

export interface GatewayStatus {
    id: string;
    name: string;
    statusTimestamps: StatusTimestamp[];
}
