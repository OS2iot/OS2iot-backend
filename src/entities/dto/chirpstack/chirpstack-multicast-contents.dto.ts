import { multicastGroup } from "@enum/multicast-type.enum";
import { ApiProperty } from "@nestjs/swagger";

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
    mcAddr: string;

    @ApiProperty({ required: true })
    mcAppSKey: string;

    @ApiProperty({ required: true })
    mcNwkSKey: string;

    @ApiProperty({ required: true })
    name: string;

    @ApiProperty({ required: true })
    id: string;
}
