import { SigFoxApiUsersContent } from "@dto/sigfox/external/sigfox-api-users-response.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { Injectable } from "@nestjs/common";
import { GenericSigfoxAdministationService } from "./generic-sigfox-administation.service";

@Injectable()
export class SigfoxApiUsersService {
    constructor(private genericService: GenericSigfoxAdministationService) {}

    private readonly BASE_URL = "api-users";

    async getByUserId(userId: string, credentials: SigFoxGroup): Promise<SigFoxApiUsersContent> {
        return await this.genericService.get(`${this.BASE_URL}/${userId}`, credentials);
    }
}
