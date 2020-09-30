import { CreateSigFoxApiDeviceTypeRequestDto } from "@dto/sigfox/external/create-sigfox-api-device-type-request.dto";
import {
    SigFoxApiDeviceTypeContent,
    SigFoxApiDeviceTypeResponse,
} from "@dto/sigfox/external/sigfox-api-device-type-response.dto";
import { SigFoxApiIdReferenceDto } from "@dto/sigfox/external/sigfox-api-id-reference.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { SigFoxDownlinkMode, SigFoxPayloadType } from "@enum/sigfox.enum";
import { Injectable } from "@nestjs/common";
import { GenericSigfoxAdministationService } from "./generic-sigfox-administation.service";
import { SigfoxApiUsersService } from "./sigfox-api-users.service";

@Injectable()
export class SigFoxApiDeviceTypeService {
    constructor(
        private genericService: GenericSigfoxAdministationService,
        private usersService: SigfoxApiUsersService
    ) {}

    private readonly URL_BASE = "device-types";

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
        await this.setForUpdate(dto, group, id);
        const URL = `${this.URL_BASE}/${id}`;
        await this.genericService.put(URL, dto, group);
    }

    async delete(group: SigFoxGroup, id: string): Promise<void> {
        const url = `${this.URL_BASE}/${id}`;
        await this.genericService.delete(url, group);
    }

    private async setForUpdate(
        dto: CreateSigFoxApiDeviceTypeRequestDto,
        group: SigFoxGroup,
        id: string
    ) {
        // const existing = await this.getById(group, id);
        // await this.setDefaults(dto, group);
        // Ensure that the value of authomaticRenewal is preserved.
        // dto.automaticRenewal = existing.automaticRenewal;
    }

    private async setDefaults(
        dto: CreateSigFoxApiDeviceTypeRequestDto,
        sigfoxGroup: SigFoxGroup
    ) {
        const sigFoxApiGroup = await this.usersService.getByUserId(
            sigfoxGroup.username,
            sigfoxGroup
        );
        dto.groupId = sigFoxApiGroup.group.id;

        dto.downlinkMode = SigFoxDownlinkMode.CALLBACK;
        dto.downlinkDataString = null;

        dto.payloadType = SigFoxPayloadType.RegularRawPayload;
        dto.payloadConfig = null;

        dto.automaticRenewal = true;

        dto.geolocPayloadConfigId = null;
    }
}
