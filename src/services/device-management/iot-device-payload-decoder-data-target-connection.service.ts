import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, FindOptionsWhere, In, OrderByCondition, Repository, SelectQueryBuilder } from "typeorm";

import { CreateIoTDevicePayloadDecoderDataTargetConnectionDto } from "@dto/create-iot-device-payload-decoder-data-target-connection.dto";
import { ListAllConnectionsResponseDto } from "@dto/list-all-connections-response.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { UpdateIoTDevicePayloadDecoderDataTargetConnectionDto } from "@dto/update-iot-device-payload-decoder-data-target-connection.dto";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { PayloadDecoderService } from "@services/data-management/payload-decoder.service";
import { DataTargetService } from "@services/data-targets/data-target.service";

import { IoTDeviceService } from "./iot-device.service";
import { IoTDevice } from "@entities/iot-device.entity";
import { ListAllConnectionsQuery } from "@dto/list-all-connections.query";
import { ApplicationService } from "@services/device-management/application.service";

@Injectable()
export class IoTDevicePayloadDecoderDataTargetConnectionService {
  constructor(
    @InjectRepository(IoTDevicePayloadDecoderDataTargetConnection)
    private repository: Repository<IoTDevicePayloadDecoderDataTargetConnection>,
    @Inject(forwardRef(() => ApplicationService))
    private applicationService: ApplicationService,
    @Inject(forwardRef(() => IoTDeviceService))
    private ioTDeviceService: IoTDeviceService,
    @Inject(forwardRef(() => DataTargetService))
    private dataTargetService: DataTargetService,
    @Inject(forwardRef(() => PayloadDecoderService))
    private payloadDecoderService: PayloadDecoderService
  ) {}

  async findAndCountWithPagination(
    query?: ListAllEntitiesDto,
    allowed?: number[]
  ): Promise<ListAllConnectionsResponseDto> {
    if (allowed != undefined) {
      return await this.findAndCountWithPaginationAndWhitelist(query, allowed);
    } else {
      return await this.findAllWithWhereQueryBuilder(this.genDefaultQuery(), query.limit, query.offset, query.sort);
    }
  }

  async findAndCountWithPaginationAndWhitelist(
    query?: ListAllEntitiesDto,
    allowed?: number[]
  ): Promise<ListAllConnectionsResponseDto> {
    if (allowed.length === 0) {
      return {
        data: [],
        count: 0,
      };
    }
    const innerQuery = this.genDefaultQuery().where("d.application In(:...appIds)", {
      appIds: allowed,
    });
    return await this.findAllWithWhereQueryBuilder(innerQuery, query.limit, query.offset, query.sort);
  }

  async findAllByIoTDeviceIdWithDeviceModel(id: number): Promise<ListAllConnectionsResponseDto> {
    const query = this.genDefaultQuery().leftJoinAndSelect("d.deviceModel", "dm").where("d.id = :deviceId", {
      deviceId: id,
    });
    return await this.findAllWithWhereQueryBuilder(query);
  }

  async findBySimilarConnection(
    applicationId: number,
    dataTargetId: number,
    payloadDecoderId: number
  ): Promise<IoTDevicePayloadDecoderDataTargetConnection[]> {
    return (
      await this.findAllWithWhere({
        application: {
          id: applicationId,
        },
        payloadDecoder: {
          id: payloadDecoderId,
        },
        dataTarget: {
          id: dataTargetId,
        },
      })
    ).data;
  }

  async findAllByIoTDeviceId(id: number, allowed?: number[]): Promise<ListAllConnectionsResponseDto> {
    if (allowed != undefined) {
      if (allowed.length === 0) {
        return {
          data: [],
          count: 0,
        };
      }
      const query = this.genDefaultQuery().where("d.id = :deviceId and d.application In(:...appIds)", {
        deviceId: id,
        appIds: allowed,
      });
      return await this.findAllWithWhereQueryBuilder(query);
    } else {
      const query = this.genDefaultQuery().where("d.id = :deviceId", {
        deviceId: id,
      });
      return await this.findAllWithWhereQueryBuilder(query);
    }
  }

  async findAllByPayloadDecoderId(id: number, allowedOrganisations?: number[]): Promise<ListAllConnectionsResponseDto> {
    if (allowedOrganisations != undefined) {
      if (allowedOrganisations.length === 0) {
        return {
          data: [],
          count: 0,
        };
      }
      const query = this.genDefaultQuery()
        .innerJoin("deviceApp.belongsTo", "deviceOrg")
        .innerJoin("dataTargetApp.belongsTo", "dataTargetOrg")
        .where(
          'pd.id = :payloadDecoderId and "deviceOrg"."id" In(:...orgIds) and "dataTargetOrg"."id" In(:...orgIds)',
          {
            payloadDecoderId: id,
            orgIds: allowedOrganisations,
          }
        );
      return await this.findAllWithWhereQueryBuilder(query);
    } else {
      return await this.findAllWithWhere({
        payloadDecoder: { id: id },
      });
    }
  }

  async findAllByDataTargetId(id: number, allowed?: number[]): Promise<ListAllConnectionsResponseDto> {
    if (allowed != undefined) {
      if (allowed.length === 0) {
        return {
          data: [],
          count: 0,
        };
      }
      return await this.findAllWithWhere({
        dataTarget: {
          id,
          organization: {
            id: In(allowed),
          },
        },
      });
    }
    return await this.findAllWithWhere({
      dataTarget: {
        id,
      },
    });
  }

  async findAllByApplicationId(query: ListAllConnectionsQuery): Promise<ListAllConnectionsResponseDto> {
    const result = await this.findAllWithWhere(
      {
        application: {
          id: query.applicationId,
        },
      },
      query.limit,
      query.offset
    );
    if (query.orderOn) {
      this.externalSortResult(query, result.data);
    }

    return result;
  }

  async findAllDefaultsForApplicationIds(
    applicationIds: number[]
  ): Promise<IoTDevicePayloadDecoderDataTargetConnection[]> {
    return (await this.findAllWithWhere({ application: { id: In(applicationIds) }, defaultConnection: true })).data;
  }

  async connectNewIotDevicesToDefaults(iotDevices: IoTDevice[]) {
    const applications = iotDevices.map(d => d.application);
    const uniqueApplications = [...new Map(applications.map(a => [a.id, a])).values()].map(a => a.id);
    const defaultConnections = await this.findAllDefaultsForApplicationIds(uniqueApplications);

    for (const connection of defaultConnections) {
      connection.iotDevices.push(...iotDevices.filter(d => d.application.id === connection.application.id));
    }
    await this.repository.save(defaultConnections);
  }

  async findOne(id: number): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
    try {
      return await this.repository.findOneOrFail({
        where: { id },
        relations: ["iotDevices", "payloadDecoder", "dataTarget", "application"],
        loadRelationIds: {
          relations: ["createdBy", "updatedBy"],
        },
      });
    } catch (err) {
      throw new NotFoundException(`Could not find IoTDevicePayloadDecoderDataTargetConnection by id: ${id}`);
    }
  }

  async create(
    createConnectionDto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto,
    userId: number
  ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
    const connection = new IoTDevicePayloadDecoderDataTargetConnection();

    const mapped = await this.mapDtoToConnection(connection, createConnectionDto);
    mapped.createdBy = userId;
    mapped.updatedBy = userId;
    return await this.repository.save(mapped);
  }

  async update(
    id: number,
    updateConnectionDto: UpdateIoTDevicePayloadDecoderDataTargetConnectionDto,
    userId: number
  ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
    let connection;
    try {
      connection = await this.repository.findOneByOrFail({ id });
    } catch (err) {
      throw new NotFoundException(`Could not find IoTDevicePayloadDecoderDataTargetConnection by id: ${id}`);
    }

    const mapped = await this.mapDtoToConnection(connection, updateConnectionDto);
    mapped.updatedBy = userId;
    return await this.repository.save(mapped);
  }

  async appendCopiedDevice(
    id: number,
    iotDevice: IoTDevice,
    userId: number
  ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
    let connection;
    try {
      connection = await this.repository.findOneOrFail({
        where: { id },
        relations: ["iotDevices"],
      });
    } catch (err) {
      throw new NotFoundException(`Could not find IoTDevicePayloadDecoderDataTargetConnection by id: ${id}`);
    }

    connection.iotDevices.push(iotDevice);
    connection.updatedBy = userId;

    return await this.repository.save(connection);
  }

  async delete(id: number): Promise<DeleteResult> {
    return await this.repository.delete(id);
  }

  private async findAllWithWhere(
    where?: FindOptionsWhere<IoTDevicePayloadDecoderDataTargetConnection>,
    limit?: number,
    offset?: number,
    sort?: OrderByCondition
  ): Promise<ListAllConnectionsResponseDto> {
    const [result, total] = await this.repository.findAndCount({
      where: where || {},
      take: limit || 1000,
      skip: offset || 0,
      relations: ["iotDevices", "payloadDecoder", "dataTarget", "application"],
      order: sort,
    });

    return {
      data: result,
      count: total,
    };
  }

  private async findAllWithWhereQueryBuilder(
    query?: SelectQueryBuilder<IoTDevicePayloadDecoderDataTargetConnection>,
    limit?: number,
    offset?: number,
    sort?: "ASC" | "DESC" | 1 | -1
  ): Promise<ListAllConnectionsResponseDto> {
    const [result, total] = await query
      .limit(limit || 1000)
      .skip(offset || 0)
      .orderBy("connection.id")
      .getManyAndCount();

    return {
      data: result,
      count: total,
    };
  }

  private genDefaultQuery() {
    return this.repository
      .createQueryBuilder("connection")
      .innerJoinAndSelect("connection.iotDevices", "d")
      .leftJoinAndSelect("connection.payloadDecoder", "pd")
      .innerJoinAndSelect("connection.dataTarget", "dt")
      .innerJoinAndSelect("connection.application", "application")
      .innerJoinAndSelect("d.application", "deviceApp");
  }

  private async mapDtoToConnection(
    connection: IoTDevicePayloadDecoderDataTargetConnection,
    createConnectionDto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto
  ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
    await this.mapIoTDevices(connection, createConnectionDto);
    await this.mapDataTarget(connection, createConnectionDto);
    await this.mapPayloadDecoder(createConnectionDto, connection);
    connection.application = await this.applicationService.findOne(createConnectionDto.applicationId);
    connection.defaultConnection = createConnectionDto.defaultConnection;

    if (connection.iotDevices.some(x => x.application.belongsTo.id != connection.dataTarget.organization.id)) {
      throw new BadRequestException(ErrorCodes.NotSameApplication);
    }
    // Ensure all devices belong to the same application
    if ([...new Set(connection.iotDevices.flatMap(d => d.application.id))].length > 1) {
      throw new BadRequestException(ErrorCodes.NotSameApplication);
    }

    return connection;
  }

  private async mapPayloadDecoder(
    createConnectionDto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto,
    connection: IoTDevicePayloadDecoderDataTargetConnection
  ) {
    if (createConnectionDto.payloadDecoderId !== undefined) {
      if (createConnectionDto.payloadDecoderId === null) {
        connection.payloadDecoder = null;
      } else {
        try {
          connection.payloadDecoder = await this.payloadDecoderService.findOne(createConnectionDto.payloadDecoderId);
        } catch (err) {
          throw new BadRequestException(
            `Could not find PayloadDecoder by id: '${createConnectionDto.payloadDecoderId}'`
          );
        }
      }
    }
  }

  private async mapDataTarget(
    connection: IoTDevicePayloadDecoderDataTargetConnection,
    createConnectionDto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto
  ) {
    try {
      connection.dataTarget = await this.dataTargetService.findOne(createConnectionDto.dataTargetId);
    } catch (err) {
      throw new BadRequestException(`Could not find DataTarget by id: '${createConnectionDto.dataTargetId}'`);
    }
  }

  private async mapIoTDevices(
    connection: IoTDevicePayloadDecoderDataTargetConnection,
    createConnectionDto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto
  ) {
    try {
      connection.iotDevices = await this.ioTDeviceService.findManyByIds(createConnectionDto.iotDeviceIds);
    } catch (err) {
      throw new BadRequestException(`Could not find IoT-Device by id: '${createConnectionDto.iotDeviceIds}'`);
    }
    if (connection.iotDevices.length === 0) {
      throw new BadRequestException(`Must contain at least one IoTDevice`);
    }
  }

  private externalSortResult(query: ListAllEntitiesDto, result: IoTDevicePayloadDecoderDataTargetConnection[]) {
    const sortOrder = query.sort.toLowerCase() === "desc" ? -1 : 1;
    if (query.orderOn === "name") {
      result.sort((a, b) => a.dataTarget.name.localeCompare(b.dataTarget.name, "en", { numeric: true }) * sortOrder);
    }
    if (query.orderOn === "payload-decoder") {
      result.sort(
        (a, b) => a.payloadDecoder.name.localeCompare(b.payloadDecoder.name, "en", { numeric: true }) * sortOrder
      );
    }
    if (query.orderOn === "devices") {
      result.sort((a, b) => (a.iotDevices.length - b.iotDevices.length) * sortOrder);
    }
    if (query.orderOn === "isDefault") {
      result.sort((a, b) => (+a.defaultConnection - +b.defaultConnection) * sortOrder);
    }
  }
}
