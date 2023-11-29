import { BadRequestException, Injectable } from "@nestjs/common";
import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";

import {
    Application,
    CreateApplicationRequest,
    DeleteApplicationRequest,
    UpdateApplicationRequest,
} from "@chirpstack/chirpstack-api/api/application_pb";
import { CreateApplicationDto } from "@dto/create-application.dto";
import { PostReturnInterface } from "@interfaces/chirpstack-post-return.interface";
import { Application as DbApplication } from "@entities/application.entity";

@Injectable()
export class ApplicationChirpstackService extends GenericChirpstackConfigurationService {
    constructor() {
        super();
    }
    defaultApplicationName = "os2iot";
    DEFAULT_DESCRIPTION = "Created by OS2IoT";
    public async createApplication(dto: CreateApplicationDto): Promise<PostReturnInterface> {
        const req = new CreateApplicationRequest();
        const application = new Application();
        application.setDescription(this.DEFAULT_DESCRIPTION);
        application.setName(this.defaultApplicationName + "-" + dto.name);
        application.setTenantId(await this.getDefaultOrganizationId());

        req.setApplication(application);
        try {
            return await this.post("applications", this.applicationServiceClient, req);
        } catch (e) {
            throw e;
        }
    }
    public async deleteApplication(id: string): Promise<void> {
        const req = new DeleteApplicationRequest();
        req.setId(id);
        try {
            return await this.delete("applications", this.applicationServiceClient, req);
        } catch (e) {
            throw e;
        }
    }
    public async updateApplication(dto: DbApplication): Promise<void> {
        const req = new UpdateApplicationRequest();
        const application = new Application();
        application.setId(dto.chirpstackId);
        application.setDescription(this.DEFAULT_DESCRIPTION);
        application.setName(this.defaultApplicationName + "-" + dto.name);
        application.setTenantId(await this.getDefaultOrganizationId());
        req.setApplication(application);
        try {
            return await this.put("applications", this.applicationServiceClient, req);
        } catch (e) {
            throw e;
        }
    }
}
