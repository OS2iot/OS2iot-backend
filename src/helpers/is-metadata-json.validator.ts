import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "notEmptyKey", async: false })
export class IsMetadataJsonConstraint implements ValidatorConstraintInterface {
    private message = "";

    public validate(value: string, args: ValidationArguments): boolean {
        const [propertyName] = args.constraints;
        this.message = `${propertyName} must be a valid list of metadata keys and values`;

        if (typeof value !== "string") {
            return false;
        }
        try {
            const json = JSON.parse(value) as Record<string, string>;

            for (const key of Object.keys(json)) {
                if (typeof key !== "string" || key.trim() === "") {
                    this.message = `The key whose value is "${json[key]}" must be a valid text value`;
                    return false;
                }
                if (typeof json[key] !== "string" || json[key].trim() === "") {
                    this.message = `The value whose key is "${key}" must be a valid text value`;
                    return false;
                }
            }
        } catch (error) {
            return false;
        }

        return true;
    }

    public defaultMessage(_args: ValidationArguments): string {
        return this.message;
    }
}

@ValidatorConstraint({ name: "notEmptyValue", async: false })
export class NotEmptyValue implements ValidatorConstraintInterface {
    public validate(value: string, args: ValidationArguments): boolean {
        const [relatedPropertyName] = args.constraints;
        const relatedValue = (args.object as Record<string, string>)[relatedPropertyName];

        if (typeof value !== "string") {
            return false;
        }
        try {
            const json = JSON.parse(value) as Record<string, string>;

            for (const key of Object.keys(json)) {
                if (typeof json[key] !== "string" || json[key].trim() === "") {
                    return false;
                }
            }
        } catch (error) {
            return false;
        }

        return true;
    }

    public defaultMessage(args: ValidationArguments): string {
        // Set the default error message here
        const [relatedPropertyName] = args.constraints;
        return `The value whose key is "${relatedPropertyName}" must be a valid text value`;
    }
}

export function IsMetadataJson(property: string, validationOptions?: ValidationOptions) {
    return function (object: unknown, propertyName: string): void {
        registerDecorator({
            name: "isMetadataJson",
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: IsMetadataJsonConstraint,
        });
    };
}
