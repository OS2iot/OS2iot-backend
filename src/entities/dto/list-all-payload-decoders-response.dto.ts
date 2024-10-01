import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-response.dto";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { PickType } from "@nestjs/swagger";

export class ListAllPayloadDecoderResponseDto extends ListAllEntitiesResponseDto<PayloadDecoder> {}

export class ListAllMinimalPayloadDecoderResponseDto extends ListAllEntitiesResponseDto<MinimalPayloadDecoder> {}

export class MinimalPayloadDecoder extends PickType(PayloadDecoder, ["id", "name"]) {}
