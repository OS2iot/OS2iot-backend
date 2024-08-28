import { SigFoxApiGroupsResponse } from "@dto/sigfox/external/sigfox-api-groups-response.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { Injectable } from "@nestjs/common";
import { GenericSigfoxAdministationService } from "@services/sigfox/generic-sigfox-administation.service";

@Injectable()
export class SigfoxApiGroupService {
  constructor(private genericService: GenericSigfoxAdministationService) {}

  private readonly BASE_URL = "groups";

  async getGroups(credentials: SigFoxGroup): Promise<SigFoxApiGroupsResponse> {
    return await this.genericService.get(`${this.BASE_URL}`, credentials);
  }
}
