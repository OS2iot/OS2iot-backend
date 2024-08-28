import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";
import { ErrorCodes } from "@enum/error-codes.enum";

/**
 *
 * @param property
 * @param validationOptions
 * @see https://github.com/typestack/class-validator/issues/592#issuecomment-621645012
 */
export function ArrayDistinct(property: string, validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string): void => {
    registerDecorator({
      name: "ArrayDistinct",
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (Array.isArray(value)) {
            const distinct = [...new Set(value.map((v): unknown => v[property]))];
            return distinct.length === value.length;
          }
          return false;
        },
        defaultMessage(args: ValidationArguments): string {
          return ErrorCodes.DuplicatePermissionTypes;
        },
      },
    });
  };
}
