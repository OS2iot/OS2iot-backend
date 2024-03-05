import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllSearchResultsResponseDto } from "@dto/list-all-search-results-response.dto";
import { SearchResultType } from "@dto/search-result.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { BadRequestException, Controller, Get, Logger, ParseIntPipe, Query, Req, UseGuards } from "@nestjs/common";
import { ApiForbiddenResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { SearchService } from "@services/data-management/search.service";
import { isNumber } from "lodash";
import { ApiAuth } from "@auth/swagger-auth-decorator";

@Controller("search")
@ApiTags("Search")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class SearchController {
    constructor(private service: SearchService) {}

    private readonly logger = new Logger(SearchController.name);

    @Get()
    @ApiOperation({
        summary:
            "Search for " +
            Object.values(SearchResultType)
                .filter(x => !isNumber(x))
                .join(", "),
    })
    async search(
        @Req() req: AuthenticatedRequest,
        @Query("q") query?: string,
        @Query("limit", new ParseIntPipe()) limit?: number,
        @Query("offset", new ParseIntPipe()) offset?: number
    ): Promise<ListAllSearchResultsResponseDto> {
        if (query == null || query.trim() === "") {
            throw new BadRequestException(ErrorCodes.QueryMustNotBeEmpty);
        }
        return await this.service.findByQuery(req, query, limit, offset);
    }
}
