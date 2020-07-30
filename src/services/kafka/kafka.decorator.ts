export const SUBSCRIBER_FN_REF_MAP = new Map<string, Array<any>>();
export const SUBSCRIBER_FIXED_FN_REF_MAP = new Map<string, Array<any>>();
export const SUBSCRIBER_OBJ_REF_MAP = new Map<string, any>();

export function SubscribeTo(topic: string) {
    return (
        target: { [x: string]: any },
        propertyKey: string | number,
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        descriptor: any
    ): any => {
        const originalMethod = target[propertyKey];
        addFunctionToMap(topic, originalMethod, SUBSCRIBER_FN_REF_MAP);
        return descriptor;
    };
}

export function SubscribeToFixedGroup(topic: string) {
    return (
        target: { [x: string]: any },
        propertyKey: string | number,
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        descriptor: any
    ): any => {
        const originalMethod = target[propertyKey];
        addFunctionToMap(topic, originalMethod, SUBSCRIBER_FIXED_FN_REF_MAP);
        return descriptor;
    };
}

function addFunctionToMap(
    topic: string,
    originalMethod: any,
    map: Map<string, Array<any>>
): void {
    // Create this if it doesn't exist
    if (!map.has(topic)) {
        map.set(topic, []);
    }
    // Append the new subscriber to it
    map.set(topic, map.get(topic).concat([originalMethod]));
}
