import {
    BadRequestException,
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
import {
    checkIfUserHasAccessToOrganization,
    OrganizationAccessScope,
} from "@helpers/security-helper";
import { DeviceProfileServiceClient } from "@chirpstack/chirpstack-api/api/device_profile_grpc_pb";
import { credentials, ServiceError } from "@grpc/grpc-js";
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
import { PostReturnInterface } from "@interfaces/chirpstack-post-return.interface";

@Injectable()
export class DeviceProfileService extends GenericChirpstackConfigurationService {
    private readonly ORG_ID_KEY = "internalOrganizationId";
    private readonly UPDATED_BY_KEY = "os2iot-updated-by";
    private readonly CREATED_BY_KEY = "os2iot-created-by";

    private deviceProfileClient = new DeviceProfileServiceClient(
        this.baseUrlGRPC,
        credentials.createInsecure()
    );
    public async createDeviceProfile(
        dto: CreateDeviceProfileDto,
        userId: number
    ): Promise<PostReturnInterface> {
        if (await this.isNameInUse(dto.deviceProfile.name)) {
            throw new BadRequestException(ErrorCodes.NameInvalidOrAlreadyInUse);
        }
        dto.deviceProfile = await this.updateDto(dto.deviceProfile);
        dto.deviceProfile.tags = this.addOrganizationToTags(dto);
        dto.deviceProfile.tags = this.addUserIdToTags(dto, userId);

        const deviceProfile = new DeviceProfile();
        const req = new CreateDeviceProfileRequest();

        Object.entries(dto.deviceProfile.tags).forEach(([key, value]) => {
            deviceProfile.getTagsMap().set(key, value);
        });

        this.mapToChirpstackDto(deviceProfile, dto, true);

        req.setDeviceProfile(deviceProfile);
        const result: PostReturnInterface = await this.post("device-profiles", this.deviceProfileClient, req);
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

    public async updateDeviceProfile(
        data: UpdateDeviceProfileDto,
        id: string,
        req: AuthenticatedRequest
    ): Promise<void> {
        if (await this.isNameInUse(data.deviceProfile.name, id)) {
            throw new BadRequestException(ErrorCodes.NameInvalidOrAlreadyInUse);
        }
        const deviceProfile = new DeviceProfile();
        const request = new UpdateDeviceProfileRequest();
        this.mapToChirpstackDto(deviceProfile, data);

        data.deviceProfile.tags = await this.updateTags(id, req);
        data.deviceProfile = await this.updateDto(data.deviceProfile);
        Object.entries(data.deviceProfile.tags).forEach(([key, value]) => {
            deviceProfile.getTagsMap().set(key, value);
        });
        request.setDeviceProfile(deviceProfile);
        return await this.put("device-profiles", this.deviceProfileClient, request);
    }

    private async isNameInUse(name: string, id?: string): Promise<boolean> {
        const deviceProfiles = await this.findAllDeviceProfiles(1000, 0);
        return deviceProfiles.result
            .filter(x => (id ? x.id != id : true))
            .some(x => x.name.toLocaleLowerCase() == name.toLocaleLowerCase());
    }

    private async updateTags(
        deviceProfileId: string,
        req: AuthenticatedRequest
    ): Promise<{ [id: string]: string }> {
        const request = new GetDeviceProfileRequest();
        const result = await this.getOneById<GetDeviceProfileResponse>(
            "device-profiles",
            deviceProfileId,
            this.deviceProfileClient,
            request
        );
        const tags = result.getDeviceProfile().getTagsMap();
        tags.set(this.UPDATED_BY_KEY, req.user.userId.toString());
        if (result.getDeviceProfile().getTagsMap().get(this.ORG_ID_KEY) != null) {
            checkIfUserHasAccessToOrganization(
                req,
                +result.getDeviceProfile().getTagsMap().get(this.ORG_ID_KEY),
                OrganizationAccessScope.ApplicationWrite
            );
        }
        const tagsObject: { [id: string]: string } = {};
        tags.forEach((value, key) => {
            tagsObject[key] = value;
        });

        return tagsObject;
    }

    public async deleteDeviceProfile(id: string, req: AuthenticatedRequest): Promise<void> {
        const getReq = new GetDeviceProfileRequest();
        const result = await this.getOneById<GetDeviceProfileResponse>(
            "device-profiles",
            id,
            this.deviceProfileClient,
            getReq
        );
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

    public async findAllDeviceProfiles(
        limit?: number,
        offset?: number
    ): Promise<ListAllDeviceProfilesResponseDto> {
        const req = new ListDeviceProfilesRequest();
        req.setTenantId(await this.getDefaultOrganizationId());

        const result = await this.getAllWithPagination<ListDeviceProfilesResponse.AsObject>(
            "device-profiles",
            limit,
            offset,
            this.deviceProfileClient,
            req
        );
        const deviceResultListDto: DeviceProfileListDto[] = [];
        result.resultList.map(e => {
            const resultItem: DeviceProfileListDto = {
                name: e.name,
                createdAt: timestampToDate(e.createdAt),
                updatedAt: timestampToDate(e.updatedAt),
                id: e.id,
            };
            deviceResultListDto.push(resultItem);
        });
        const deviceProfileList: ListAllDeviceProfilesResponseDto = {
            totalCount: result.totalCount.toString(),
            result: deviceResultListDto,
        };

        await Promise.all(
            deviceProfileList.result.map(async x => {
                const dp = await this.findOneDeviceProfileById(x.id);
                x.internalOrganizationId = +dp.deviceProfile.internalOrganizationId;
                x.createdBy = +dp.deviceProfile.createdBy;
                x.updatedBy = +dp.deviceProfile.updatedBy;
            })
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

    private mapSingleDeviceProfileResponse(
        result: GetDeviceProfileResponse
    ): CreateDeviceProfileDto {
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
                return (
                    key !== this.ORG_ID_KEY &&
                    key !== this.CREATED_BY_KEY &&
                    key !== this.UPDATED_BY_KEY
                );
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

    mapToChirpstackDto(
        deviceProfile: DeviceProfile,
        data: CreateDeviceProfileDto | UpdateDeviceProfileDto,
        isCreate?: boolean
    ) {
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
        deviceProfile.setDeviceStatusReqInterval(data.deviceProfile.devStatusReqFreq === undefined ? 1 : data.deviceProfile.devStatusReqFreq);

        isCreate ? deviceProfile.setTenantId(data.deviceProfile.organizationID) : {};
    }

    public async getAdrAlgorithmsForChirpstack(): Promise<ListAllAdrAlgorithmsResponseDto> {
        const result = await this.getAdrAlgorithms();

        const adrAlgoritmList: AdrAlgorithmDto[] = [];
        result.getResultList().map(e => {
            const resultItem: AdrAlgorithmDto = {
                id: e.getId(),
                name: e.getName(),
            };
            adrAlgoritmList.push(resultItem);
        });

        return {
            adrAlgorithms: adrAlgoritmList,
        };
    }

    async getAdrAlgorithms(): Promise<ListDeviceProfileAdrAlgorithmsResponse> {
        const metaData = await this.makeMetadataHeader();
        const getPromise = new Promise<ListDeviceProfileAdrAlgorithmsResponse>(
            (resolve, reject) => {
                this.deviceProfileClient.listAdrAlgorithms(
                    new Empty(),
                    metaData,
                    (err: ServiceError, resp: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(resp);
                        }
                    }
                );
            }
        );
        try {
            return await getPromise;
        } catch (err) {
            throw new NotFoundException();
        }
    }
}
