import { Type } from "class-transformer";
import { IsDate, IsDateString } from "class-validator";

/**
 * Checks if a value can be converted to a date
 */
export const ValidateDate = (): PropertyDecorator => {
    return (propertyValue: unknown, propertyName: string): void => {
        // Validate whether the value is a valid ISO8601 date
        IsDateString(propertyValue);
        // Cast the value
        Type(() => Date)(propertyValue, propertyName);
    };
};
