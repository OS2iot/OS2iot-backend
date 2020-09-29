import { ApiProperty } from "@nestjs/swagger";

export class CreateSigFoxGroupRequestDto {
    @ApiProperty({ required: true })
    organizationId: number;

    @ApiProperty({ required: true })
    username: string;

    @ApiProperty({ required: true })
    password: string;
}
