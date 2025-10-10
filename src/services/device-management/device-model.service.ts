import { CreateDeviceModelDto } from "@dto/create-device-model.dto";
import { ListAllDeviceModelResponseDto } from "@dto/list-all-device-model-response.dto";
import { DeviceModel } from "@entities/device-model.entity";
import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OrganizationService } from "@services/user-management/organization.service";
import { DeleteResult, In, Repository } from "typeorm";
import { deviceModelSchema } from "@resources/device-model-schema";
import { UpdateDeviceModelDto } from "@dto/update-device-model.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { nameof } from "@helpers/type-helper";
import Ajv from "ajv";

@Injectable()
export class DeviceModelService {
  private avj: Ajv;
  private readonly SCHEMA_NAME = "device-model";

  constructor(
    @InjectRepository(DeviceModel)
    private repository: Repository<DeviceModel>,
    @Inject(forwardRef(() => OrganizationService))
    private organizationService: OrganizationService
  ) {
    this.avj = new Ajv({ allErrors: true, verbose: false });
    this.avj.addSchema(deviceModelSchema, this.SCHEMA_NAME);
  }

  async getAllDeviceModelsByOrgIds(
    orgIds: number[],
    query?: ListAllEntitiesDto
  ): Promise<ListAllDeviceModelResponseDto> {
    if (orgIds.length == 0) {
      return {
        data: [],
        count: 0,
      };
    }

    const [data, count] = await this.repository.findAndCount({
      where: {
        belongsTo: { id: In(orgIds) },
      },
      take: query?.limit ? +query.limit : 100,
      skip: query?.offset ? +query.offset : 0,
      order: this.getSorting(query),
      relations: [nameof<DeviceModel>("belongsTo")],
    });

    return {
      data: data,
      count: count,
    };
  }

  async getById(id: number): Promise<DeviceModel> {
    return this.repository.findOne({
      where: { id },
      loadRelationIds: {
        relations: ["belongsTo", "createdBy", "updatedBy"],
      },
    });
  }

  async getByIdWithRelations(id: number): Promise<DeviceModel> {
    return this.repository.findOne({
      where: { id },
      relations: ["belongsTo"],
      loadRelationIds: {
        relations: ["createdBy", "updatedBy"],
      },
    });
  }

  async getByIdsWithRelations(ids: number[]): Promise<DeviceModel[]> {
    return this.repository.find({
      where: { id: In(ids) },
      relations: ["belongsTo"],
      loadRelationIds: {
        relations: ["createdBy", "updatedBy"],
      },
    });
  }

  async create(dto: CreateDeviceModelDto, userId: number): Promise<DeviceModel> {
    const deviceModel = new DeviceModel();
    deviceModel.belongsTo = await this.organizationService.findById(dto.belongsToId);
    deviceModel.createdBy = userId;
    return this.update(deviceModel, dto, userId);
  }

  async update(deviceModel: DeviceModel, dto: UpdateDeviceModelDto, userId: number): Promise<DeviceModel> {
    this.validateModel(dto.body);

    deviceModel.body = dto.body;
    deviceModel.updatedBy = userId;
    return this.repository.save(deviceModel);
  }

  async delete(id: number): Promise<DeleteResult> {
    return this.repository.delete(id);
  }

  private getSorting(query: ListAllEntitiesDto) {
    const sorting: { [id: string]: string | number } = {};
    if (query?.orderOn != null && query.orderOn == "id") {
      sorting[query.orderOn] = query.sort.toLocaleUpperCase();
    } else {
      sorting["id"] = "ASC";
    }
    return sorting;
  }

  private validateModel(body: JSON): void {
    const valid = this.avj.validate(this.SCHEMA_NAME, body);
    if (!valid) {
      // Construct error messages like class-validator ...
      const messages = this.avj.errors.map(x => {
        return {
          property: x?.params?.missingProperty,
          constraints: {
            required: x.message,
          },
        };
      });
      throw new BadRequestException(messages);
    }
  }
}
