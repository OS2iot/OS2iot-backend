// eslint-disable-next-line @typescript-eslint/ban-types
type HasProp<T extends object, K extends PropertyKey> = T &
    { [P in K]: unknown };

/*
 * Type guard to ensure that an arbitrary object has a given properties
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const hasProps = <T extends object, K extends PropertyKey>(
    obj: T,
    ...props: K[]
): obj is HasProp<T, K> => {
    return props.every(prop => prop in obj);
};

export const nameof = <T>(name: Extract<keyof T, string>): typeof name => name;
