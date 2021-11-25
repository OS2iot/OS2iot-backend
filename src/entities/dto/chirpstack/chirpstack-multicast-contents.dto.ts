import { multicastGroup } from "@enum/multicast-type.enum";
import { ApiProperty } from "@nestjs/swagger";
import { Matches } from "class-validator";

export class ChirpstackMulticastContentsDto {
    @ApiProperty({ required: true })
    applicationID: string;
    @ApiProperty({ required: true })
    dr: number;
    @ApiProperty({ required: true })
    fCnt: number;
    @ApiProperty({ required: true })
    frequency: number;
    @ApiProperty({ required: true })
    groupType: multicastGroup;
    @ApiProperty({ required: true })
    @Matches(/[0-9A-Fa-f]{16}/)
    id: string;
    @ApiProperty({ required: true })
    mcAddr: string;
    @ApiProperty({ required: true })
    mcAppSKey: string;
    @ApiProperty({ required: true })
    mcNwkSKey: string;
    @ApiProperty({ required: true })
    name: string;
    @ApiProperty({ required: false })
    pingSlotPeriod: number;
   
}
