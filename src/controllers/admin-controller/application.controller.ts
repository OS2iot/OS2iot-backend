import {
  BadRequestException,
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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { ApplicationAdmin, Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { ApiAuth } from "@auth/swagger-auth-decorator";
import { CreateApplicationDto } from "@dto/create-application.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ListAllApplicationsResponseDto } from "@dto/list-all-applications-response.dto";
import { ListAllApplicationsDto } from "@dto/list-all-applications.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ListAllIoTDevicesResponseDto } from "@dto/list-all-iot-devices-response.dto";
import { IoTDevicesListToMapResponseDto } from "@dto/list-all-iot-devices-to-map-response.dto";
import { UpdateApplicationOrganizationDto } from "@dto/update-application-organization.dto";
import { UpdateApplicationDto } from "@dto/update-application.dto";
import { Application } from "@entities/application.entity";
import { ActionType } from "@entities/audit-log-entry";
import { AuthenticatedRequest } from "@entities/dto/internal/authenticated-request";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
  ApplicationAccessScope,
  checkIfUserHasAccessToApplication,
  checkIfUserHasAccessToOrganization,
  OrganizationAccessScope,
} from "@helpers/security-helper";
import { AuditLog } from "@services/audit-log.service";
import { ApplicationService } from "@services/device-management/application.service";

@ApiTags("Application")
@Controller("application")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  private readonly logger = new Logger(ApplicationController.name);

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

  @Read()
  @Get(":id")
  @ApiOperation({ summary: "Find one Application by id" })
  @ApiNotFoundResponse()
  async findOne(@Req() req: AuthenticatedRequest, @Param("id", new ParseIntPipe()) id: number): Promise<Application> {
    checkIfUserHasAccessToApplication(req, id, ApplicationAccessScope.Read);

    try {
      return await this.applicationService.findOne(id);
    } catch (err) {
      throw new NotFoundException(ErrorCodes.IdDoesNotExists);
    }
  }

  @Read()
  @Get(":id/iot-devices")
  @ApiOperation({ summary: "Find the IoTDevice of an Application" })
  @ApiNotFoundResponse()
  async findIoTDevicesForApplication(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) applicationId: number,
    @Query() query?: ListAllEntitiesDto
  ): Promise<ListAllIoTDevicesResponseDto> {
    checkIfUserHasAccessToApplication(req, applicationId, ApplicationAccessScope.Read);

    try {
      return await this.applicationService.findDevicesForApplication(applicationId, query);
    } catch (err) {
      throw new NotFoundException(ErrorCodes.IdDoesNotExists);
    }
  }

  @Read()
  @Get(":id/iot-devices-map")
  @ApiOperation({ summary: "Find the IoTDevices of an Application" })
  @ApiNotFoundResponse()
  async findIoTDevicesForApplicationMap(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) applicationId: number
  ): Promise<IoTDevicesListToMapResponseDto[]> {
    checkIfUserHasAccessToApplication(req, applicationId, ApplicationAccessScope.Read);

    try {
      return await this.applicationService.findDevicesForApplicationMap(applicationId);
    } catch (err) {
      throw new NotFoundException(ErrorCodes.IdDoesNotExists);
    }
  }

  @ApplicationAdmin()
  @Post()
  @Header("Cache-Control", "none")
  @ApiOperation({ summary: "Create a new Application" })
  @ApiBadRequestResponse()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createApplicationDto: CreateApplicationDto
  ): Promise<Application> {
    checkIfUserHasAccessToOrganization(
      req,
      createApplicationDto?.organizationId,
      OrganizationAccessScope.ApplicationWrite
    );

    const isValid = await this.applicationService.isNameValidAndNotUsed(createApplicationDto?.name);

    if (!isValid) {
      this.logger.error(`Tried to create an application with name: '${createApplicationDto.name}'`);
      AuditLog.fail(ActionType.CREATE, Application.name, req.user.userId);
      throw new BadRequestException(ErrorCodes.NameInvalidOrAlreadyInUse);
    }

    const application = await this.applicationService.create(createApplicationDto, req.user.userId);
    AuditLog.success(ActionType.CREATE, Application.name, req.user.userId, application.id, application.name);
    return application;
  }

  @ApplicationAdmin()
  @Put(":id")
  @Header("Cache-Control", "none")
  @ApiOperation({ summary: "Update an existing Application" })
  @ApiBadRequestResponse()
  async update(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateApplicationDto: UpdateApplicationDto
  ): Promise<Application> {
    checkIfUserHasAccessToApplication(req, id, ApplicationAccessScope.Write);
    if (!(await this.applicationService.isNameValidAndNotUsed(updateApplicationDto?.name, id))) {
      this.logger.error(`Tried to change an application with name: '${updateApplicationDto.name}'`);
      AuditLog.fail(ActionType.UPDATE, Application.name, req.user.userId);
      throw new BadRequestException(ErrorCodes.NameInvalidOrAlreadyInUse);
    }

    const application = await this.applicationService.update(id, updateApplicationDto, req.user.userId);

    AuditLog.success(ActionType.UPDATE, Application.name, req.user.userId, application.id, application.name);
    return application;
  }

  @ApplicationAdmin()
  @Put("updateApplicationOrganization/:id")
  @Header("Cache-Control", "none")
  @ApiOperation({ summary: "Update application organization" })
  @ApiBadRequestResponse()
  async changeOrganization(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateApplicationDto: UpdateApplicationOrganizationDto
  ): Promise<Application> {
    checkIfUserHasAccessToApplication(req, id, ApplicationAccessScope.Write);
    try {
      const application = await this.applicationService.changeOrganization(id, updateApplicationDto, req.user.userId);

      AuditLog.success(ActionType.UPDATE, Application.name, req.user.userId, application.id, application.name);
      return application;
    } catch (error) {
      AuditLog.fail(ActionType.UPDATE, Application.name, req.user.userId);

      throw error;
    }
  }

  @ApplicationAdmin()
  @Delete(":id")
  @ApiOperation({ summary: "Delete an existing Application" })
  @ApiBadRequestResponse()
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DeleteResponseDto> {
    checkIfUserHasAccessToApplication(req, id, ApplicationAccessScope.Write);

    try {
      const result = await this.applicationService.delete(id);

      if (result.affected === 0) {
        throw new NotFoundException(ErrorCodes.IdDoesNotExists);
      }
      AuditLog.success(ActionType.DELETE, Application.name, req.user.userId, id);
      return new DeleteResponseDto(result.affected);
    } catch (err) {
      AuditLog.fail(ActionType.DELETE, Application.name, req.user.userId, id);
      if (err.message == ErrorCodes.DeleteNotAllowedHasSigfoxDevice) {
        throw err;
      }
      throw new NotFoundException(err);
    }
  }

  private async getApplicationsForNonGlobalAdmin(req: AuthenticatedRequest, query: ListAllApplicationsDto) {
    if (query?.organizationId) {
      checkIfUserHasAccessToOrganization(req, query.organizationId, OrganizationAccessScope.ApplicationRead);
      return await this.getApplicationsInOrganization(req, query);
    }

    const allFromOrg = req.user.permissions.getAllOrganizationsWithApplicationAdmin();
    const allowedApplications = req.user.permissions.getAllApplicationsWithAtLeastRead();
    const applications = await this.applicationService.findAndCountApplicationInWhitelistOrOrganization(
      query,
      allowedApplications,
      query.organizationId ? [query.organizationId] : allFromOrg
    );
    return applications;
  }

  private async getApplicationsInOrganization(req: AuthenticatedRequest, query: ListAllApplicationsDto) {
    // User admins have access to all applications in the organization
    const allFromOrg = req.user.permissions.getAllOrganizationsWithUserAdmin();
    if (allFromOrg.some(x => x === query?.organizationId)) {
      return await this.applicationService.findAndCountWithPagination(query, [query.organizationId]);
    }

    const allowedApplications = req.user.permissions.getAllApplicationsWithAtLeastRead();
    return await this.applicationService.findAndCountInList(query, allowedApplications, [query.organizationId]);
  }
}
