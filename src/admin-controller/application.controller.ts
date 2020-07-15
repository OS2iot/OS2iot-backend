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
import { CreateApplicationDto } from "@dto/create/create-application.dto";
import { ListAllApplicationsDto } from "@dto/list/list-all-applications.dto";
import { ListAllApplicationsReponseDto } from "@dto/list/list-all-applications-response.dto";
import { ApiResponse } from "@nestjs/swagger";
import { UpdateApplicationDto } from "@dto/update/update-application.dto";
import { DeleteResponseDto } from "@dto/delete/delete-application-response.dto";

@ApiTags("Application")
@Controller("application")
export class ApplicationController {
    constructor(private applicationService: ApplicationService) {}

   //TODO
   @Get()
   @ApiProduces("application/json")
   @ApiOperation({ summary: "Find all devices (paginated)" })
   @ApiResponse({
       status: 200,
       description: "Success",
       type: ListAllApplicationsReponseDto,
   })
   async findAll(
       @Query() query?: ListAllApplicationsDto
   ): Promise<ListAllApplicationsReponseDto> {
       const ioTDevice = this.applicationService.findAndCountWithPagination(
           query
       );
       return ioTDevice;
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
    async create(@Body() createApplicationDto: CreateApplicationDto): Promise<Application> {
        const application = this.applicationService.create(createApplicationDto);
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

            if(result.affected===0) {
                throw new  NotFoundException("MESSAGE.ID-DOES-NOT-EXIST");
                return;
            }
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new NotFoundException(err);
        }
    }
}
