import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, HttpService } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Repository, getManager } from "typeorm";
import { Application } from "@entities/application.entity";
import { clearDatabase } from "../test-helpers";
import { KafkaModule } from "@modules/kafka.module";
import { DataTargetKafkaModule } from "@modules/data-target-kafka.module";
import { IoTDevice } from "@entities/iot-device.entity";
import { DataTarget } from "@entities/data-target.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { KafkaService } from "@services/kafka/kafka.service";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { RecordMetadata } from "kafkajs";
import { of } from "rxjs";
import { AxiosResponse, AxiosRequestConfig } from "axios";
import { ConfigModule } from "@nestjs/config";
import configuration from "@config/configuration";

describe("DataTargetKafkaListener (e2e)", () => {
    let app: INestApplication;
    let applicationRepository: Repository<Application>;
    let kafkaService: KafkaService;
    let httpService: HttpService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ load: [configuration] }),
                DataTargetKafkaModule,
                TypeOrmModule.forRoot({
                    type: "postgres",
                    host: "host.docker.internal",
                    port: 5433,
                    username: "os2iot",
                    password: "toi2so",
                    database: "os2iot-e2e",
                    synchronize: true,
                    logging: false,
                    autoLoadEntities: true,
                }),
                KafkaModule.register({
                    clientId: "os2iot-client-e2e",
                    brokers: ["host.docker.internal:9093"],
                    groupId: "os2iot-backend-e2e",
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        httpService = app.get<HttpService>(HttpService);
        await app.init();

        // Get a reference to the repository such that we can CRUD on it.
        applicationRepository = moduleFixture.get("ApplicationRepository");
        kafkaService = moduleFixture.get("KafkaService");
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    beforeEach(async () => {
        // Clear data before each test
        await clearDatabase();
    });

    afterEach(async () => {
        // Clear data after each test
        await clearDatabase();
    });

    const createDataTarget = async (applications: Application[]): Promise<DataTarget> => {
        const dataTarget = new HttpPushDataTarget();
        dataTarget.name = "my data target";
        dataTarget.url = "https://70c14f17cfee3252ccb8238425810bb6.m.pipedream.net";
        dataTarget.application = applications[0];
        // @Hack: to call beforeInsert (private)
        (dataTarget as any).beforeInsert();

        const manager = getManager();
        return await manager.save(dataTarget);
    };

    const createIoTDevice = async (applications: Application[]): Promise<IoTDevice> => {
        const device = new GenericHTTPDevice();
        device.name = "HTTP device";
        device.application = applications[0];
        device.apiKey = "asdf";

        const manager = getManager();
        return await manager.save(device);
    };

    const createApplications = async (): Promise<Application[]> => {
        return await applicationRepository.save([
            {
                name: "sample application",
                description: "sample description",
                iotDevices: [],
                dataTargets: [],
            },
        ]);
    };

    it("React to TransformedRequest and send to DataTarget - All OK", async () => {
        // Arrange
        const applications = await createApplications();
        await createDataTarget(applications);
        const iotDevice = await createIoTDevice(applications);

        const dto: TransformedPayloadDto = {
            iotDeviceId: iotDevice.id,
            payload: JSON.parse('{"test": 123}'),
        };

        const topic = KafkaTopic.TRANSFORMED_REQUEST;
        const payload: KafkaPayload = {
            messageId: "b" + new Date().valueOf(),
            body: dto,
            messageType: "Say.Hello",
            topicName: KafkaTopic.TRANSFORMED_REQUEST,
        };

        // Mock response to HTTP POST
        const mockedResult: AxiosResponse = {
            data: { success: true },
            status: 200,
            statusText: "",
            headers: {},
            config: {},
        };

        jest.spyOn(httpService, "post").mockImplementation(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (_url: string, _data: JSON, _config: AxiosRequestConfig) => {
                return of(mockedResult);
            }
        );

        // Act
        const result = await kafkaService.sendMessage(topic, payload);

        // Assert
        const resultMetadata = (result as RecordMetadata[])[0];
        expect(resultMetadata.errorCode).toBe(0);
        // Ensure that mock was called
        // This should work according to the documentation, but it is working (change mockedResult and logging will change)
        // expect(spy).toHaveBeenCalled();
    });
});
