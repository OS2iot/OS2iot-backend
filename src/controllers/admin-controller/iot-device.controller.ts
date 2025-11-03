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
  Req,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";
import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { ApplicationAccessScope, checkIfUserHasAccessToApplication } from "@helpers/security-helper";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { SigFoxDeviceWithBackendDataDto } from "@dto/sigfox-device-with-backend-data.dto";
import { CreateIoTDeviceDownlinkDto } from "@dto/create-iot-device-downlink.dto";
import { IoTDeviceDownlinkService } from "@services/device-management/iot-device-downlink.service";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { DeviceDownlinkQueueResponseDto } from "@dto/chirpstack/chirpstack-device-downlink-queue-response.dto";
import { IoTDeviceType } from "@enum/device-type.enum";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { IotDeviceBatchResponseDto } from "@dto/iot-device/iot-device-batch-response.dto";
import { CreateIoTDeviceBatchDto } from "@dto/iot-device/create-iot-device-batch.dto";
import { UpdateIoTDeviceBatchDto } from "@dto/iot-device/update-iot-device-batch.dto";
import {
  buildIoTDeviceCreateUpdateAuditData,
  ensureUpdatePayload as ensureIoTDeviceUpdatePayload,
} from "@helpers/iot-device.helper";
import { DeviceStatsResponseDto } from "@dto/chirpstack/device/device-stats.response.dto";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { MQTTInternalBrokerDeviceDTO } from "@dto/mqtt-internal-broker-device.dto";
import { MQTTExternalBrokerDeviceDTO } from "@dto/mqtt-external-broker-device.dto";
import { ApiAuth } from "@auth/swagger-auth-decorator";
import { DownlinkQueueDto } from "@dto/downlink.dto";
import { UpdateIoTDeviceApplication } from "@dto/update-iot-device-application.dto";

@ApiTags("IoT Device")
@Controller("iot-device")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class IoTDeviceController {
  constructor(
    private iotDeviceService: IoTDeviceService,
    private downlinkService: IoTDeviceDownlinkService,
    private chirpstackDeviceService: ChirpstackDeviceService
  ) {}

  private readonly logger = new Logger(IoTDeviceController.name);

  @Get(":id")
  @ApiOperation({ summary: "Find one IoT-Device by id" })
  @ApiNotFoundResponse()
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<
    | IoTDevice
    | LoRaWANDeviceWithChirpstackDataDto
    | SigFoxDeviceWithBackendDataDto
    | MQTTInternalBrokerDeviceDTO
    | MQTTExternalBrokerDeviceDTO
  > {
    let result = undefined;
    try {
      result = await this.iotDeviceService.findOneWithApplicationAndMetadata(id, true);
    } catch (err) {
      this.logger.error(`Error occured during findOne: '${JSON.stringify(err)}'`);
    }

    if (!result) {
      throw new NotFoundException(ErrorCodes.IdDoesNotExists);
    }

    checkIfUserHasAccessToApplication(req, result.application.id, ApplicationAccessScope.Read);

    return result;
  }

  @Get(":id/downlink")
  @ApiOperation({ summary: "Get downlink queue for a LoRaWAN/SigFox device" })
  async findDownlinkQueue(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DownlinkQueueDto[] | DeviceDownlinkQueueResponseDto> {
    let device = undefined;
    try {
      device = await this.iotDeviceService.findOneWithApplicationAndMetadata(id, true);
    } catch (err) {
      this.logger.error(`Error occured during findOne: '${JSON.stringify(err)}'`);
    }

    if (!device) {
      throw new NotFoundException(ErrorCodes.IdDoesNotExists);
    }
    checkIfUserHasAccessToApplication(req, device.application.id, ApplicationAccessScope.Read);
    if (device.type === IoTDeviceType.LoRaWAN) {
      return this.downlinkService.getDownlinkQueue(device.id);
    } else if (device.type === IoTDeviceType.SigFox) {
      return this.iotDeviceService.getDownlinkForSigfox(device as SigFoxDevice);
    } else {
      throw new BadRequestException(ErrorCodes.OnlyAllowedForLoRaWANAndSigfox);
    }
  }

  @Get(":id/historicalDownlink")
  @ApiOperation({ summary: "Get historical downlinks for a LoRaWAN device" })
  async findHistoricalDownlinks(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DownlinkQueueDto[] | DeviceDownlinkQueueResponseDto> {
    let device = undefined;

    try {
      device = await this.iotDeviceService.findOneWithApplicationAndMetadata(id, true);
    } catch (err) {
      this.logger.error(`Error occured during findOne: '${JSON.stringify(err)}'`);
    }

    if (!device) {
      throw new NotFoundException(ErrorCodes.IdDoesNotExists);
    }
    checkIfUserHasAccessToApplication(req, device.application.id, ApplicationAccessScope.Read);

    return this.downlinkService.getHistoricalDownlinks(device.id);
  }

  @Get("/stats/:id")
  @ApiOperation({
    summary: "Get statistics of several key values over the past period",
  })
  async findStats(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DeviceStatsResponseDto[]> {
    const device = await this.iotDeviceService.findOne(id);
    checkIfUserHasAccessToApplication(req, device.application.id, ApplicationAccessScope.Read);

    return this.iotDeviceService.findStats(device);
  }

  @Post()
  @Header("Cache-Control", "none")
  @ApiOperation({ summary: "Create a new IoTDevice" })
  @ApiBadRequestResponse()
  async create(@Req() req: AuthenticatedRequest, @Body() createDto: CreateIoTDeviceDto): Promise<IoTDevice> {
    try {
      checkIfUserHasAccessToApplication(req, createDto.applicationId, ApplicationAccessScope.Write);
      const device = await this.iotDeviceService.create(createDto, req.user.userId);
      AuditLog.success(ActionType.CREATE, IoTDevice.name, req.user.userId, device.id, device.name);
      return device;
    } catch (err) {
      AuditLog.fail(ActionType.CREATE, IoTDevice.name, req.user.userId);
      this.logger.error(`Failed to create IoTDevice from dto: ${JSON.stringify(createDto)}. Error: ${err}`);
      throw err;
    }
  }

  @Post(":id/downlink")
  @Header("Cache-Control", "none")
  @ApiOperation({ summary: "Schedule downlink for SigFox or LoRaWAN device" })
  @ApiBadRequestResponse()
  async createDownlink(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() dto: CreateIoTDeviceDownlinkDto
  ): Promise<void> {
    try {
      const device = await this.iotDeviceService.findOneWithApplicationAndMetadata(id);
      if (!device) {
        throw new NotFoundException();
      }
      checkIfUserHasAccessToApplication(req, device?.application?.id, ApplicationAccessScope.Write);

      await this.downlinkService.createDownlink(dto, device);

      AuditLog.success(ActionType.CREATE, "Downlink", req.user.userId);
      return;
    } catch (err) {
      AuditLog.fail(ActionType.CREATE, "Downlink", req.user.userId);
      throw err;
    }
  }

  @Post(":id/flushDownlinkQueue")
  @ApiOperation({ summary: "Flush downlink queue" })
  async flushDownlinkQueue(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<void> {
    try {
      const device = await this.iotDeviceService.findOneWithApplicationAndMetadata(id);
      if (!device) {
        throw new NotFoundException();
      }

      checkIfUserHasAccessToApplication(req, device?.application?.id, ApplicationAccessScope.Write);

      await this.downlinkService.flushDownlinkQueue(device);

      AuditLog.success(ActionType.DELETE, "FlushDownlinkQueue", req.user.userId);
      return;
    } catch (err) {
      AuditLog.fail(ActionType.DELETE, "FlushDownlinkQueue", req.user.userId);
      throw err;
    }
  }

  @Put(":id")
  @Header("Cache-Control", "none")
  @ApiOperation({ summary: "Update an existing IoT-Device" })
  @ApiBadRequestResponse()
  async update(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateDto: UpdateIoTDeviceDto
  ): Promise<IoTDevice> {
    // Old application
    const oldIotDevice = await this.iotDeviceService.findOneWithApplicationAndMetadata(id, false);
    try {
      checkIfUserHasAccessToApplication(req, oldIotDevice.application.id, ApplicationAccessScope.Write);
      if (updateDto.applicationId !== oldIotDevice.application.id) {
        // New application
        checkIfUserHasAccessToApplication(req, updateDto.applicationId, ApplicationAccessScope.Write);
      }
    } catch (err) {
      AuditLog.fail(ActionType.UPDATE, IoTDevice.name, req.user.userId, id);
      throw err;
    }

    const iotDevice = await this.iotDeviceService.update(id, updateDto, req.user.userId);
    AuditLog.success(ActionType.UPDATE, IoTDevice.name, req.user.userId, iotDevice.id, iotDevice.name);
    return iotDevice;
  }

  @Put("changeApplication/:id")
  @Header("Cache-Control", "none")
  @ApiOperation({ summary: "Update an existing IoT-Device" })
  @ApiBadRequestResponse()
  async changeApplication(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateDto: UpdateIoTDeviceApplication
  ): Promise<IoTDevice> {
    // Old application
    const dbIotDevice = await this.iotDeviceService.findOneWithApplicationAndMetadata(id, false);

    if (dbIotDevice.type === IoTDeviceType.SigFox) throw new BadRequestException(ErrorCodes.NotValidFormat);

    try {
      checkIfUserHasAccessToApplication(req, dbIotDevice.application.id, ApplicationAccessScope.Write);
      if (updateDto.applicationId !== dbIotDevice.application.id) {
        // New application
        checkIfUserHasAccessToApplication(req, updateDto.applicationId, ApplicationAccessScope.Write);
      }
    } catch (err) {
      AuditLog.fail(ActionType.UPDATE, IoTDevice.name, req.user.userId, id);
      throw err;
    }

    const iotDevice = await this.iotDeviceService.changeApplication(id, updateDto, req.user.userId);
    AuditLog.success(ActionType.UPDATE, IoTDevice.name, req.user.userId, iotDevice.id, iotDevice.name);
    return iotDevice;
  }

  @Post("createMany")
  @Header("Cache-Control", "none")
  @ApiOperation({ summary: "Create many IoT-Devices" })
  @ApiBadRequestResponse()
  async createMany(
    @Req() req: AuthenticatedRequest,
    @Body() createDto: CreateIoTDeviceBatchDto
  ): Promise<IotDeviceBatchResponseDto[]> {
    try {
      createDto.data.forEach(createDto =>
        checkIfUserHasAccessToApplication(req, createDto.applicationId, ApplicationAccessScope.Write)
      );

      const devices = await this.iotDeviceService.createMany(createDto.data, req.user.userId);

      // Iterate through the devices once, splitting it into a tuple with the data we want to log
      const { deviceIds, deviceNames } = buildIoTDeviceCreateUpdateAuditData(devices);

      if (!deviceIds.length) {
        AuditLog.fail(ActionType.CREATE, IoTDevice.name, req.user.userId);
      } else {
        AuditLog.success(
          ActionType.CREATE,
          IoTDevice.name,
          req.user.userId,
          deviceIds.join(", "),
          deviceNames.join(", ")
        );
      }
      return devices;
    } catch (err) {
      AuditLog.fail(ActionType.CREATE, IoTDevice.name, req.user.userId);
      this.logger.error(`Failed to create IoTDevice from dto: ${JSON.stringify(createDto)}. Error: ${err}`);
      throw err;
    }
  }

  @Post("updateMany")
  @Header("Cache-Control", "none")
  @ApiOperation({ summary: "Update existing IoT-Devices" })
  @ApiBadRequestResponse()
  async updateMany(
    @Req() req: AuthenticatedRequest,
    @Body() updateDto: UpdateIoTDeviceBatchDto
  ): Promise<IotDeviceBatchResponseDto[]> {
    const oldIotDevices = await this.iotDeviceService.findManyWithApplicationAndMetadata(
      updateDto.data.map(iotDevice => iotDevice.id)
    );
    const devicesNotFound: IotDeviceBatchResponseDto[] = [];
    const validDevices: typeof updateDto = { data: [] };

    try {
      validDevices.data = updateDto.data.reduce(
        ensureIoTDeviceUpdatePayload(validDevices, oldIotDevices, devicesNotFound, req),
        []
      );
    } catch (err) {
      AuditLog.fail(ActionType.UPDATE, IoTDevice.name, req.user.userId);
      throw err;
    }

    const response = validDevices.data.length
      ? await this.iotDeviceService.updateMany(validDevices, req.user.userId)
      : [];
    response.push(...devicesNotFound);

    const { deviceIds, deviceNames } = buildIoTDeviceCreateUpdateAuditData(response);

    if (!deviceIds.length) {
      AuditLog.fail(ActionType.CREATE, IoTDevice.name, req.user.userId);
    } else {
      AuditLog.success(
        ActionType.CREATE,
        IoTDevice.name,
        req.user.userId,
        deviceIds.join(", "),
        deviceNames.join(", ")
      );
    }
    return response;
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an existing IoT-Device" })
  @ApiBadRequestResponse()
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DeleteResponseDto> {
    try {
      const oldIotDevice = await this.iotDeviceService.findOneWithApplicationAndMetadata(id, false);
      checkIfUserHasAccessToApplication(req, oldIotDevice?.application?.id, ApplicationAccessScope.Write);
      const result = await this.iotDeviceService.delete(oldIotDevice);
      AuditLog.success(ActionType.DELETE, IoTDevice.name, req.user.userId, id);
      return new DeleteResponseDto(result.affected);
    } catch (err) {
      AuditLog.fail(ActionType.DELETE, IoTDevice.name, req.user.userId, id);
      throw err;
    }
  }

  @Put("resetHttpDeviceApiKey/:id")
  @ApiOperation({ summary: "Reset the API key of a generic HTTP device" })
  @ApiBadRequestResponse()
  async resetHttpDeviceApiKey(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<Pick<GenericHTTPDevice, "apiKey">> {
    try {
      const oldIotDevice = await this.iotDeviceService.findOne(id);
      checkIfUserHasAccessToApplication(req, oldIotDevice?.application?.id, ApplicationAccessScope.Write);

      if (oldIotDevice.type !== IoTDeviceType.GenericHttp) {
        throw new BadRequestException("The requested device is not a generic HTTP device");
      }

      const result = await this.iotDeviceService.resetHttpDeviceApiKey(oldIotDevice as GenericHTTPDevice);
      AuditLog.success(ActionType.UPDATE, IoTDevice.name, req.user.userId, id);
      return {
        apiKey: result.apiKey,
      };
    } catch (err) {
      AuditLog.fail(ActionType.UPDATE, IoTDevice.name, req.user.userId, id);
      throw err;
    }
  }

  @Get("getDevicesMetadataCsv/:applicationId")
  @ApiOperation({
    summary: "Get csv containing metadata for all devices in an application",
  })
  @ApiBadRequestResponse()
  async getDevicesMetadataCsv(
    @Req() req: AuthenticatedRequest,
    @Param("applicationId", new ParseIntPipe()) applicationId: number
  ): Promise<StreamableFile> {
    try {
      checkIfUserHasAccessToApplication(req, applicationId, ApplicationAccessScope.Read);
      const csvFile = await this.iotDeviceService.getDevicesMetadataCsv(applicationId);
      return new StreamableFile(csvFile);
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }
}
