import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "isMetadataJson", async: false })
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
