import { CreateDeviceModelDto } from "@dto/create-device-model.dto";
import { ListAllDeviceModelResponseDto } from "@dto/list-all-device-model-response.dto";
import { DeviceModel } from "@entities/device-model.entity";
import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OrganizationService } from "@services/user-management/organization.service";
import { DeleteResult, In, Repository } from "typeorm";
import * as AJV from "ajv";
import { deviceModelSchema } from "@resources/device-model-schema";
import { UpdateDeviceModelDto } from "@dto/update-device-model.dto";

@Injectable()
export class DeviceModelService {
    constructor(
        @InjectRepository(DeviceModel)
        private repository: Repository<DeviceModel>,
        private organizationService: OrganizationService
    ) {
        this.avj = new AJV({ allErrors: true, missingRefs: "ignore", verbose: false });
        this.avj.addSchema(deviceModelSchema, this.SCHEMA_NAME);
    }

    private avj: AJV.Ajv;
    private readonly SCHEMA_NAME = "device-model";

    async getAllDeviceModelsByOrgIds(
        orgIds: number[]
    ): Promise<ListAllDeviceModelResponseDto> {
        if (orgIds.length == 0) {
            return {
                data: [],
                count: 0,
            };
        }

        const [data, count] = await this.repository.findAndCount({
            belongsTo: { id: In(orgIds) },
        });

        return {
            data: data,
            count: count,
        };
    }

    async getById(id: number): Promise<DeviceModel> {
        return this.repository.findOne(id, {
            loadRelationIds: {
                relations: ["belongsTo"],
            },
        });
    }

    async getByIdWithRelations(id: number): Promise<DeviceModel> {
        return this.repository.findOne(id, {
            relations: ["belongsTo"],
        });
    }

    async create(dto: CreateDeviceModelDto): Promise<DeviceModel> {
        const deviceModel = new DeviceModel();
        deviceModel.belongsTo = await this.organizationService.findById(dto.belongsToId);
        return this.update(deviceModel, dto);
    }

    async update(
        deviceModel: DeviceModel,
        dto: UpdateDeviceModelDto
    ): Promise<DeviceModel> {
        this.validateModel(dto.body);

        deviceModel.body = dto.body;

        return this.repository.save(deviceModel);
    }

    async delete(id: number): Promise<DeleteResult> {
        return this.repository.delete(id);
    }

    private async mapToModel(
        deviceModel: DeviceModel,
        dto: CreateDeviceModelDto
    ): Promise<void> {
        deviceModel.body = dto.body;
    }

    private validateModel(body: JSON): void {
        const valid = this.avj.validate(this.SCHEMA_NAME, body);
        if (!valid) {
            // Construct error messages like class-validator ...
            const messages = this.avj.errors.map(x => {
                return {
                    property: (x?.params as AJV.RequiredParams)?.missingProperty,
                    constraints: {
                        required: x.message,
                    },
                };
            });
            throw new BadRequestException(messages);
        }
    }
}
