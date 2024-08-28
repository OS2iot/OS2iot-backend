import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ListAllChirpstackApplicationsResponseDto } from "@dto/chirpstack/list-all-applications-response.dto";
import { Metadata, ServiceError, credentials } from "@grpc/grpc-js";
import configuration from "@config/configuration";
import { TenantServiceClient } from "@chirpstack/chirpstack-api/api/tenant_grpc_pb";
import { ListTenantsRequest, ListTenantsResponse } from "@chirpstack/chirpstack-api/api/tenant_pb";
import { ApplicationServiceClient } from "@chirpstack/chirpstack-api/api/application_grpc_pb";
import { ListApplicationsRequest, ListApplicationsResponse } from "@chirpstack/chirpstack-api/api/application_pb";
import { ChirpstackApplicationResponseDto } from "@dto/chirpstack/chirpstack-application-response.dto";
import { IdResponse } from "@interfaces/chirpstack-id-response.interface";
import { DeviceServiceClient } from "@chirpstack/chirpstack-api/api/device_grpc_pb";
import { GatewayServiceClient } from "@chirpstack/chirpstack-api/api/gateway_grpc_pb";
import { DeviceProfileServiceClient } from "@chirpstack/chirpstack-api/api/device_profile_grpc_pb";
import { MulticastGroupServiceClient } from "@chirpstack/chirpstack-api/api/multicast_group_grpc_pb";

@Injectable()
export class GenericChirpstackConfigurationService {
  baseUrlGRPC = `${configuration()["chirpstack"]["hostname"]}:${configuration()["chirpstack"]["port"]}`;

  private readonly innerLogger = new Logger(GenericChirpstackConfigurationService.name);
  protected applicationServiceClient = new ApplicationServiceClient(this.baseUrlGRPC, credentials.createInsecure());
  protected deviceServiceClient = new DeviceServiceClient(this.baseUrlGRPC, credentials.createInsecure());
  protected gatewayClient = new GatewayServiceClient(this.baseUrlGRPC, credentials.createInsecure());
  protected deviceProfileClient = new DeviceProfileServiceClient(this.baseUrlGRPC, credentials.createInsecure());
  protected multicastServiceClient = new MulticastGroupServiceClient(this.baseUrlGRPC, credentials.createInsecure());
  protected readonly ORG_ID_KEY = "internalOrganizationId";
  protected readonly UPDATED_BY_KEY = "os2iot-updated-by";
  protected readonly CREATED_BY_KEY = "os2iot-created-by";

  makeMetadataHeader(): Metadata {
    const metadata = new Metadata();
    metadata.set("authorization", "Bearer " + configuration()["chirpstack"]["apikey"]);
    return metadata;
  }

  async post(logName: string, client: any, request: any): Promise<IdResponse> {
    const metaData = this.makeMetadataHeader();
    const createPromise = new Promise<IdResponse>((resolve, reject) => {
      client.create(request, metaData, (err: ServiceError, resp: any) => {
        if (err) {
          reject(err);
        } else {
          this.innerLogger.debug(`post:${logName} success`);
          resolve(resp.toObject());
        }
      });
    });
    try {
      return await createPromise;
    } catch (err) {
      this.innerLogger.error(`POST ${logName} got error: ${err}`);
      throw new BadRequestException();
    }
  }

  async put(logName: string, client: any, request: any): Promise<void> {
    const metaData = this.makeMetadataHeader();
    const updatePromise = new Promise<void>((resolve, reject) => {
      client.update(request, metaData, (err: ServiceError, resp: any) => {
        if (err) {
          reject(err);
        } else {
          this.innerLogger.debug(`update :${logName} success`);
          resolve(resp);
        }
      });
    });
    try {
      await updatePromise;
      return;
    } catch (err) {
      this.innerLogger.error(`UPDATE ${logName} got error: ${err}`);
      throw new BadRequestException();
    }
  }

  async getOneById<T>(logName: string, id: string, client: any, request: any): Promise<T> {
    const metaData = this.makeMetadataHeader();
    request.setId(id);
    const getPromise = new Promise<T>((resolve, reject) => {
      client.get(request, metaData, (err: ServiceError, resp: any) => {
        if (err) {
          reject(err);
        } else {
          this.innerLogger.debug(`get from:${logName} success`);
          resolve(resp);
        }
      });
    });
    try {
      return await getPromise;
    } catch (err) {
      this.innerLogger.error(`GET ${logName} got error: ${err}`);
      throw new NotFoundException();
    }
  }

  async delete<T>(logName: string, client: any, request: any): Promise<void> {
    if (client) {
      const metaData = this.makeMetadataHeader();
      const deletePromise = new Promise<T>((resolve, reject) => {
        client.delete(request, metaData, (err: ServiceError, resp: any) => {
          if (err) {
            reject(err);
          } else {
            this.innerLogger.debug(`delete :${logName} success`);
            resolve(resp);
          }
        });
      });
      try {
        await deletePromise;
        return;
      } catch (err) {
        this.innerLogger.error(`DELETE ${logName} got error: ${err}`);
        throw new BadRequestException();
      }
    }
  }

  async get<T>(logName: string, client: any, request: any): Promise<T> {
    const metaData = this.makeMetadataHeader();
    const getPromise = new Promise<T>((resolve, reject) => {
      client.get(request, metaData, (err: ServiceError, resp: any) => {
        if (err) {
          reject(err);
        } else {
          this.innerLogger.debug(`get from:${logName} success`);
          resolve(resp);
        }
      });
    });
    try {
      return await getPromise;
    } catch (err) {
      this.innerLogger.error(`GET ${logName} got error: ${err}`);
      throw new NotFoundException();
    }
  }

  async getAllApplicationsWithPagination(tenantID: string): Promise<ListAllChirpstackApplicationsResponseDto> {
    const req = new ListApplicationsRequest();
    req.setTenantId(await this.getDefaultOrganizationId());

    const result = await this.getAllWithPagination<ListApplicationsResponse.AsObject>(
      `applications?limit=100&organizationID=${tenantID}`,
      this.applicationServiceClient,
      req,
      100,
      undefined
    );
    const chirpstackApplicationResponseDto: ChirpstackApplicationResponseDto[] = [];
    result.resultList.map(e => {
      const resultItem: ChirpstackApplicationResponseDto = {
        name: e.name,
        description: e.description,
        id: e.id,
        tenantId: tenantID,
      };
      chirpstackApplicationResponseDto.push(resultItem);
    });
    return {
      totalCount: result.totalCount,
      resultList: chirpstackApplicationResponseDto,
    };
  }

  async getAllWithPagination<T>(
    logName: string,
    client: any,
    request: any,
    limit?: number,
    offset?: number
  ): Promise<T> {
    const metaData = this.makeMetadataHeader();
    request.setLimit(limit);
    request.setOffset(offset);

    const getListPromise = new Promise<T>((resolve, reject) => {
      client.list(request, metaData, (err: ServiceError, resp: any) => {
        if (err) {
          reject(err);
        } else {
          const result = resp.toObject();
          resolve(result);
          this.innerLogger.debug(`get all from:${logName} success`);
        }
      });
    });
    try {
      return await getListPromise;
    } catch (err) {
      this.innerLogger.error(`GET ALL ${logName} got error: ${JSON.stringify(err)}`);
      throw new NotFoundException();
    }
  }

  public async getTenants(limit?: number, offset?: number): Promise<ListTenantsResponse.AsObject> {
    const tenantClient = new TenantServiceClient(this.baseUrlGRPC, credentials.createInsecure());
    const req = new ListTenantsRequest();

    const res = await this.getAllWithPagination<ListTenantsResponse.AsObject>(
      "organizations",
      tenantClient,
      req,
      limit,
      offset
    );
    return res;
  }

  public async getDefaultOrganizationId(): Promise<string> {
    let id = null;
    await this.getTenants(1000, 0).then(response => {
      response.resultList.forEach(element => {
        if (element.name.toLowerCase() == "os2iot" || element.name.toLowerCase() == "chirpstack") {
          id = element.id;
        }
      });
    });
    if (id) {
      return id;
    }
    throw new InternalServerErrorException(
      "Could not find any Organization in Chirpstack named: 'OS2iot' or 'chirpstack'"
    );
  }
}
