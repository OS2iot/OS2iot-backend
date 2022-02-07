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
import { IotDeviceBatchResponseDto } from "@dto/iot-device/iot-device-batch-response.dto";
import { ArrayMaxSize } from "class-validator";
import { CreateIoTDeviceBatchDto } from "@dto/iot-device/create-iot-device-batch.dto";
import { UpdateIoTDeviceBatchDto } from "@dto/iot-device/update-iot-device-batch.dto";

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

    @Post("createMany")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create many IoT-Devices" })
    @ApiBadRequestResponse()
    async createMany(
        @Req() req: AuthenticatedRequest,
        @Body() createDto: CreateIoTDeviceBatchDto
    ): Promise<IotDeviceBatchResponseDto[]> {
        try {
            checkIfUserHasWriteAccessToApplication(req, createDto.data[0].applicationId);
            const devices = await this.iotDeviceService.createMany(
                createDto.data,
                req.user.userId
            );

            // Iterate through the devices once, splitting it into a tuple with the data we want to log
            const { deviceIds, deviceNames } = buildCreateUpdateAuditData(devices);

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
            this.logger.error(
                `Failed to create IoTDevice from dto: ${JSON.stringify(
                    createDto
                )}. Error: ${err}`
            );
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
                ensureUpdatePayload(validDevices, oldIotDevices, devicesNotFound, req),
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

        const { deviceIds, deviceNames } = buildCreateUpdateAuditData(response);

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

/**
 * Iterate through the devices once, splitting it into a tuple with the data we want to log
 * @param response
 */
function buildCreateUpdateAuditData(response: IotDeviceBatchResponseDto[]): { deviceIds: any; deviceNames: any; } {
    return response.reduce(
        (res: { deviceIds: number[]; deviceNames: string[]; }, device) => {
            if (!device.data || device.error) {
                return res;
            }
            device.data.id && res.deviceIds.push(device.data.id);
            device.data.name && res.deviceNames.push(device.data.name);
            return res;
        },
        { deviceIds: [], deviceNames: [] }
    );
}

function ensureUpdatePayload(
    validDevices: UpdateIoTDeviceBatchDto,
    oldIotDevices: (
        | IoTDevice
        | LoRaWANDeviceWithChirpstackDataDto
        | SigFoxDeviceWithBackendDataDto
    )[],
    devicesNotFound: IotDeviceBatchResponseDto[],
    req: AuthenticatedRequest
): (
    previousValue: UpdateIoTDeviceDto[],
    currentValue: UpdateIoTDeviceDto,
    currentIndex: number,
    array: UpdateIoTDeviceDto[]
) => UpdateIoTDeviceDto[] {
    return (res: typeof validDevices["data"], updateDeviceDto) => {
        const oldDevice = oldIotDevices.find(
            oldDevice => oldDevice.id === updateDeviceDto.id
        );

        if (!oldDevice) {
            devicesNotFound.push({
                idMetadata: {
                    applicationId: updateDeviceDto.applicationId,
                    name: updateDeviceDto.name,
                },
                error: {
                    message: ErrorCodes.IdDoesNotExists,
                },
            });
            return res;
        }

        checkIfUserHasWriteAccessToApplication(req, oldDevice.application.id);

        if (updateDeviceDto.applicationId !== oldDevice.application.id) {
            // New application
            checkIfUserHasWriteAccessToApplication(req, updateDeviceDto.applicationId);
        }
        res.push(updateDeviceDto);
        return res;
    };
}
