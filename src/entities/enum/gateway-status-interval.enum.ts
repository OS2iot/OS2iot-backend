import { subtractDays } from "@helpers/date.helper";

export enum GatewayStatusInterval {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
}

export const gatewayStatusIntervalToDate = (interval: GatewayStatusInterval): Date => {
  const now = new Date();

  switch (interval) {
    case GatewayStatusInterval.WEEK:
      return subtractDays(now, 7);
    case GatewayStatusInterval.MONTH:
      return subtractDays(now, 30);
    default:
      return subtractDays(now, 1);
  }
};
