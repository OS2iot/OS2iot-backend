export const SUBSCRIBER_FN_REF_MAP = new Map<string, Array<any>>();
export const SUBSCRIBER_FIXED_FN_REF_MAP = new Map<string, Array<any>>();
export const SUBSCRIBER_OBJ_REF_MAP = new Map<string, any>();

export const SUBSCRIBER_COMBINED_REF_MAP = new Map<string, Array<[any, any]>>();

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function CombinedSubscribeTo(topic: string, uniqueName: any) {
  return (
    target: { [x: string]: any },
    propertyKey: string | number,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    descriptor: any
  ): any => {
    const originalMethod = target[propertyKey];
    // Create this if it doesn't exist
    if (!SUBSCRIBER_COMBINED_REF_MAP.has(topic)) {
      SUBSCRIBER_COMBINED_REF_MAP.set(topic, []);
    }
    const existing = SUBSCRIBER_COMBINED_REF_MAP.get(topic);
    // Append the new subscriber to it
    SUBSCRIBER_COMBINED_REF_MAP.set(topic, existing.concat([[uniqueName, originalMethod]]));
    return descriptor;
  };
}
