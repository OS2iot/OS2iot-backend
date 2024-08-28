import {
    SigFoxApiContractInfosContent,
    SigFoxApiContractInfosResponseDto,
} from "@dto/sigfox/external/sigfox-api-contract-infos-response.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { Injectable } from "@nestjs/common";
import { GenericSigfoxAdministationService } from "./generic-sigfox-administation.service";

@Injectable()
export class SigFoxApiContractService {
    constructor(private genericService: GenericSigfoxAdministationService) {}

    async getContractInfos(sigfoxGroup: SigFoxGroup): Promise<SigFoxApiContractInfosContent[]> {
        const res = await this.genericService.get<SigFoxApiContractInfosResponseDto>("contract-infos", sigfoxGroup);

        return res.data;
    }
}
