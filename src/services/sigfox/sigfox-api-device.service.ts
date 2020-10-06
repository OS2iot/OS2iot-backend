import { CreateSigFoxApiDeviceRequestDto } from "@dto/sigfox/external/create-sigfox-api-device-request.dto";
import { SigFoxApiDeviceResponse } from "@dto/sigfox/external/sigfox-api-device-response.dto";
import { SigFoxApiIdReferenceDto } from "@dto/sigfox/external/sigfox-api-id-reference.dto";
import { SigFoxApiSingleDeviceResponseDto } from "@dto/sigfox/external/sigfox-api-single-device-response.dto";
import { UpdateSigFoxApiDeviceRequestDto } from "@dto/sigfox/external/update-sigfox-api-device-request.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { GenericSigfoxAdministationService } from "./generic-sigfox-administation.service";

@Injectable()
export class SigFoxApiDeviceService {
    constructor(private genericService: GenericSigfoxAdministationService) {}

    private readonly URL_BASE = "devices";

    private readonly logger = new Logger(SigFoxApiDeviceService.name);

    async getAllByGroupIds(
        sigfoxGroup: SigFoxGroup,
        groupIds?: string[]
    ): Promise<SigFoxApiDeviceResponse> {
        let url = this.URL_BASE;
        if (groupIds.length > 0) {
            url += "?groupIds=" + groupIds.join(",");
        }
        return await this.genericService.get(url, sigfoxGroup);
    }

    async getById(
        sigfoxGroup: SigFoxGroup,
        id: string
    ): Promise<SigFoxApiSingleDeviceResponseDto> {
        const url = `${this.URL_BASE}/${id}`;
        return await this.genericService.get(url, sigfoxGroup, true);
    }

    async create(
        sigfoxGroup: SigFoxGroup,
        dto: CreateSigFoxApiDeviceRequestDto
    ): Promise<SigFoxApiIdReferenceDto> {
        return await this.genericService.post(this.URL_BASE, dto, sigfoxGroup);
    }

    async update(
        group: SigFoxGroup,
        id: string,
        dto: UpdateSigFoxApiDeviceRequestDto
    ): Promise<void> {
        const URL = `${this.URL_BASE}/${id}`;
        await this.genericService.put(URL, dto, group);
    }

    async delete(group: SigFoxGroup, id: string): Promise<void> {
        const deleteUrl = `${this.URL_BASE}/${id}`;
        
        // To delete a sigfox device, first unsubscribe, then delete
        await this.unsubscribe(group, id);

        await this.genericService.delete(deleteUrl, group);
    }

    private async unsubscribe(group: SigFoxGroup, id: string) {
        const unsubscribeUrl = `${this.URL_BASE}/${id}/unsubscribe`;
        const unsubscribeDto = {
            unsubscriptionTime: new Date().valueOf(),
        };
        try {
            await this.genericService.put(unsubscribeUrl, unsubscribeDto, group);
        } catch (err) {
            this.logger.error(`SigFox backend failed to unsubscribe device '${id}'`);
            throw new BadRequestException(err);
        }
    }
}
