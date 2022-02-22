import { IsSwaggerOptional } from "@helpers/optional-validator";

export class ListAllPaginated {
    @IsSwaggerOptional({ type: Number })
    limit? = 100;
    @IsSwaggerOptional({ type: Number })
    offset? = 0;
}
