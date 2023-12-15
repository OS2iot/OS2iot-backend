import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

export const subtractHours = (date: Date, hours = 1): Date => {
    const newDate = new Date();
    newDate.setTime(date.getTime() - 1000 * (60 * 60 * hours));
    return newDate;
};

export const subtractDays = (date: Date, days = 1): Date => {
    const newDate = new Date();
    newDate.setDate(date.getDate() - days);
    return newDate;
};

export const subtractYears = (date: Date, years = 1): Date => {
    const newDate = new Date();
    newDate.setDate(date.getDate() - years * 365);
    return newDate;
};

export const dateToTimestamp = (date: Date): Timestamp => {
    const timestamp = new Timestamp();
    timestamp.fromDate(date);
    return timestamp;
};

export const timestampToDate = (timestamp: Timestamp.AsObject): Date => {
    const seconds = timestamp.seconds;
    const nanoseconds = timestamp.nanos / 1e6; // Convert nanoseconds to milliseconds
    const milliseconds = seconds * 1000 + nanoseconds;
    return new Date(milliseconds);
};
