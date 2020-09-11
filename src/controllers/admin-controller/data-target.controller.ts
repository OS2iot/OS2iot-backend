import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Header,
    Delete,
    NotFoundException,
    Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBadRequestResponse } from "@nestjs/swagger";
import { ListAllDataTargetsReponseDto } from "@dto/list-all-data-targets-response.dto";
import { CreateDataTargetDto } from "@dto/create-data-target.dto";
import { DataTarget } from "@entities/data-target.entity";
import { UpdateDataTargetDto } from "@dto/update-data-target.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { DataTargetService } from "@services/data-target.service";
import { ListAllDataTargetsDto } from "@dto/list-all-data-targets.dto";

@ApiTags("Data Target")
@Controller("data-target")
export class DataTargetController {
    constructor(private dataTargetService: DataTargetService) {}

    @Get()
    @ApiOperation({ summary: "Find all DataTargets" })
    async findAll(
        @Query() query?: ListAllDataTargetsDto
    ): Promise<ListAllDataTargetsReponseDto> {
        return await this.dataTargetService.findAndCountAllWithPagination(
            query
        );
    }

    @Get(":id")
    @ApiOperation({ summary: "Find DataTarget by id" })
    async findOne(@Param("id") id: number): Promise<DataTarget> {
        try {
            return await this.dataTargetService.findOne(id);
        } catch (err) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }

    @Post()
    @ApiOperation({ summary: "Create a new DataTargets" })
    @ApiBadRequestResponse()
    async create(
        @Body() createDataTargetDto: CreateDataTargetDto
    ): Promise<DataTarget> {
        return await this.dataTargetService.create(createDataTargetDto);
    }

    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing DataTarget" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: number,
        @Body() updateDto: UpdateDataTargetDto
    ): Promise<DataTarget> {
        const application = await this.dataTargetService.update(id, updateDto);

        return application;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing IoT-Device" })
    @ApiBadRequestResponse()
    async delete(@Param("id") id: number): Promise<DeleteResponseDto> {
        try {
            const result = await this.dataTargetService.delete(id);

            if (result.affected === 0) {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new NotFoundException(err);
        }
    }
}
