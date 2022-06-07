import { Transform, Type } from "class-transformer";
import { isNumber, registerDecorator, ValidationOptions } from "class-validator";

/**
 * Checks if a value can be converted to a number
 */
export function StringToNumber(
    validationOptions?: ValidationOptions & {
        allowNulls: boolean;
    }
) {
    return function (object: unknown, propertyName: string): void {
        registerDecorator({
            name: "stringToNumber",
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: validationOptions,
            validator: {
                validate(value: unknown) {
                    if (
                        validationOptions?.allowNulls &&
                        (value === null || value === "null")
                    ) {
                        // Force value to null. This mutates the value which exists only inside class-transformer.
                        Transform(() => null)(object, propertyName);
                        return true;
                    }

                    // Cast the value to a number, mutating it for the next operations, and validate it
                    Type(() => Number)(object, propertyName);
                    return isNumber(Number(value));
                },
            },
        });
    };
}
