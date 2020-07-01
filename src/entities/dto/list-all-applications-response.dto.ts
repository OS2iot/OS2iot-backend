import { ApiProperty } from "@nestjs/swagger";
import { Application } from "@entities/applikation.entity";

export class ListAllApplicationsReponseDto {
    @ApiProperty({ type: () => [Application] })
    data: Application[];
    @ApiProperty()
    count: number;
}
