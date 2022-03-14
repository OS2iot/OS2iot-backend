import { ApiProperty } from "@nestjs/swagger";

export class RejectUserDto {
    @ApiProperty({ required: true })
    orgId: number;
}
