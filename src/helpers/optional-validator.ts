import { ApiPropertyOptional, ApiPropertyOptions } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

/**
 * Sets a property as optional on the swagger and controller level
 */
export const IsSwaggerOptional = (swaggerOptions?: ApiPropertyOptions): PropertyDecorator => {
  return (propertyValue: unknown, propertyName: string): void => {
    // Set as optional in the swagger document
    ApiPropertyOptional(swaggerOptions)(propertyValue, propertyName);
    // If no value is passed, then ignore all validators
    IsOptional()(propertyValue, propertyName);
  };
};
