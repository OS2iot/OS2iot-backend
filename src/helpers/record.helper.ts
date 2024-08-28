type KeyValue<T extends Record<string, unknown>> = {
    key: keyof T;
    value: T[keyof T];
};

export const recordToEntries = <T extends Record<string, unknown>>(record: T): KeyValue<T>[] => {
    return Object.keys(record)
        .filter(entry => isNaN(Number(entry)))
        .map((key: keyof typeof record) => ({
            key,
            value: record[key],
        }));
};

export const findValuesInRecord = <T extends Record<string, string>>(record: T, values: string[]): string[] => {
    return recordToEntries(record).reduce((res: typeof values, { value }) => {
        if (values.includes(value)) {
            res.push(value);
        }
        return res;
    }, []);
};
