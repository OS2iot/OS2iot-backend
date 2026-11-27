import { ErrorCodes } from "@enum/error-codes.enum";
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "isMetadataJsonObject", async: false })
export class IsMetadataJsonObjectConstraint implements ValidatorConstraintInterface {
  private message = "";

  public validate(value: any, args: ValidationArguments): boolean {
    const [propertyName] = args.constraints;
    this.message = `${propertyName} must be an object with non-empty string keys and values`;

    if (typeof value !== "object") {
      return false;
    }
    try {
      for (const key of Object.keys(value)) {
        if (typeof key !== "string" || key.trim() === "") {
          this.message = ErrorCodes.InvalidKeyInKeyValuePair;
          return false;
        }
        if (typeof value[key] !== "string" || value[key].trim() === "") {
          this.message = ErrorCodes.InvalidValueInKeyValuePair;
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

export function IsMetadataJsonObject(property: string, validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string): void {
    registerDecorator({
      name: "isMetadataJsonObject",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: IsMetadataJsonObjectConstraint,
    });
  };
}
