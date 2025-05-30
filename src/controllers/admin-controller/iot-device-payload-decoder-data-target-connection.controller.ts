import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CreateIoTDevicePayloadDecoderDataTargetConnectionDto } from "@dto/create-iot-device-payload-decoder-data-target-connection.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllApplicationsResponseDto } from "@dto/list-all-applications-response.dto";
import { ListAllConnectionsResponseDto } from "@dto/list-all-connections-response.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { UpdateIoTDevicePayloadDecoderDataTargetConnectionDto as UpdateConnectionDto } from "@dto/update-iot-device-payload-decoder-data-target-connection.dto";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { ApplicationAccessScope, checkIfUserHasAccessToApplication } from "@helpers/security-helper";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/device-management/iot-device-payload-decoder-data-target-connection.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { ApiAuth } from "@auth/swagger-auth-decorator";
import { AppendCopiedDeviceDto } from "@dto/append-copied-device.dto";

@ApiTags("IoT-Device, PayloadDecoder and DataTarget Connection")
@Controller("iot-device-payload-decoder-data-target-connection")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class IoTDevicePayloadDecoderDataTargetConnectionController {
  constructor(
    private service: IoTDevicePayloadDecoderDataTargetConnectionService,
    private iotDeviceService: IoTDeviceService
  ) {}

  @Get()
  @ApiProduces("application/json")
  @ApiOperation({
    summary: "Find all connections between IoT-Devices, PayloadDecoders and DataTargets (paginated)",
  })
  @ApiResponse({
    status: 200,
    description: "Success",
    type: ListAllApplicationsResponseDto,
  })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query?: ListAllEntitiesDto
  ): Promise<ListAllConnectionsResponseDto> {
    if (req.user.permissions.isGlobalAdmin) {
      return await this.service.findAndCountWithPagination(query);
    } else {
      const allowed = req.user.permissions.getAllApplicationsWithAtLeastRead();
      return await this.service.findAndCountWithPagination(query, allowed);
    }
  }

  @Get(":id")
  @ApiNotFoundResponse({
    description: "If the id of the entity doesn't exist",
  })
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
    return await this.service.findOne(id);
  }

  @Get("byIoTDevice/:id")
  @ApiOperation({
    summary: "Find all connections by IoT-Device id",
  })
  async findByIoTDeviceId(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<ListAllConnectionsResponseDto> {
    if (req.user.permissions.isGlobalAdmin) {
      return await this.service.findAllByIoTDeviceId(id);
    } else {
      return await this.service.findAllByIoTDeviceId(id, req.user.permissions.getAllApplicationsWithAtLeastRead());
    }
  }

  @Get("byPayloadDecoder/:id")
  @ApiOperation({
    summary: "Find all connections by PayloadDecoder id",
  })
  async findByPayloadDecoderId(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<ListAllConnectionsResponseDto> {
    if (req.user.permissions.isGlobalAdmin) {
      return await this.service.findAllByPayloadDecoderId(id);
    } else {
      return await this.service.findAllByPayloadDecoderId(
        id,
        req.user.permissions.getAllOrganizationsWithAtLeastApplicationRead()
      );
    }
  }

  @Get("byDataTarget/:id")
  @ApiOperation({
    summary: "Find all connections by DataTarget id",
  })
  async findByDataTargetId(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<ListAllConnectionsResponseDto> {
    if (req.user.permissions.isGlobalAdmin) {
      return await this.service.findAllByDataTargetId(id);
    } else {
      const allowed = req.user.permissions.getAllApplicationsWithAtLeastRead();
      return await this.service.findAllByDataTargetId(id, allowed);
    }
  }

  @Post()
  @ApplicationAdmin()
  @ApiOperation({
    summary: "Create new connection",
  })
  @ApiBadRequestResponse({
    description: "If one or more of the id's are invalid references.",
  })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body()
    createDto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto
  ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
    try {
      await this.checkUserHasWriteAccessToAllIotDevices(createDto.iotDeviceIds, req);
      const result = await this.service.create(createDto, req.user.userId);

      AuditLog.success(ActionType.CREATE, IoTDevicePayloadDecoderDataTargetConnection.name, req.user.userId, result.id);
      return result;
    } catch (err) {
      AuditLog.fail(ActionType.CREATE, IoTDevicePayloadDecoderDataTargetConnection.name, req.user.userId);
      throw err;
    }
  }

  private async checkUserHasWriteAccessToAllIotDevices(ids: number[], req: AuthenticatedRequest) {
    const iotDevices = await this.iotDeviceService.findManyByIds(ids);
    iotDevices.forEach(x => {
      checkIfUserHasAccessToApplication(req, x.application.id, ApplicationAccessScope.Write);
    });
  }

  @Put(":id")
  @ApplicationAdmin()
  @ApiNotFoundResponse({
    description: "If the id of the entity doesn't exist",
  })
  @ApiBadRequestResponse({
    description: "If one or more of the id's are invalid references.",
  })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateDto: UpdateConnectionDto
  ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
    try {
      await this.checkIfUpdateIsAllowed(updateDto, req, id);
      const result = await this.service.update(id, updateDto, req.user.userId);

      AuditLog.success(ActionType.UPDATE, IoTDevicePayloadDecoderDataTargetConnection.name, req.user.userId, result.id);
      return result;
    } catch (err) {
      AuditLog.fail(ActionType.UPDATE, IoTDevicePayloadDecoderDataTargetConnection.name, req.user.userId, id);
      throw err;
    }
  }

  private async checkIfUpdateIsAllowed(updateDto: UpdateConnectionDto, req: AuthenticatedRequest, id: number) {
    const newIotDevice = await this.iotDeviceService.findOne(updateDto.iotDeviceIds[0]);
    checkIfUserHasAccessToApplication(req, newIotDevice.application.id, ApplicationAccessScope.Write);
    const oldConnection = await this.service.findOne(id);
    await this.checkUserHasWriteAccessToAllIotDevices(updateDto.iotDeviceIds, req);
    const oldIds = oldConnection.iotDevices.map(x => x.id);
    if (updateDto.iotDeviceIds != oldIds) {
      await this.checkUserHasWriteAccessToAllIotDevices(oldIds, req);
    }
  }

  @Put("appendCopiedDevice/:id")
  @ApplicationAdmin()
  @ApiNotFoundResponse({
    description: "If the id of the entity doesn't exist",
  })
  @ApiBadRequestResponse({
    description: "If one or more of the id's are invalid references.",
  })
  async appendCopiedDevice(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() dto: AppendCopiedDeviceDto
  ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
    try {
      const newIotDevice = await this.iotDeviceService.findOne(dto.deviceId);
      checkIfUserHasAccessToApplication(req, newIotDevice.application.id, ApplicationAccessScope.Write);

      const result = await this.service.appendCopiedDevice(id, newIotDevice, req.user.userId);

      AuditLog.success(ActionType.UPDATE, IoTDevicePayloadDecoderDataTargetConnection.name, req.user.userId, result.id);
      return result;
    } catch (err) {
      AuditLog.fail(ActionType.UPDATE, IoTDevicePayloadDecoderDataTargetConnection.name, req.user.userId, id);
      throw err;
    }
  }

  @Delete(":id")
  @ApplicationAdmin()
  @ApiNotFoundResponse({
    description: "If the id of the entity doesn't exist",
  })
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DeleteResponseDto> {
    try {
      const oldConnection = await this.service.findOne(id);
      await this.checkUserHasWriteAccessToAllIotDevices(
        oldConnection.iotDevices.map(x => x.id),
        req
      );
      const result = await this.service.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(ErrorCodes.IdDoesNotExists);
      }
      AuditLog.success(ActionType.DELETE, IoTDevicePayloadDecoderDataTargetConnection.name, req.user.userId, id);
      return new DeleteResponseDto(result.affected);
    } catch (err) {
      AuditLog.fail(ActionType.DELETE, IoTDevicePayloadDecoderDataTargetConnection.name, req.user.userId, id);
      throw err;
    }
  }
}
