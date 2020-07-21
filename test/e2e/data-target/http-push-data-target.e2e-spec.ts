import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { DataTargetSenderModule } from "@modules/data-target-sender.module";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";
import { AuthorizationType } from "@enum/authorization-type.enum";
import { SendStatus } from "@enum/send-status.enum";
import { HttpPushDataTargetConfiguration } from "@interfaces/http-push-data-target-configuration.interface";
import { HttpPushDataTargetData } from "@interfaces/http-push-data-target-data.interface";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";

describe("HttpPushDataTargetService (e2e)", () => {
    let app: INestApplication;
    let httpPushDataTargetService: HttpPushDataTargetService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [DataTargetSenderModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        httpPushDataTargetService = moduleFixture.get(
            "HttpPushDataTargetService"
        );
    });

    it("Send to requestbin", async () => {
        // Arrange
        const config: HttpPushDataTargetConfiguration = {
            url: "https://70c14f17cfee3252ccb8238425810bb6.m.pipedream.net",
            timeout: 30000,
            authorizationType: AuthorizationType.NO_AUTHORIZATION,
        };
        const data: HttpPushDataTargetData = {
            rawBody: '{"some_key": "some_value"}',
            mimeType: "application/json",
        };

        // Act
        const res: DataTargetSendStatus = await httpPushDataTargetService.send(
            config,
            data
        );

        // Assert
        expect(res.status).toBe(SendStatus.OK);
    });
});
