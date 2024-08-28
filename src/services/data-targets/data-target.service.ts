import { CreateDataTargetDto } from "@dto/create-data-target.dto";
import { CreateOpenDataDkDatasetDto } from "@dto/create-open-data-dk-dataset.dto";
import { ListAllDataTargetsResponseDto } from "@dto/list-all-data-targets-response.dto";
import { ListAllDataTargetsDto } from "@dto/list-all-data-targets.dto";
import { OddkMailInfo } from "@dto/oddk-mail-info.dto";
import { UpdateDataTargetDto } from "@dto/update-data-target.dto";
import { DataTarget } from "@entities/data-target.entity";
import { FiwareDataTarget } from "@entities/fiware-data-target.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { MqttDataTarget } from "@entities/mqtt-data-target.entity";
import { OpenDataDkDataset } from "@entities/open-data-dk-dataset.entity";
import { dataTargetTypeMap } from "@enum/data-target-type-mapping";
import { DataTargetType } from "@enum/data-target-type.enum";
import { ErrorCodes } from "@enum/error-codes.enum";
import { BadRequestException, forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ApplicationService } from "@services/device-management/application.service";
import { OS2IoTMail } from "@services/os2iot-mail.service";
import { DeleteResult, Repository, SelectQueryBuilder } from "typeorm";
import { CLIENT_SECRET_PROVIDER, ClientSecretProvider } from "../../helpers/fiware-token.helper";
import { User } from "@entities/user.entity";

@Injectable()
export class DataTargetService {
  constructor(
    @InjectRepository(DataTarget)
    private dataTargetRepository: Repository<DataTarget>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => ApplicationService))
    private applicationService: ApplicationService,
    @Inject(CLIENT_SECRET_PROVIDER)
    private clientSecretProvider: ClientSecretProvider,
    private oS2IoTMail: OS2IoTMail
  ) {}
  private readonly logger = new Logger(DataTargetService.name);

  async findAndCountAllWithPagination(
    query?: ListAllDataTargetsDto,
    applicationIds?: number[]
  ): Promise<ListAllDataTargetsResponseDto> {
    let queryBuilder = this.dataTargetRepository
      .createQueryBuilder("datatarget")
      .innerJoinAndSelect("datatarget.application", "application")
      .limit(query.limit)
      .offset(query.offset)
      .orderBy(query.orderOn, "ASC");

    // Only apply applicationId filter, if one is given.
    queryBuilder = this.filterByApplication(query, queryBuilder, applicationIds);

    const [result, total] = await queryBuilder.getManyAndCount();

    return {
      data: result,
      count: total,
    };
  }

  private filterByApplication(
    query: ListAllDataTargetsDto,
    queryBuilder: SelectQueryBuilder<DataTarget>,
    applicationIds: number[]
  ) {
    if (query.applicationId) {
      queryBuilder = queryBuilder.where("datatarget.application = :appId", {
        appId: query.applicationId,
      });
    } else if (applicationIds) {
      queryBuilder = queryBuilder.where('"application"."id" IN (:...allowedApplications)', {
        allowedApplications: applicationIds,
      });
    }
    return queryBuilder;
  }

  async findOne(id: number): Promise<DataTarget> {
    return await this.dataTargetRepository.findOneOrFail({
      where: { id },
      relations: ["application", "openDataDkDataset"],
      loadRelationIds: {
        relations: ["createdBy", "updatedBy"],
      },
    });
  }

  async findDataTargetsByApplicationId(applicationId: number): Promise<DataTarget[]> {
    return await this.dataTargetRepository.findBy({
      application: { id: applicationId },
    });
  }

  async findDataTargetsByConnectionPayloadDecoderAndIoTDevice(
    iotDeviceId: number,
    payloadDecoderId?: number
  ): Promise<DataTarget[]> {
    const res = await this.dataTargetRepository
      .createQueryBuilder("dt")
      .addSelect("dt.clientSecret")
      .innerJoin("iot_device_payload_decoder_data_target_connection", "con", 'con."dataTargetId" = dt.id')
      .innerJoin(
        "iot_dev_pay_dec_dat_tar_con_iot_dev_iot_dev",
        "jt",
        'jt."iotDevicePayloadDecoderDataTargetConnectionId" = con.id'
      )
      .where('jt."iotDeviceId" = :iotDeviceId', { iotDeviceId: iotDeviceId });
    if (payloadDecoderId === null) {
      return res.andWhere('con."payloadDecoderId" is null').getMany();
    } else {
      return res
        .andWhere('con."payloadDecoderId" = :decoderId', {
          decoderId: payloadDecoderId,
        })
        .getMany();
    }
  }

  async create(createDataTargetDto: CreateDataTargetDto, userId: number): Promise<DataTarget> {
    const childType = dataTargetTypeMap[createDataTargetDto.type];

    const dataTarget = this.createDataTargetByDto<DataTarget>(childType);
    const mappedDataTarget = await this.mapDtoToDataTarget(createDataTargetDto, dataTarget);

    if (createDataTargetDto.openDataDkDataset) {
      dataTarget.openDataDkDataset = new OpenDataDkDataset();
      mappedDataTarget.openDataDkDataset = this.mapOpenDataDk(
        createDataTargetDto.openDataDkDataset,
        dataTarget.openDataDkDataset
      );
      mappedDataTarget.openDataDkDataset.createdBy = userId;
      mappedDataTarget.openDataDkDataset.updatedBy = userId;
    } else {
      mappedDataTarget.openDataDkDataset = null;
    }

    mappedDataTarget.createdBy = userId;
    mappedDataTarget.updatedBy = userId;
    // Use the generic manager since we cannot use a general repository.
    const entityManager = this.dataTargetRepository.manager;
    return await entityManager.save(mappedDataTarget, {});
  }

  async update(id: number, updateDataTargetDto: UpdateDataTargetDto, userId: number): Promise<DataTarget> {
    const existing = await this.dataTargetRepository
      .createQueryBuilder("target")
      .addSelect("target.clientSecret")
      .leftJoinAndSelect("target.openDataDkDataset", "openDataDkDataset")
      .where("target.id = :id", { id })
      .getOneOrFail();

    const mappedDataTarget = await this.mapDtoToDataTarget(updateDataTargetDto, existing);

    if (updateDataTargetDto.openDataDkDataset) {
      if (existing.openDataDkDataset == null) {
        existing.openDataDkDataset = new OpenDataDkDataset();
      }
      mappedDataTarget.openDataDkDataset = this.mapOpenDataDk(
        updateDataTargetDto.openDataDkDataset,
        existing.openDataDkDataset
      );
      mappedDataTarget.openDataDkDataset.updatedBy = userId;
    } else {
      mappedDataTarget.openDataDkDataset = null;
    }
    mappedDataTarget.updatedBy = userId;
    const res = this.dataTargetRepository.save(mappedDataTarget);

    return res;
  }

  async delete(id: number): Promise<DeleteResult> {
    return this.dataTargetRepository.delete(id);
  }

  private async mapDtoToDataTarget(dataTargetDto: CreateDataTargetDto, dataTarget: DataTarget): Promise<DataTarget> {
    dataTarget.name = dataTargetDto.name;
    if (dataTargetDto.applicationId != null) {
      try {
        dataTarget.application = await this.applicationService.findOneWithoutRelations(dataTargetDto.applicationId);
      } catch (err) {
        this.logger.error(`Could not find application with id: ${dataTargetDto.applicationId}`);

        throw new BadRequestException(ErrorCodes.IdDoesNotExists);
      }
    } else {
      throw new BadRequestException(ErrorCodes.IdMissing);
    }

    await this.mapDtoToTypeSpecificDataTarget(dataTargetDto, dataTarget);

    return dataTarget;
  }

  private mapOpenDataDk(dto: CreateOpenDataDkDatasetDto, o: OpenDataDkDataset): OpenDataDkDataset {
    o.name = dto.name;
    o.license = dto.license;
    o.authorName = dto.authorName;
    o.authorEmail = dto.authorEmail;

    o.description = dto.description;
    o.keywords = dto.keywords;
    o.resourceTitle = dto.resourceTitle;
    return o;
  }

  private async mapDtoToTypeSpecificDataTarget(dataTargetDto: CreateDataTargetDto, dataTarget: DataTarget) {
    if (dataTargetDto.type === DataTargetType.HttpPush) {
      const httpPushDataTarget = dataTarget as HttpPushDataTarget;
      httpPushDataTarget.url = dataTargetDto.url;
      httpPushDataTarget.timeout = dataTargetDto.timeout;
      httpPushDataTarget.authorizationHeader = dataTargetDto.authorizationHeader;
    } else if (dataTargetDto.type === DataTargetType.Fiware) {
      const fiwareDataTarget = dataTarget as FiwareDataTarget;
      fiwareDataTarget.url = dataTargetDto.url;
      fiwareDataTarget.timeout = dataTargetDto.timeout;
      fiwareDataTarget.authorizationHeader = dataTargetDto.authorizationHeader;
      fiwareDataTarget.tokenEndpoint = dataTargetDto.tokenEndpoint;
      fiwareDataTarget.clientId = dataTargetDto.clientId;

      // NOTE: If there is no client secret we keep it as it was
      if (dataTargetDto.clientSecret) {
        fiwareDataTarget.clientSecret = await this.clientSecretProvider.store(dataTargetDto.clientSecret);
      }
      fiwareDataTarget.tenant = dataTargetDto.tenant;
      fiwareDataTarget.context = dataTargetDto.context;
    } else if (dataTargetDto.type === DataTargetType.MQTT) {
      const mqttTarget = dataTarget as MqttDataTarget;
      mqttTarget.url = dataTargetDto.url;
      mqttTarget.timeout = dataTargetDto.timeout;
      mqttTarget.mqttPort = dataTargetDto.mqttPort;
      mqttTarget.mqttTopic = dataTargetDto.mqttTopic;
      mqttTarget.mqttQos = dataTargetDto.mqttQos;
      mqttTarget.mqttUsername = dataTargetDto.mqttUsername;
      mqttTarget.mqttPassword = dataTargetDto.mqttPassword;
    }
  }

  private createDataTargetByDto<T extends DataTarget>(childDataTargetType: any): T {
    return new childDataTargetType();
  }

  public async sendOpenDataDkMail(mailInfoDto: OddkMailInfo, userId: number): Promise<boolean> {
    const user = await this.userRepository.findOneByOrFail({ id: userId });
    await this.oS2IoTMail.sendMailChecked({
      to: "info@opendata.dk",
      subject: "Ny integration til OS2IoT",
      html:
        `<p>
                Hej Open Data DK,<br>
                <br>
                Vi har oprettet en integration fra vores organisation i OS2iot til Open Data DK, som I gerne må begynde at høste.<br>
                I kan høste fra ${mailInfoDto.sharingUrl} <br>
                Vores data skal knyttes til følgende organisation på opendata.dk: ${mailInfoDto.organizationOddkAlias} <br>
                <br>` +
        (mailInfoDto.comment ? "Kommentar: " + mailInfoDto.comment + "<br><br>" : "") +
        "Mvh.<br>" +
        user.name +
        "<br>" +
        user.email +
        "</p>",
    });
    return true;
  }
}
