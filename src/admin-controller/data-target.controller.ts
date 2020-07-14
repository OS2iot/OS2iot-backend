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
    ApiResponse
} from "@nestjs/swagger";
import { DataTargetService } from "@services/data-target.service";
import { DataTarget } from "@entities/data-target.entity";
import { CreateDataTargetDto } from "@dto/create/create-data-target.dto";
import { UpdateDataTargetDto } from "@dto/update/update-data-target.dto";
import { DeleteResponseDto } from "@dto/delete/delete-application-response.dto";
import {ListAllDatatargetsDto} from "@dto/list/list-all-data-targets.dto"
import { ListAllEntities } from "@dto/list/list-all-entities.dto";
@ApiTags("DataTarget")
@Controller("dataTarget")
export class DataTargetController {
    constructor(private dataTargetService: DataTargetService) {}


    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find all Datatargets (paginated)" })
    @ApiResponse({
        status: 200,
        description: "Success",
        type: ListAllDatatargetsDto,
    })
    async findAll(
        @Query() query?: ListAllEntities
    ): Promise<ListAllDatatargetsDto> {
        const dataTarget = this.dataTargetService.findAndCountWithPagination(
            query
        );
        return dataTarget;
    }

    @Get(":id")
    @ApiOperation({ summary: "Find one Application by id" })
    @ApiNotFoundResponse()
    async findOne(@Param("id") id: number): Promise<DataTarget> {
        try {
            return await this.dataTargetService.findOne(id);
        } catch (err) {
            throw new NotFoundException(`No element found by id: ${id}`);
        }
    }

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new DataTarget" })
    @ApiBadRequestResponse()
    async create(@Body() createDataTargetDto: CreateDataTargetDto): Promise<DataTarget> {
        const dataTarget = this.dataTargetService.create( createDataTargetDto );
        return dataTarget;
    }

    
    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing DataTarget" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: string,
        @Body() updateDataTargetDto: UpdateDataTargetDto
    ): Promise<DataTarget> {
        const dataTarget = await this.dataTargetService.update(
            id,
            updateDataTargetDto
        );

        return dataTarget;
    }
    
    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing DataTarget" })
    @ApiBadRequestResponse()
    async delete(@Param("id") id: string): Promise<DeleteResponseDto> {
        try {
            const result = await this.dataTargetService.delete(id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new BadRequestException(err);
        }
    }
    
}
