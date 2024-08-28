import { registerDecorator, ValidationOptions } from "class-validator";
import { isJSON } from "validator";

export function IsJSONOrNull(property: string, validationOptions?: ValidationOptions) {
    return function (object: unknown, propertyName: string): void {
        if (!validationOptions?.message) {
            validationOptions = {
                ...validationOptions,
                message: `${propertyName} must be a valid JSON string`,
            };
        }

        registerDecorator({
            name: "IsJSONOrNull",
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: unknown) {
                    return !value || isJSON(value as string);
                },
            },
        });
    };
}
