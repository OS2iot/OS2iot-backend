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
import {
    ListApplicationsRequest,
    ListApplicationsResponse,
} from "@chirpstack/chirpstack-api/api/application_pb";
import { ChirpstackApplicationResponseDto } from "@dto/chirpstack/chirpstack-application-response.dto";
import { PostReturnInterface } from "@interfaces/chirpstack-post-return.interface";

@Injectable()
export class GenericChirpstackConfigurationService {
    baseUrlGRPC = `${process.env.CHIRPSTACK_HOSTNAME || "localhost"}:${
        process.env.CHIRPSTACK_PORT || "8080"
    }`;

    private readonly innerLogger = new Logger(GenericChirpstackConfigurationService.name);
    protected applicationServiceClient = new ApplicationServiceClient(
        this.baseUrlGRPC,
        credentials.createInsecure()
    );

    makeMetadataHeader(): Metadata {
        const metadata = new Metadata();
        metadata.set(
            "authorization",
            "Bearer " + configuration()["chirpstack"]["apikey"],
        );
        return metadata;
    }

    async post(endpoint: string, client?: any, request?: any): Promise<PostReturnInterface> {
        const metaData = this.makeMetadataHeader();
        const createPromise = new Promise<PostReturnInterface>((resolve, reject) => {
            client.create(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.innerLogger.debug(`post:${endpoint} success`);
                    resolve(resp.toObject());
                }
            });
        });
        try {
            return await createPromise;
        } catch (err) {
            this.innerLogger.error(`POST ${endpoint} got error: ${err}`);
            throw new BadRequestException();
        }
    }
    async put(endpoint: string, client?: any, request?: any): Promise<void> {
        const metaData = this.makeMetadataHeader();
        const updatePromise = new Promise<void>((resolve, reject) => {
            client.update(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.innerLogger.debug(`update :${endpoint} success`);
                    resolve(resp);
                }
            });
        });
        try {
            await updatePromise;
            return;
        } catch (err) {
            this.innerLogger.error(`UPDATE ${endpoint} got error: ${err}`);
            throw new BadRequestException();
        }
    }

    async getOneById<T>(endpoint: string, id: string, client?: any, request?: any): Promise<T> {
        const metaData = this.makeMetadataHeader();
        request.setId(id);
        const getPromise = new Promise<T>((resolve, reject) => {
            client.get(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.innerLogger.debug(`get from:${endpoint} success`);
                    resolve(resp);
                }
            });
        });
        try {
            return await getPromise;
        } catch (err) {
            this.innerLogger.error(`GET ${endpoint} got error: ${err}`);
            throw new NotFoundException();
        }
    }

    async delete<T>(endpoint: string, client?: any, request?: any): Promise<void> {
        //MAYBE return boolean of result (succes vs failure)
        if (client) {
            const metaData = this.makeMetadataHeader();
            const deletePromise = new Promise<T>((resolve, reject) => {
                client.delete(request, metaData, (err: ServiceError, resp: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.innerLogger.debug(`delete :${endpoint} success`);
                        resolve(resp);
                    }
                });
            });
            try {
                await deletePromise;
                return;
            } catch (err) {
                this.innerLogger.error(`DELETE ${endpoint} got error: ${err}`);
                throw new BadRequestException();
            }
        }
    }

    async get<T>(endpoint: string, client?: any, request?: any): Promise<T> {
        const metaData = this.makeMetadataHeader();
        const getPromise = new Promise<T>((resolve, reject) => {
            client.get(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.innerLogger.debug(`get from:${endpoint} success`);
                    resolve(resp);
                }
            });
        });
        try {
            return await getPromise;
        } catch (err) {
            this.innerLogger.error(`GET ${endpoint} got error: ${err}`);
            throw new NotFoundException();
        }
    }

    async getAllApplicationsWithPagination(
        tenantID: string
    ): Promise<ListAllChirpstackApplicationsResponseDto> {
        const req = new ListApplicationsRequest();
        req.setTenantId(await this.getDefaultOrganizationId());

        const result = await this.getAllWithPagination<ListApplicationsResponse.AsObject>(
            `applications?limit=100&organizationID=${tenantID}`,
            100,
            undefined,
            this.applicationServiceClient,
            req
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
            result: chirpstackApplicationResponseDto,
        };
    }

    async getAllWithPagination<T>(
        endpoint: string,
        limit?: number,
        offset?: number,
        client?: any,
        request?: any
    ): Promise<T> {
        const metaData = this.makeMetadataHeader();
        request.setLimit(limit), request.setOffset(offset);

        const getListPromise = new Promise<T>((resolve, reject) => {
            client.list(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    const result = resp.toObject();
                    resolve(result);
                    this.innerLogger.debug(`get all from:${endpoint} success`);
                }
            });
        });
        try {
            return await getListPromise;
        } catch (err) {
            this.innerLogger.error(`GET ${endpoint} got error: ${err}`);
            throw new NotFoundException();
        }
    }

    public async getTenants(
        limit?: number,
        offset?: number
    ): Promise<ListTenantsResponse.AsObject> {
        const tenantClient = new TenantServiceClient(
            this.baseUrlGRPC,
            credentials.createInsecure()
        );
        const req = new ListTenantsRequest();

        const res = await this.getAllWithPagination<ListTenantsResponse.AsObject>(
            "organizations",
            limit,
            offset,
            tenantClient,
            req
        );
        return res;
    }

    public async getDefaultOrganizationId(): Promise<string> {
        let id = null;
        await this.getTenants(1000, 0).then(response => {
            response.resultList.forEach(element => {
                if (
                    element.name.toLowerCase() == "os2iot" ||
                    element.name.toLowerCase() == "chirpstack"
                ) {
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
