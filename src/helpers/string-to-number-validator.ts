import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

/**
 * Checks if a value can be converted to a number
 */
export const StringToNumber = (): PropertyDecorator => {
    return (target: unknown, propertyName: string): void => {
        Type(() => Number)(target, propertyName);
        IsNumber()(target, propertyName);
    };
};
