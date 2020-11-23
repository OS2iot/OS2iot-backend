import { registerDecorator, ValidationOptions } from "class-validator";

export function IsNotBlank(property: string, validationOptions?: ValidationOptions) {
    return function (object: unknown, propertyName: string): void {
        registerDecorator({
            name: "isNotBlank",
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any) {
                    return typeof value === "string" && value.trim().length > 0;
                },
            },
        });
    };
}
