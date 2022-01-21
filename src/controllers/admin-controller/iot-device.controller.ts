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
    UseGuards,
} from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ComposeAuthGuard } from '@auth/compose-auth.guard';
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";
import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
    checkIfUserHasReadAccessToApplication,
    checkIfUserHasWriteAccessToApplication,
} from "@helpers/security-helper";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { SigFoxDeviceWithBackendDataDto } from "@dto/sigfox-device-with-backend-data.dto";
import { CreateIoTDeviceDownlinkDto } from "@dto/create-iot-device-downlink.dto";
import { IoTDeviceDownlinkService } from "@services/device-management/iot-device-downlink.service";
import { CreateChirpstackDeviceQueueItemResponse } from "@dto/chirpstack/create-chirpstack-device-queue-item.dto";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { DeviceDownlinkQueueResponseDto } from "@dto/chirpstack/chirpstack-device-downlink-queue-response.dto";
import { IoTDeviceType } from "@enum/device-type.enum";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";

@ApiTags("IoT Device")
@Controller("iot-device")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiBearerAuth()
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
        IoTDevice | LoRaWANDeviceWithChirpstackDataDto | SigFoxDeviceWithBackendDataDto
    > {
        let result = undefined;
        try {
            result = await this.iotDeviceService.findOneWithApplicationAndMetadata(
                id,
                true
            );
        } catch (err) {
            this.logger.error(`Error occured during findOne: '${JSON.stringify(err)}'`);
        }

        if (!result) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }

        checkIfUserHasReadAccessToApplication(req, result.application.id);

        return result;
    }

    @Get(":id/downlink")
    @ApiOperation({ summary: "Get downlink queue for a LoRaWAN/SigFox device" })
    async findDownlinkQueue(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeviceDownlinkQueueResponseDto> {
        let device = undefined;
        try {
            device = await this.iotDeviceService.findOneWithApplicationAndMetadata(
                id,
                true
            );
        } catch (err) {
            this.logger.error(`Error occured during findOne: '${JSON.stringify(err)}'`);
        }

        if (!device) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
        checkIfUserHasReadAccessToApplication(req, device.application.id);
        if (device.type == IoTDeviceType.LoRaWAN) {
            return this.chirpstackDeviceService.getDownlinkQueue(
                (device as LoRaWANDevice).deviceEUI
            );
        } else if (device.type == IoTDeviceType.SigFox) {
            return this.iotDeviceService.getDownlinkForSigfox(device as SigFoxDevice);
        } else {
            throw new BadRequestException(ErrorCodes.OnlyAllowedForLoRaWANAndSigfox);
        }
    }

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new IoTDevice" })
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createDto: CreateIoTDeviceDto
    ): Promise<IoTDevice> {
        try {
            checkIfUserHasWriteAccessToApplication(req, createDto.applicationId);
            const device = await this.iotDeviceService.create(createDto, req.user.userId);
            AuditLog.success(
                ActionType.CREATE,
                IoTDevice.name,
                req.user.userId,
                device.id,
                device.name
            );
            return device;
        } catch (err) {
            AuditLog.fail(ActionType.CREATE, IoTDevice.name, req.user.userId);
            this.logger.error(
                `Failed to create IoTDevice from dto: ${JSON.stringify(
                    createDto
                )}. Error: ${err}`
            );
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
    ): Promise<void | CreateChirpstackDeviceQueueItemResponse> {
        try {
            const device = await this.iotDeviceService.findOneWithApplicationAndMetadata(
                id
            );
            if (!device) {
                throw new NotFoundException();
            }
            checkIfUserHasWriteAccessToApplication(req, device?.application?.id);
            const result = await this.downlinkService.createDownlink(dto, device);
            AuditLog.success(ActionType.CREATE, "Downlink", req.user.userId);
            return result;
        } catch (err) {
            AuditLog.fail(ActionType.CREATE, "Downlink", req.user.userId);
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
        const oldIotDevice = await this.iotDeviceService.findOneWithApplicationAndMetadata(
            id,
            false
        );
        try {
            checkIfUserHasWriteAccessToApplication(req, oldIotDevice.application.id);
            if (updateDto.applicationId !== oldIotDevice.application.id) {
                // New application
                checkIfUserHasWriteAccessToApplication(req, updateDto.applicationId);
            }
        } catch (err) {
            AuditLog.fail(ActionType.UPDATE, IoTDevice.name, req.user.userId, id);
            throw err;
        }

        const iotDevice = await this.iotDeviceService.update(
            id,
            updateDto,
            req.user.userId
        );
        AuditLog.success(
            ActionType.UPDATE,
            IoTDevice.name,
            req.user.userId,
            iotDevice.id,
            iotDevice.name
        );
        return iotDevice;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing IoT-Device" })
    @ApiBadRequestResponse()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        try {
            const oldIotDevice = await this.iotDeviceService.findOneWithApplicationAndMetadata(
                id,
                false
            );
            checkIfUserHasWriteAccessToApplication(req, oldIotDevice?.application?.id);
            const result = await this.iotDeviceService.delete(oldIotDevice);
            AuditLog.success(ActionType.DELETE, IoTDevice.name, req.user.userId, id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            AuditLog.fail(ActionType.DELETE, IoTDevice.name, req.user.userId, id);
            throw err;
        }
    }
}
