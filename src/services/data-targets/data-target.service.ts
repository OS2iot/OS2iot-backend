import { CreateDataTargetDto } from "@dto/create-data-target.dto";
import { CreateOpenDataDkDatasetDto } from "@dto/create-open-data-dk-dataset.dto";
import { DataTargetDto, ListAllDataTargetsResponseDto } from "@dto/list-all-data-targets-response.dto";
import { ListAllDataTargetsDto } from "@dto/list-all-data-targets.dto";
import { OddkMailInfo } from "@dto/oddk-mail-info.dto";
import { UpdateDataTargetDto } from "@dto/update-data-target.dto";
import { DataTarget } from "@entities/data-target.entity";
import { FiwareDataTarget } from "@entities/fiware-data-target.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { MqttDataTarget } from "@entities/mqtt-data-target.entity";
import { OpenDataDkDataset } from "@entities/open-data-dk-dataset.entity";
import { User } from "@entities/user.entity";
import { dataTargetTypeMap } from "@enum/data-target-type-mapping";
import { DataTargetType } from "@enum/data-target-type.enum";
import { ErrorCodes } from "@enum/error-codes.enum";
import { BadRequestException, forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OS2IoTMail } from "@services/os2iot-mail.service";
import { DeleteResult, Repository } from "typeorm";
import { CLIENT_SECRET_PROVIDER, ClientSecretProvider } from "@helpers/fiware-token.helper";
import { DataTargetLogService } from "./data-target-log.service";
import { DataTargetSenderService } from "@services/data-targets/data-target-sender.service";
import { TestDataTargetDto, TestDataTargetResultDto } from "@dto/test-data-target.dto";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { PayloadDecoderExecutorService } from "@services/data-management/payload-decoder-executor.service";
import { PayloadDecoderService } from "@services/data-management/payload-decoder.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { IoTDeviceType } from "@enum/device-type.enum";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { OrganizationService } from "@services/user-management/organization.service";

@Injectable()
export class DataTargetService {
  private readonly logger = new Logger(DataTargetService.name);

  constructor(
    @InjectRepository(DataTarget)
    private dataTargetRepository: Repository<DataTarget>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => OrganizationService))
    private organizationService: OrganizationService,
    @Inject(CLIENT_SECRET_PROVIDER)
    private clientSecretProvider: ClientSecretProvider,
    private oS2IoTMail: OS2IoTMail,
    private dataTargetLogService: DataTargetLogService,
    private dataTargetSenderService: DataTargetSenderService,
    private payloadDecoderExecutorService: PayloadDecoderExecutorService,
    @Inject(forwardRef(() => PayloadDecoderService))
    private payloadDecoderService: PayloadDecoderService,
    @Inject(forwardRef(() => IoTDeviceService))
    private iotDeviceService: IoTDeviceService,
    private chirpstackDeviceService: ChirpstackDeviceService
  ) {}

  async findAndCountAllWithPagination(
    query?: ListAllDataTargetsDto,
    hideSecrets: boolean = true
  ): Promise<ListAllDataTargetsResponseDto> {
    let queryBuilder = this.dataTargetRepository
      .createQueryBuilder("datatarget")
      .where('datatarget."organizationId" = :organizationId', { organizationId: query.organizationId })
      .limit(query.limit)
      .offset(query.offset)
      .orderBy(query.orderOn, query.sort ?? "ASC");

    const [result, total] = await queryBuilder.getManyAndCount();
    if (hideSecrets) {
      result.forEach(this.hideDataTargetSecret);
    }

    const idsWithRecentError = await this.dataTargetLogService.getDatatargetWithRecentError(result.map(dt => dt.id));
    const resultWithErrorInfo = result.map(
      dt => ({ ...dt, hasRecentErrors: idsWithRecentError.has(dt.id) }) as DataTargetDto
    );

    return {
      data: resultWithErrorInfo,
      count: total,
    };
  }

  async findOne(id: number, hideSecret = false): Promise<DataTarget> {
    const dataTarget = await this.dataTargetRepository.findOneOrFail({
      where: { id },
      relations: ["organization", "openDataDkDataset"],
      loadRelationIds: {
        relations: ["createdBy", "updatedBy"],
      },
    });

    if (hideSecret) {
      this.hideDataTargetSecret(dataTarget);
    }

    return dataTarget;
  }

  async findOneWithClientSecret(id: number): Promise<DataTarget> {
    return await this.dataTargetRepository
      .createQueryBuilder("dt")
      .addSelect("dt.clientSecret")
      .where('dt."id" = :id', { id: id })
      .getOne();
  }

  public async findOneWithHasRecentError(id: number, hideSecrets = true): Promise<DataTargetDto> {
    const datatarget = await this.findOne(id, hideSecrets);
    const idsWithRecentError = await this.dataTargetLogService.getDatatargetWithRecentError([id]);
    return { ...datatarget, hasRecentErrors: idsWithRecentError.has(id) };
  }

  async findDataTargetsByConnectionPayloadDecoderAndIoTDevice(
    iotDeviceId: number,
    payloadDecoderId?: number
  ): Promise<DataTarget[]> {
    const res = this.dataTargetRepository
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
      return await res.andWhere('con."payloadDecoderId" is null').getMany();
    } else {
      return await res
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
    const dbDataTarget = await this.dataTargetRepository.findOne({ where: { id }, relations: { connections: true } });
    if (dbDataTarget.connections.length !== 0) {
      throw new BadRequestException(ErrorCodes.DeleteNotAllowedItemIsInUse);
    }

    return this.dataTargetRepository.delete(id);
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

  public async updateLastMessageDate(datatargetId: number) {
    this.dataTargetRepository.update(
      { id: datatargetId },
      // Note: The "updatedAt"-part here prevents the updatedAt/updatedBy to be overwritten with unhelpful data from the automatic update of lastMessageDate
      { lastMessageDate: new Date(), updatedAt: () => '"updatedAt"' }
    );
  }

  public async testDataTarget(testDto: TestDataTargetDto, dataTarget: DataTarget): Promise<TestDataTargetResultDto> {
    let iotDevice = await this.iotDeviceService.findOne(testDto.iotDeviceId);

    if (dataTarget.type === DataTargetType.MQTT && !testDto.dataPackage) {
      const result = await this.dataTargetSenderService.testMqttDataTarget(dataTarget);
      return { result: result };
    }

    let rawPackage = JSON.parse(testDto.dataPackage);
    if (testDto.payloadDecoderId) {
      const payloadDecoder = await this.payloadDecoderService.findOne(testDto.payloadDecoderId);
      if (iotDevice.type === IoTDeviceType.LoRaWAN && payloadDecoder.decodingFunction.includes("lorawanSettings")) {
        iotDevice = await this.chirpstackDeviceService.enrichLoRaWANDevice(iotDevice);
      }

      const decoded = await this.payloadDecoderExecutorService.callUntrustedCode(
        payloadDecoder.decodingFunction,
        iotDevice,
        rawPackage
      );
      rawPackage = JSON.parse(decoded);
    }

    const payloadDto: TransformedPayloadDto = {
      payload: rawPackage,
      payloadDecoderId: testDto.payloadDecoderId,
      iotDeviceId: testDto.iotDeviceId,
    };

    if (dataTarget.type === DataTargetType.Fiware) {
      const fiwareDatatarget = await this.findOneWithClientSecret(testDto.dataTargetId);
      (dataTarget as FiwareDataTarget).clientSecret = (fiwareDatatarget as FiwareDataTarget).clientSecret;
    }
    const result = await this.dataTargetSenderService.sendToDataTarget(dataTarget, payloadDto);
    return {
      result,
      decodedPayload: rawPackage,
    };
  }

  private async mapDtoToDataTarget(dataTargetDto: CreateDataTargetDto, dataTarget: DataTarget): Promise<DataTarget> {
    dataTarget.name = dataTargetDto.name;
    if (dataTargetDto.organizationId != null) {
      try {
        dataTarget.organization = await this.organizationService.findById(dataTargetDto.organizationId);
      } catch (err) {
        this.logger.error(`Could not find organization with id: ${dataTargetDto.organizationId}`);
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
    o.keywordTags = dto.keywordTags;
    o.resourceTitle = dto.resourceTitle;

    o.updateFrequency = dto.updateFrequency;
    o.documentationUrl = dto.documentationUrl;
    o.dataDirectory = dto.dataDirectory;
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

  private hideDataTargetSecret(dataTarget: DataTarget) {
    switch (dataTarget.type) {
      case DataTargetType.HttpPush:
        (dataTarget as HttpPushDataTarget).authorizationHeader = "***";
        break;
      case DataTargetType.MQTT:
        (dataTarget as MqttDataTarget).mqttPassword = "***";
        break;
      case DataTargetType.OpenDataDK:
        break;
      case DataTargetType.Fiware:
        (dataTarget as FiwareDataTarget).authorizationHeader = "***";
        (dataTarget as FiwareDataTarget).clientSecret = "***";
        break;
    }
  }
}
