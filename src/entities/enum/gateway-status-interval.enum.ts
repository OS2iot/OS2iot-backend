export enum GatewayStatusInterval {
    DAY = "DAY",
    WEEK = "WEEK",
    MONTH = "MONTH",
}

export const gatewayStatusIntervalToDate = (interval: GatewayStatusInterval): Date => {
    const now = new Date();

    switch (interval) {
        case GatewayStatusInterval.WEEK:
            break;
        case GatewayStatusInterval.MONTH:
            break;
        default:
            return ;
    }
};
