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
} from "@nestjs/swagger";
import { DataTargetService } from "@services/data-target.service";
import { DataTarget } from "@entities/data-target.entity";
import { CreateDataTargetDto } from "@dto/create-data-target.dto";
import { UpdateDataTargetDto } from "@dto/update-data-target.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";

@ApiTags("DataTarget")
@Controller("dataTarget")
export class DataTargetController {
    constructor(private dataTargetService: DataTargetService) {}


    @Get(":id")
    @ApiOperation({ summary: "Find dataTargets by id" })
    @ApiNotFoundResponse()
    async find(@Param("id") id: string): Promise<DataTarget> {
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
        return createDataTargetDto;
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
