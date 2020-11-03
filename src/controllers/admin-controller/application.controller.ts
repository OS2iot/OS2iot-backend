import { BadRequestException } from "@nestjs/common";
import {
    Body,
    Controller,
    Delete,
    Get,
    Header,
    Logger,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiProduces,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ApiResponse } from "@nestjs/swagger";

import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read, Write } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { CreateApplicationDto } from "@dto/create-application.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ListAllApplicationsResponseDto } from "@dto/list-all-applications-response.dto";
import { ListAllApplicationsDto } from "@dto/list-all-applications.dto";
import { UpdateApplicationDto } from "@dto/update-application.dto";
import { Application } from "@entities/application.entity";
import { AuthenticatedRequest } from "@entities/dto/internal/authenticated-request";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
    checkIfUserHasReadAccessToApplication,
    checkIfUserHasReadAccessToOrganization,
    checkIfUserHasWriteAccessToApplication,
    checkIfUserHasWriteAccessToOrganization,
} from "@helpers/security-helper";
import { ApplicationService } from "@services/device-management/application.service";

@ApiTags("Application")
@Controller("application")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class ApplicationController {
    constructor(private applicationService: ApplicationService) {}

    @Read()
    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find all Applications (paginated)" })
    @ApiResponse({
        status: 200,
        description: "Success",
        type: ListAllApplicationsResponseDto,
    })
    async findAll(
        @Req() req: AuthenticatedRequest,
        @Query() query?: ListAllApplicationsDto
    ): Promise<ListAllApplicationsResponseDto> {
        if (req.user.permissions.isGlobalAdmin) {
            return this.applicationService.findAndCountWithPagination(
                query,
                query.organizationId ? [+query.organizationId] : null
            );
        }

        return await this.getApplicationsForNonGlobalAdmin(req, query);
    }

    private async getApplicationsForNonGlobalAdmin(
        req: AuthenticatedRequest,
        query: ListAllApplicationsDto
    ) {
        if (query?.organizationId) {
            checkIfUserHasReadAccessToOrganization(req, query.organizationId);
            return await this.getApplicationsInOrganization(req, query);
        }

        const allFromOrg = req.user.permissions.getAllOrganizationsWithAtLeastAdmin();
        const allowedApplications = req.user.permissions.getAllApplicationsWithAtLeastRead();
        const applications = await this.applicationService.findAndCountApplicationInWhitelistOrOrganization(
            query,
            allowedApplications,
            query.organizationId ? [query.organizationId] : allFromOrg
        );
        return applications;
    }

    private async getApplicationsInOrganization(
        req: AuthenticatedRequest,
        query: ListAllApplicationsDto
    ) {
        // If org admin give all
        const allFromOrg = req.user.permissions.getAllOrganizationsWithAtLeastAdmin();
        if (this.isOrganizationAdmin(allFromOrg, query)) {
            return await this.applicationService.findAndCountWithPagination(query, [
                query.organizationId,
            ]);
        }

        // If not org admin only allowed ones
        const allowedApplications = req.user.permissions.getAllApplicationsWithAtLeastRead();
        return await this.applicationService.findAndCountInList(
            query,
            allowedApplications,
            [query.organizationId]
        );
    }

    private isOrganizationAdmin(allFromOrg: number[], query: ListAllApplicationsDto) {
        return allFromOrg.some(x => x === query?.organizationId);
    }

    @Read()
    @Get(":id")
    @ApiOperation({ summary: "Find one Application by id" })
    @ApiNotFoundResponse()
    async findOne(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<Application> {
        checkIfUserHasReadAccessToApplication(req, id);

        try {
            return await this.applicationService.findOne(id);
        } catch (err) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }

    @Write()
    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new Application" })
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createApplicationDto: CreateApplicationDto
    ): Promise<Application> {
        checkIfUserHasWriteAccessToOrganization(
            req,
            createApplicationDto?.organizationId
        );

        const isValid = await this.applicationService.isNameValidAndNotUsed(
            createApplicationDto?.name
        );

        if (!isValid) {
            Logger.error(
                `Tried to create an application with name: '${createApplicationDto.name}'`
            );
            throw new BadRequestException(ErrorCodes.NameInvalidOrAlreadyInUse);
        }

        const application = this.applicationService.create(createApplicationDto);
        return application;
    }

    @Write()
    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing Application" })
    @ApiBadRequestResponse()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() updateApplicationDto: UpdateApplicationDto
    ): Promise<Application> {
        checkIfUserHasWriteAccessToApplication(req, id);
        if (
            !(await this.applicationService.isNameValidAndNotUsed(
                updateApplicationDto?.name,
                id
            ))
        ) {
            Logger.error(
                `Tried to change an application with name: '${updateApplicationDto.name}'`
            );
            throw new BadRequestException(ErrorCodes.NameInvalidOrAlreadyInUse);
        }

        const application = await this.applicationService.update(
            id,
            updateApplicationDto
        );

        return application;
    }

    @Write()
    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing Application" })
    @ApiBadRequestResponse()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        checkIfUserHasWriteAccessToApplication(req, id);

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
