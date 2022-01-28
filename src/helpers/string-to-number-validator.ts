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
