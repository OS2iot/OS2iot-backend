import { ApiProperty } from "@nestjs/swagger";
import { SearchResultDto } from "./search-result.dto";

export class ListAllSearchResultsResponseDto {
    @ApiProperty()
    data: SearchResultDto[];
    @ApiProperty()
    count: number;
}
