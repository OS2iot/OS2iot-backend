import { StringToNumber } from "@helpers/string-to-number-validator";

export class SigFoxGetAllRequestDto {
    @StringToNumber()
    organizationId: number;
}
