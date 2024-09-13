import { Injectable } from "@nestjs/common";
import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import {
  Application as ChirpstackApplication,
  CreateApplicationRequest,
  DeleteApplicationRequest,
  ListApplicationsRequest,
  UpdateApplicationRequest,
} from "@chirpstack/chirpstack-api/api/application_pb";
import { IdResponse } from "@interfaces/chirpstack-id-response.interface";
import { Application } from "@entities/application.entity";
import { ListAllChirpstackApplicationsResponseDto } from "@dto/chirpstack/list-all-applications-response.dto";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { CreateChirpstackApplicationDto } from "@dto/chirpstack/create-chirpstack-application.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class ApplicationChirpstackService extends GenericChirpstackConfigurationService {
  @InjectRepository(Application)
  private applicationRepository: Repository<Application>;
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
        this.applicationServiceClient,
        req,
        100,
        undefined
      ));

    // if application exist use it
    let applicationId = applications.resultList.find(
      element => element.id === iotDevice.chirpstackApplicationId || element.id === iotDevice.application.chirpstackId
    )?.id;

    // otherwise create new application
    if (!applicationId) {
      applicationId = await this.createNewApplication(iotDevice.application.name, iotDevice.application.id);
    }

    return applicationId;
  }

  public async createNewApplication(name: string, id: number) {
    const applicationId = await this.createChirpstackApplication({
      application: {
        name: `${name}`,
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
    const application = new ChirpstackApplication();
    application.setDescription(dto.application.description ? dto.application.description : this.DEFAULT_DESCRIPTION);
    application.setName(this.applicationNamePrefix + dto.application.name);
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
  public async updateApplication(dto: Application): Promise<void> {
    if (!dto.chirpstackId) {
      return;
    }

    const req = new UpdateApplicationRequest();
    const application = new ChirpstackApplication();
    application.setId(dto.chirpstackId);
    application.setDescription(dto.description ? dto.description : this.DEFAULT_DESCRIPTION);
    application.setName(this.applicationNamePrefix + dto.name);
    application.setTenantId(await this.getDefaultOrganizationId());
    application.getTagsMap().set(this.ORG_ID_KEY, dto.belongsTo.id.toString());
    req.setApplication(application);
    try {
      await this.put("applications", this.applicationServiceClient, req);
    } catch (e) {
      throw e;
    }
  }
}
