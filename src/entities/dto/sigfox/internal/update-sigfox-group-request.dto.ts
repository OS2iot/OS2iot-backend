import { OmitType } from "@nestjs/swagger";

import { CreateSigFoxGroupRequestDto } from "./create-sigfox-group-request.dto";

export class UpdateSigFoxGroupRequestDto extends OmitType(CreateSigFoxGroupRequestDto, [
    "organizationId",
]) {}
