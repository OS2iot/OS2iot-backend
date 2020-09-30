import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";

import { SigFoxAdministrationModule } from "@modules/device-integrations/sigfox-administration.module";
import { GenericSigfoxAdministationService } from "@services/sigfox/generic-sigfox-administation.service";
import { SigFoxGroup } from "@entities/sigfox-group.entity";

describe("GenericSigfoxAdministationService (e2e)", () => {
    let app: INestApplication;
    let service: GenericSigfoxAdministationService;
    let sigfoxGroup: SigFoxGroup;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
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
                SigFoxAdministrationModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
        service = moduleFixture.get("GenericSigfoxAdministationService");

        sigfoxGroup = new SigFoxGroup();
        sigfoxGroup.username = "5f2d1069e833d903621ff237";
        sigfoxGroup.password = "73cf3fdbd66bf62f1c4180b68f707135";
    });

    afterAll(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    it("(GET) {{base_url}}/api-users/5f2d1069e833d903621ff237", async () => {
        // Arrange

        // Act
        const res = await service.get("api-users/5f2d1069e833d903621ff237", sigfoxGroup);

        // Assert
        expect(res).toMatchObject({
            id: "5f2d1069e833d903621ff237",
        });
    });
});
