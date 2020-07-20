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
import { Application } from "@entities/applikation.entity";
import { ApplicationService } from "@services/application.service";
import { CreateApplicationDto } from "@dto/create-application.dto";
import { ListAllEntities } from "@dto/list-all-entities.dto";
import { ListAllApplicationsReponseDto } from "@dto/list-all-applications-response.dto";
import { ApiResponse } from "@nestjs/swagger";
import { UpdateApplicationDto } from "@dto/update-application.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";

@ApiTags("Application")
@Controller("application")
export class ApplicationController {
    constructor(private applicationService: ApplicationService) {}

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find all Applications (paginated)" })
    @ApiResponse({
        status: 200,
        description: "Success",
        type: ListAllApplicationsReponseDto,
    })
    async findAll(
        @Query() query?: ListAllEntities
    ): Promise<ListAllApplicationsReponseDto> {
        const applications = this.applicationService.findAndCountWithPagination(
            query
        );
        return applications;
    }

    @Get(":id")
    @ApiOperation({ summary: "Find one Application by id" })
    @ApiNotFoundResponse()
    async findOne(@Param("id") id: number): Promise<Application> {
        try {
            return await this.applicationService.findOne(id);
        } catch (err) {
            throw new NotFoundException(`No element found by id: ${id}`);
        }
    }

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new Application" })
    @ApiBadRequestResponse()
    async create(
        @Body() createApplicationDto: CreateApplicationDto
    ): Promise<Application> {
        const application = this.applicationService.create(
            createApplicationDto
        );
        return application;
    }

    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing Application" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: number,
        @Body() updateApplicationDto: UpdateApplicationDto
    ): Promise<Application> {
        const application = await this.applicationService.update(
            id,
            updateApplicationDto
        );

        return application;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing Application" })
    @ApiBadRequestResponse()
    async delete(@Param("id") id: number): Promise<DeleteResponseDto> {
        try {
            const result = await this.applicationService.delete(id);

            if (result.affected === 0) {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new NotFoundException(err);
        }
    }
}
