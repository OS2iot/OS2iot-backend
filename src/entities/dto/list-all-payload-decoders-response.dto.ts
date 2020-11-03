import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-response.dto";
import { PayloadDecoder } from "@entities/payload-decoder.entity";

export class ListAllPayloadDecoderResponseDto extends ListAllEntitiesResponseDto<
    PayloadDecoder
> {}
