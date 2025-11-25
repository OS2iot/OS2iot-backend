import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateDeviceProfileDto } from "@dto/chirpstack/create-device-profile.dto";
import {
  DeviceProfileListDto,
  ListAllDeviceProfilesResponseDto,
} from "@dto/chirpstack/list-all-device-profiles-response.dto";
import { GenericChirpstackConfigurationService } from "./generic-chirpstack-configuration.service";
import { UpdateDeviceProfileDto } from "@dto/chirpstack/update-device-profile.dto";
import { DeviceProfileDto } from "@dto/chirpstack/device-profile.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ErrorCodes } from "@enum/error-codes.enum";
import { checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";
import { ServiceError } from "@grpc/grpc-js";
import {
  CreateDeviceProfileRequest,
  DeleteDeviceProfileRequest,
  DeviceProfile,
  GetDeviceProfileRequest,
  GetDeviceProfileResponse,
  ListDeviceProfileAdrAlgorithmsResponse,
  ListDeviceProfilesRequest,
  ListDeviceProfilesResponse,
  UpdateDeviceProfileRequest,
} from "@chirpstack/chirpstack-api/api/device_profile_pb";
import { timestampToDate } from "@helpers/date.helper";
import { ListAllAdrAlgorithmsResponseDto } from "@dto/chirpstack/list-all-adr-algorithms-response.dto";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { AdrAlgorithmDto } from "@dto/chirpstack/adr-algorithm.dto";
import { IdResponse } from "@interfaces/chirpstack-id-response.interface";
import { DeviceListItem, ListDevicesRequest, ListDevicesResponse } from "@chirpstack/chirpstack-api/api/device_pb";
import { ListApplicationsRequest, ListApplicationsResponse } from "@chirpstack/chirpstack-api/api/application_pb";
import * as BluebirdPromise from "bluebird";

@Injectable()
export class DeviceProfileService extends GenericChirpstackConfigurationService {
  public async createDeviceProfile(dto: CreateDeviceProfileDto, userId: number): Promise<IdResponse> {
    if (await this.isNameInUse(dto.deviceProfile.name)) {
      throw new BadRequestException(ErrorCodes.NameInvalidOrAlreadyInUse);
    }
    dto.deviceProfile = await this.updateDto(dto.deviceProfile);
    dto.deviceProfile.tags = this.addOrganizationToTags(dto);
    dto.deviceProfile.tags = this.addUserIdToTags(dto, userId);

    const req = new CreateDeviceProfileRequest();

    const deviceProfile = this.mapToChirpstackDto(dto, true);

    Object.entries(dto.deviceProfile.tags).forEach(([key, value]) => {
      deviceProfile.getTagsMap().set(key, value.toString());
    });

    req.setDeviceProfile(deviceProfile);
    const result: IdResponse = await this.post("device-profiles", this.deviceProfileClient, req);
    return result;
  }

  private addOrganizationToTags(dto: CreateDeviceProfileDto): { [id: string]: string } {
    const tags = dto.deviceProfile?.tags != null ? dto.deviceProfile.tags : {};
    tags[this.ORG_ID_KEY] = `${dto.internalOrganizationId}`;
    return tags;
  }

  private addUserIdToTags(dto: CreateDeviceProfileDto, userId: number): { [id: string]: string } {
    const tags = dto.deviceProfile?.tags != null ? dto.deviceProfile.tags : {};
    tags[this.CREATED_BY_KEY] = `${userId}`;
    tags[this.UPDATED_BY_KEY] = `${userId}`;
    return tags;
  }

  public async updateDeviceProfile(data: UpdateDeviceProfileDto, id: string, req: AuthenticatedRequest): Promise<void> {
    if (await this.isNameInUse(data.deviceProfile.name, id)) {
      throw new BadRequestException(ErrorCodes.NameInvalidOrAlreadyInUse);
    }
    const deviceProfile = this.mapToChirpstackDto(data);
    const request = new UpdateDeviceProfileRequest();

    data.deviceProfile = await this.updateDto(data.deviceProfile);

    //Have to set these everytime, otherwise they will be erased.
    deviceProfile.getTagsMap().set(this.ORG_ID_KEY, data.deviceProfile.internalOrganizationId.toString());
    deviceProfile.getTagsMap().set(this.UPDATED_BY_KEY, data.deviceProfile.updatedBy.toString());
    deviceProfile.getTagsMap().set(this.CREATED_BY_KEY, data.deviceProfile.createdBy.toString());

    checkIfUserHasAccessToOrganization(
      req,
      data.deviceProfile.internalOrganizationId,
      OrganizationAccessScope.ApplicationWrite
    );

    request.setDeviceProfile(deviceProfile);
    return await this.put("device-profiles", this.deviceProfileClient, request);
  }

  private async isNameInUse(name: string, id?: string): Promise<boolean> {
    const deviceProfiles = await this.findAllDeviceProfiles(1000, 0);
    return deviceProfiles.result
      .filter(x => (id ? x.id != id : true))
      .some(x => x.name.toLocaleLowerCase() == name.toLocaleLowerCase());
  }

  public async deleteDeviceProfile(id: string, req: AuthenticatedRequest): Promise<void> {
    const getReq = new GetDeviceProfileRequest();
    const result = await this.getOneById<GetDeviceProfileResponse>(
      "device-profiles",
      id,
      this.deviceProfileClient,
      getReq
    );
    const deviceProfileId = result.getDeviceProfile().getId();
    const listReq = new ListDevicesRequest();
    const listAppReq = new ListApplicationsRequest();
    listAppReq.setTenantId(await this.getDefaultOrganizationId());

    const applications = await this.getAllWithPagination<ListApplicationsResponse.AsObject>(
      "devices",
      this.applicationServiceClient,
      listAppReq,
      1000,
      0
    );

    let devices: DeviceListItem.AsObject[] = [];
    for (let index = 0; index < applications.resultList.length; index++) {
      listReq.setApplicationId(applications.resultList[index].id);
      const devicesForApp = await this.getAllWithPagination<ListDevicesResponse.AsObject>(
        "devices",
        this.deviceServiceClient,
        listReq,
        10000,
        0
      );
      devices = devices.concat(devicesForApp.resultList);
    }

    const match = devices.find(e => e.deviceProfileId === deviceProfileId);
    if (match) {
      throw new ConflictException(ErrorCodes.DeleteNotAllowedHasLoRaWANDevices);
    }

    if (result.getDeviceProfile().getTagsMap().get(this.ORG_ID_KEY) != null) {
      checkIfUserHasAccessToOrganization(
        req,
        +result.getDeviceProfile().getTagsMap().get(this.ORG_ID_KEY),
        OrganizationAccessScope.ApplicationWrite
      );
    }
    const deleteReq = new DeleteDeviceProfileRequest();
    deleteReq.setId(result.getDeviceProfile().getId());
    return await this.delete("device-profiles", this.deviceProfileClient, deleteReq);
  }

  public async findAllDeviceProfiles(limit?: number, offset?: number): Promise<ListAllDeviceProfilesResponseDto> {
    const req = new ListDeviceProfilesRequest();
    req.setTenantId(await this.getDefaultOrganizationId());

    const result = await this.getAllWithPagination<ListDeviceProfilesResponse.AsObject>(
      "device-profiles",
      this.deviceProfileClient,
      req,
      limit,
      offset
    );

    const deviceResultListDto: DeviceProfileListDto[] = result.resultList.map(e => {
      return {
        name: e.name,
        createdAt: timestampToDate(e.createdAt),
        updatedAt: timestampToDate(e.updatedAt),
        id: e.id,
      };
    });
    const deviceProfileList: ListAllDeviceProfilesResponseDto = {
      totalCount: result.totalCount.toString(),
      result: deviceResultListDto,
    };

    await BluebirdPromise.all(
      BluebirdPromise.map(
        deviceProfileList.result,
        async x => {
          const dp = await this.findOneDeviceProfileById(x.id);
          x.internalOrganizationId = +dp.deviceProfile.internalOrganizationId;
          x.createdBy = +dp.deviceProfile.createdBy;
          x.updatedBy = +dp.deviceProfile.updatedBy;
        },
        { concurrency: 20 }
      )
    );

    return deviceProfileList;
  }

  public async findOneDeviceProfileById(id: string): Promise<CreateDeviceProfileDto> {
    const req = new GetDeviceProfileRequest();
    req.setId(id);
    try {
      const result = await this.getOneById<GetDeviceProfileResponse>(
        "device-profiles",
        id,
        this.deviceProfileClient,
        req
      );
      const deviceProfileObject = this.mapSingleDeviceProfileResponse(result);

      return deviceProfileObject;
    } catch (err) {
      throw new InternalServerErrorException("Could not get device profile");
    }
  }

  public async updateDto(dto: DeviceProfileDto): Promise<DeviceProfileDto> {
    dto.organizationID = await this.getDefaultOrganizationId();

    return dto;
  }

  private mapSingleDeviceProfileResponse(result: GetDeviceProfileResponse): CreateDeviceProfileDto {
    const responseObject = result.getDeviceProfile().toObject();
    const deviceProfileMapped = this.mapDeviceInfoContent(responseObject);
    const deviceProfileResponseObject: CreateDeviceProfileDto = {
      deviceProfile: deviceProfileMapped,
      createdAt: result.getCreatedAt().toDate(),
      updatedAt: result.getUpdatedAt().toDate(),
      internalOrganizationId: +result.getDeviceProfile().getTagsMap().get(this.ORG_ID_KEY),
    };

    deviceProfileResponseObject.deviceProfile.internalOrganizationId = +result
      .getDeviceProfile()
      .getTagsMap()
      .get(this.ORG_ID_KEY);
    deviceProfileResponseObject.deviceProfile.createdBy = +result
      .getDeviceProfile()
      .getTagsMap()
      .get(this.CREATED_BY_KEY);
    deviceProfileResponseObject.deviceProfile.updatedBy = +result
      .getDeviceProfile()
      .getTagsMap()
      .get(this.UPDATED_BY_KEY);

    deviceProfileResponseObject.deviceProfile.tagsMap = deviceProfileResponseObject.deviceProfile.tagsMap.filter(
      ([key]) => {
        return key !== this.ORG_ID_KEY && key !== this.CREATED_BY_KEY && key !== this.UPDATED_BY_KEY;
      }
    );
    return deviceProfileResponseObject;
  }

  private mapDeviceInfoContent(devProfile: DeviceProfile.AsObject) {
    const deviceProfileMapped: DeviceProfileDto = {
      name: devProfile.name,
      id: devProfile.id,
      adrAlgorithmID: devProfile.adrAlgorithmId,
      macVersion: devProfile.macVersion,
      regParamsRevision: devProfile.regParamsRevision,
      classBTimeout: devProfile.classBTimeout,
      classCTimeout: devProfile.classCTimeout,
      pingSlotDR: devProfile.classBPingSlotDr,
      pingSlotFreq: devProfile.classBPingSlotFreq,
      pingSlotPeriod: devProfile.classBPingSlotNbK,
      rfRegion: "EU868",
      rxDROffset1: devProfile.abpRx1DrOffset,
      rxDataRate2: devProfile.abpRx2Dr,
      rxDelay1: devProfile.abpRx1Delay,
      rxFreq2: devProfile.abpRx2Freq,
      supportsClassB: devProfile.supportsClassB,
      supportsClassC: devProfile.supportsClassC,
      supportsJoin: devProfile.supportsOtaa,
      tagsMap: devProfile.tagsMap,
      devStatusReqFreq: devProfile.deviceStatusReqInterval,
    };
    return deviceProfileMapped;
  }

  mapToChirpstackDto(data: CreateDeviceProfileDto | UpdateDeviceProfileDto, isCreate?: boolean) {
    const deviceProfile = new DeviceProfile();
    deviceProfile.setName(data.deviceProfile.name);
    deviceProfile.setMacVersion(data.deviceProfile.macVersion);
    deviceProfile.setRegParamsRevision(data.deviceProfile.regParamsRevision);
    deviceProfile.setAdrAlgorithmId(data.deviceProfile.adrAlgorithmID);
    deviceProfile.setClassBTimeout(data.deviceProfile.classBTimeout);
    deviceProfile.setClassCTimeout(data.deviceProfile.classCTimeout);
    deviceProfile.setId(data.deviceProfile.id);
    deviceProfile.setClassBPingSlotDr(data.deviceProfile.pingSlotDR);
    deviceProfile.setClassBPingSlotFreq(data.deviceProfile.pingSlotFreq);
    deviceProfile.setClassBPingSlotNbK(data.deviceProfile.pingSlotPeriod);
    //region 0 = EU868
    deviceProfile.setRegion(0);
    deviceProfile.setAbpRx1DrOffset(data.deviceProfile.rxDROffset1);
    deviceProfile.setAbpRx2Dr(data.deviceProfile.rxDataRate2);
    deviceProfile.setAbpRx1Delay(data.deviceProfile.rxDelay1);
    deviceProfile.setAbpRx2Freq(data.deviceProfile.rxFreq2);
    deviceProfile.setSupportsClassB(data.deviceProfile.supportsClassB);
    deviceProfile.setSupportsClassC(data.deviceProfile.supportsClassC);
    deviceProfile.setSupportsOtaa(data.deviceProfile.supportsJoin);
    deviceProfile.setDeviceStatusReqInterval(
      data.deviceProfile.devStatusReqFreq === undefined ? 1 : data.deviceProfile.devStatusReqFreq
    );

    isCreate ? deviceProfile.setTenantId(data.deviceProfile.organizationID) : {};

    return deviceProfile;
  }

  public async getAdrAlgorithmsForChirpstack(): Promise<ListAllAdrAlgorithmsResponseDto> {
    const result = await this.getAdrAlgorithms();

    const adrAlgoritmList: AdrAlgorithmDto[] = result.getResultList().map(e => {
      return {
        id: e.getId(),
        name: e.getName(),
      };
    });

    return {
      adrAlgorithms: adrAlgoritmList,
    };
  }

  async getAdrAlgorithms(): Promise<ListDeviceProfileAdrAlgorithmsResponse> {
    const metaData = this.makeMetadataHeader();
    const getPromise = new Promise<ListDeviceProfileAdrAlgorithmsResponse>((resolve, reject) => {
      this.deviceProfileClient.listAdrAlgorithms(new Empty(), metaData, (err: ServiceError, resp: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
    try {
      return await getPromise;
    } catch (err) {
      throw new NotFoundException();
    }
  }
}
