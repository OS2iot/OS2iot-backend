import {
    Controller,
    Get,
    Post,
    Header,
    Body,
    Query,
    Put,
    Param,
    NotFoundException,
    Delete,
    BadRequestException,
} from "@nestjs/common";
import {
    ApiProduces,
    ApiTags,
    ApiOperation,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiResponse,
} from "@nestjs/swagger";
import { HttpPushTargetService } from "@services/http-push-target.service";
import { HttpPushTarget } from "@entities/http-push-target.entity";
import { CreateHttpPushTargetDto } from "@dto/create/create-http-push-target.dto";
import { UpdateHttpPushTargetDto } from "@dto/update/update-http-push-target.dto";
import { DeleteResponseDto } from "@dto/delete/delete-application-response.dto";
import { ListAllHttpPushTargetResponseDto } from "@dto/list/list-all-http-push-target-response.dto";
import { ListAllEntities } from "@dto/list/list-all-entities.dto";

@ApiTags("HttpPushTarget")
@Controller("httpPushTarget")
export class HttpPushTargetController {
    constructor(private httpPushTargetService: HttpPushTargetService) {}
    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find all HttpPushTarget (paginated)" })
    @ApiResponse({
        status: 200,
        description: "Success",
        type: ListAllHttpPushTargetResponseDto,
    })
    async findAll(
        @Query() query?: ListAllEntities
    ): Promise<ListAllHttpPushTargetResponseDto> {
        const applications = this.httpPushTargetService.findAndCountWithPagination(
            query
        );
        return applications;
    }

    @Get(":id")
    @ApiOperation({ summary: "Find one HttpPushTarget by id" })
    @ApiNotFoundResponse()
    async findOne(@Param("id") id: number): Promise<HttpPushTarget> {
        try {
            return await this.httpPushTargetService.findOne(id);
        } catch (err) {
            throw new NotFoundException(`No element found by id: ${id}`);
        }
    }

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new HttpPushTarget" })
    @ApiBadRequestResponse()
    async create(@Body() createHttpPushTargetDto: CreateHttpPushTargetDto): Promise<HttpPushTarget> {
        const httpPushTarget = this.httpPushTargetService.create( createHttpPushTargetDto );
        return httpPushTarget;
    }

    
    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing HttpPushTarget" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: string,
        @Body() updateHttpPushTargetDto: UpdateHttpPushTargetDto
    ): Promise<HttpPushTarget> {
        const httpPushTarget = await this.httpPushTargetService.update(
            id,
            updateHttpPushTargetDto
        );

        return httpPushTarget;
    }
    
    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing HttpPushTarget" })
    @ApiBadRequestResponse()
    async delete(@Param("id") id: string): Promise<DeleteResponseDto> {
        try {
            const result = await this.httpPushTargetService.delete(id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new BadRequestException(err);
        }
    }
    
}
