import { ApiKey } from "@entities/api-key.entity";
import { OmitType } from "@nestjs/swagger";

export class ApiKeyResponseDto extends OmitType(ApiKey, ["key"] as const) {}
