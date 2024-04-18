export function isNullOrWhitespace(str: string) {
    // Using == for nullish check for both null and undefined
    return str == null || str.trim() === "";
}
