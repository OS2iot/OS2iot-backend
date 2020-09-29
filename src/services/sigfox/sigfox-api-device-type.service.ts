import {
    SigFoxApiDeviceTypeContent,
    SigFoxApiDeviceTypeResponse,
} from "@dto/sigfox/external/sigfox-api-device-type-response.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { Injectable } from "@nestjs/common";
import { GenericSigfoxAdministationService } from "./generic-sigfox-administation.service";

@Injectable()
export class SigFoxApiDeviceTypeService {
    constructor(private genericService: GenericSigfoxAdministationService) {}

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
}
