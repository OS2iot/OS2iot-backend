import { Injectable } from "@nestjs/common";
import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import {
    Application,
    CreateApplicationRequest,
    DeleteApplicationRequest,
    ListApplicationsRequest,
    UpdateApplicationRequest,
} from "@chirpstack/chirpstack-api/api/application_pb";
import { CreateApplicationDto } from "@dto/create-application.dto";
import { IdResponse } from "@interfaces/chirpstack-id-response.interface";
import { Application as DbApplication } from "@entities/application.entity";
import { ListAllChirpstackApplicationsResponseDto } from "@dto/chirpstack/list-all-applications-response.dto";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { CreateChirpstackApplicationDto } from "@dto/chirpstack/create-chirpstack-application.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class ApplicationChirpstackService extends GenericChirpstackConfigurationService {
    @InjectRepository(DbApplication)
    private applicationRepository: Repository<DbApplication>;
    constructor() {
        super();
    }
    applicationNamePrefix = "os2iot-";
    DEFAULT_DESCRIPTION = "Created by OS2IoT";

    public async findOrCreateDefaultApplication(
        applications: ListAllChirpstackApplicationsResponseDto = null,
        iotDevice: LoRaWANDevice
    ): Promise<string> {
        const organizationID = await this.getDefaultOrganizationId();
        const req = new ListApplicationsRequest();
        req.setTenantId(organizationID);
        // Fetch applications
        applications =
            applications ??
            (await this.getAllWithPagination<ListAllChirpstackApplicationsResponseDto>(
                `applications?limit=100&organizationID=${organizationID}`,
                100,
                undefined,
                this.applicationServiceClient
            ));

        // if application exist use it
        let applicationId = applications.resultList.find(
            element =>
                element.id === iotDevice.chirpstackApplicationId || element.id === iotDevice.application.chirpstackId
        )?.id;

        // otherwise create new application
        if (!applicationId) {
            applicationId = await this.createNewApplication(
                applicationId,
                iotDevice.application.name,
                iotDevice.application.id
            );
        }

        return applicationId;
    }

    public async createNewApplication(applicationId: string, name: string, id: number) {
        applicationId = await this.createChirpstackApplication({
            application: {
                name: `${this.applicationNamePrefix}${name}`,
                description: this.DEFAULT_DESCRIPTION,
            },
        });
        const existingApplication = await this.applicationRepository.findOneOrFail({
            where: { id: id },
        });
        existingApplication.chirpstackId = applicationId;
        await this.applicationRepository.save(existingApplication);
        return applicationId;
    }

    public async createChirpstackApplication(dto: CreateChirpstackApplicationDto): Promise<string> {
        const req = new CreateApplicationRequest();
        const application = new Application();
        application.setDescription(dto.application.description);
        application.setName(dto.application.name);
        application.setTenantId(await this.getDefaultOrganizationId());

        req.setApplication(application);
        const applicationIdObject: IdResponse = await this.post("applications", this.applicationServiceClient, req);
        return applicationIdObject.id;
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
        application.setName(this.applicationNamePrefix + "-" + dto.name);
        application.setTenantId(await this.getDefaultOrganizationId());
        req.setApplication(application);
        try {
            return await this.put("applications", this.applicationServiceClient, req);
        } catch (e) {
            throw e;
        }
    }
}
