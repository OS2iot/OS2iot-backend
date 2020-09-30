export enum SigFoxDownlinkMode {
    DIRECT = 0,
    CALLBACK = 1,
    NONE = 2,
    MANAGED = 3,
}

export enum SigFoxPayloadType {
    RegularRawPayload = 2,
    CustomGrammar = 3,
    Geolocation = 4,
    DisplayInASCII = 5,
    RadioPlanningFrame = 6,
    Sensitv2 = 9,
}
