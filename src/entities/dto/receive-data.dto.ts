import { Exclude } from "class-transformer";
import { IsOptional } from "class-validator";

/**
 * This only exists to nudge Swagger to make an JSON body for us to post.
 *
 * Validation won't work for empty objects and we can't disable it, seemingly.
 *
 * @see https://github.com/typestack/class-validator/issues/1503
 */
export class ReceiveDataDto {
  @Exclude()
  @IsOptional()
  ignoreMe: unknown;
}
