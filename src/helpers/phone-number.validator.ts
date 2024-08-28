import { registerDecorator, ValidationOptions } from "class-validator";

const phoneNumberRegex = /[-+0-9]{6,}/;

export function IsPhoneNumberString(property: string, validationOptions?: ValidationOptions) {
    return function (object: unknown, propertyName: string): void {
        if (!validationOptions?.message) {
            validationOptions = {
                ...validationOptions,
                message: `${propertyName} must be a valid phone number`,
            };
        }

        registerDecorator({
            name: "isPhoneNumberString",
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: unknown) {
                    return typeof value === "string" && phoneNumberRegex.test(value);
                },
            },
        });
    };
}
