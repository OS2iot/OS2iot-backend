import { CreateSigFoxApiCallbackRequestDto } from "@dto/sigfox/external/create-sigfox-api-callback-request.dto";
import { CreateSigFoxApiDeviceTypeRequestDto } from "@dto/sigfox/external/create-sigfox-api-device-type-request.dto";
import {
    SigFoxApiCallbackContent,
    SigFoxApiCallbacksResponseDto,
} from "@dto/sigfox/external/sigfox-api-callbacks-response.dto";
import {
    SigFoxApiDeviceTypeContent,
    SigFoxApiDeviceTypeResponse,
} from "@dto/sigfox/external/sigfox-api-device-type-response.dto";
import { SigFoxApiIdReferenceDto } from "@dto/sigfox/external/sigfox-api-id-reference.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { SigFoxDownlinkMode, SigFoxPayloadType } from "@enum/sigfox.enum";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GenericSigfoxAdministationService } from "./generic-sigfox-administation.service";
import { SigfoxApiUsersService } from "./sigfox-api-users.service";

@Injectable()
export class SigFoxApiDeviceTypeService {
    constructor(
        private genericService: GenericSigfoxAdministationService,
        private usersService: SigfoxApiUsersService,
        configService: ConfigService
    ) {
        this.OS2IOT_BACKEND_URL = configService.get<string>("backend.baseurl");
    }

    private OS2IOT_BACKEND_URL: string;
    private readonly OS2IOT_BACKEND_SIGFOX_CALLBACK_PATH =
        "/api/v1/sigfox-callback/data/bidir?apiKey={deviceTypeId}";
    private readonly CALLBACK_BODY_TEMPLATE = `{
    "time": {time},
    "deviceTypeId": "{deviceTypeId}",
    "deviceId": "{device}",
    "data": "{data}",
    "seqNumber": {seqNumber},
    "ack": {ack}
}`;
    private readonly CALLBACK_CONTENT_TYPE = "application/json";
    private readonly URL_BASE = "device-types";
    private readonly CALLBACK_CHANNEL = "URL";
    private readonly CALLBACK_TYPE = 0; // Data
    private readonly CALLBACK_SUBTYPE = 3; // BIDIR
    private readonly CALLBACK_HTTP_METHOD = "POST";
    private readonly CALLBACK_SEND_SNI = true;
    private readonly CALLBACK_ENABLED = true;

    async getAllByGroupIds(
        sigfoxGroup: SigFoxGroup,
        groupIds?: string[]
    ): Promise<SigFoxApiDeviceTypeResponse> {
        let url = this.URL_BASE;
        if (groupIds.length > 0) {
            url += "?groupIds=" + groupIds.join(",");
        }
        return await this.genericService.get(url, sigfoxGroup);
    }

    async getById(
        sigfoxGroup: SigFoxGroup,
        id: string
    ): Promise<SigFoxApiDeviceTypeContent> {
        const url = `${this.URL_BASE}/${id}`;
        return await this.genericService.get(url, sigfoxGroup);
    }

    async create(
        sigfoxGroup: SigFoxGroup,
        dto: CreateSigFoxApiDeviceTypeRequestDto
    ): Promise<SigFoxApiIdReferenceDto> {
        await this.setDefaults(dto, sigfoxGroup);
        return await this.genericService.post(this.URL_BASE, dto, sigfoxGroup);
    }

    async update(
        group: SigFoxGroup,
        id: string,
        dto: CreateSigFoxApiDeviceTypeRequestDto
    ): Promise<void> {
        const URL = `${this.URL_BASE}/${id}`;
        await this.genericService.put(URL, dto, group);
    }

    async delete(group: SigFoxGroup, id: string): Promise<void> {
        const url = `${this.URL_BASE}/${id}`;
        await this.genericService.delete(url, group);
    }

    async addOrUpdateCallback(group: SigFoxGroup, deviceTypeId: string): Promise<void> {
        const url = `${this.URL_BASE}/${deviceTypeId}/callbacks`;
        const response = await this.genericService.get<SigFoxApiCallbacksResponseDto>(
            url,
            group
        );
        const callback = response.data.find(x =>
            x.url.startsWith(this.OS2IOT_BACKEND_URL)
        );
        const dto: CreateSigFoxApiCallbackRequestDto = this.makeDto();
        let callbackId;

        if (callback) {
            // Callback exists, make sure it's OK
            if (this.isCallbackNotOk(callback)) {
                await this.genericService.put(`${url}/${callback.id}`, dto, group);
            }
            callbackId = callback.id;
        } else {
            callbackId = (
                await this.genericService.post<SigFoxApiIdReferenceDto>(url, dto, group)
            ).id;
        }

        // set active downlink to this
        await this.setActiveDownlinkCallback(group, deviceTypeId, callbackId);
    }

    private isCallbackNotOk(callback: SigFoxApiCallbackContent) {
        return (
            callback.enabled != this.CALLBACK_ENABLED ||
            callback.sendSni != this.CALLBACK_SEND_SNI ||
            callback.bodyTemplate != this.CALLBACK_BODY_TEMPLATE ||
            callback.channel != this.CALLBACK_CHANNEL ||
            callback.callbackSubtype != this.CALLBACK_SUBTYPE ||
            callback.httpMethod != this.CALLBACK_HTTP_METHOD ||
            callback.contentType != this.CALLBACK_CONTENT_TYPE
        );
    }

    private async setActiveDownlinkCallback(
        group: SigFoxGroup,
        deviceTypeId: string,
        callbackId: string
    ) {
        await this.genericService.put(
            `${this.URL_BASE}/${deviceTypeId}/callbacks/${callbackId}/downlink`,
            {},
            group
        );
    }

    private makeDto(): CreateSigFoxApiCallbackRequestDto {
        return {
            channel: this.CALLBACK_CHANNEL,
            callbackType: this.CALLBACK_TYPE,
            callbackSubtype: this.CALLBACK_SUBTYPE,
            payloadConfig: "",
            enabled: this.CALLBACK_ENABLED,
            url: this.OS2IOT_BACKEND_URL + this.OS2IOT_BACKEND_SIGFOX_CALLBACK_PATH,
            httpMethod: this.CALLBACK_HTTP_METHOD,
            sendSni: this.CALLBACK_SEND_SNI,
            bodyTemplate: this.CALLBACK_BODY_TEMPLATE,
            contentType: this.CALLBACK_CONTENT_TYPE,
        };
    }

    private async setDefaults(
        dto: CreateSigFoxApiDeviceTypeRequestDto,
        sigfoxGroup: SigFoxGroup
    ) {
        const sigfoxApiGroup = await this.usersService.getByUserId(
            sigfoxGroup.username,
            sigfoxGroup
        );
        dto.groupId = sigfoxApiGroup.group.id;

        dto.downlinkMode = SigFoxDownlinkMode.CALLBACK;
        dto.downlinkDataString = null;

        dto.payloadType = SigFoxPayloadType.RegularRawPayload;
        dto.payloadConfig = null;

        dto.automaticRenewal = true;

        dto.geolocPayloadConfigId = null;
    }
}
