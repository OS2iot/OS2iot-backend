import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

/**
 * Checks if a value can be converted to a number
 */
export const StringToNumber = (): PropertyDecorator => {
    return (propertyValue: unknown, propertyName: string): void => {
        // Cast the value to a number
        Type(() => Number)(propertyValue, propertyName);
        // Validate whether the value is a number
        IsNumber()(propertyValue, propertyName);
    };
};

/**
 * Fixes unexpected behaviour when casting using @Type() decorator. When casting a query parameter using
 * Type() or Transform() from class-transformer, all parameters with the same decorator are casted.
 * That's unexpected behaviour.
 * @param value
 */
export const NullableStringToNumber = (value: unknown): number | null => {
    if (value === null || value === "null") {
        return null;
    }

    return Number(value);
};
