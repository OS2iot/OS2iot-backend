import { registerDecorator, ValidationOptions } from "class-validator";

/**
 * Sets a property as optional on the swagger and controller level
 */
export const HasSameApplicationId = (
    property: string,
    validationOptions: Partial<ValidationOptions> & {
        applicationIdName: string;
    }
): PropertyDecorator => {
    return (propertyValue: unknown, propertyName: string): void => {
        registerDecorator({
            name: "hasSameApplicationId",
            target: propertyValue.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: unknown): boolean {
                    if (Array.isArray(value) && value.length) {
                        const first = value[0][validationOptions.applicationIdName];

                        return value.every(
                            val => val[validationOptions.applicationIdName] === first
                        );
                    }

                    return false;
                },
            },
        });
    };
};
