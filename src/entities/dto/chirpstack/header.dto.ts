import { ApiProperty } from "@nestjs/swagger";
export class HeaderDto {
    @ApiProperty({ required: true })
    url: string;

    @ApiProperty({ required: true })
    timeout: number;

    @ApiProperty({ required: true })
    authorizationType: string;

    @ApiProperty({ required: true })
    authorizationHeader: string;
}
