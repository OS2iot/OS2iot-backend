import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { AuthorizationType } from "@enum/authorization-type.enum";
import { SendStatus } from "@enum/send-status.enum";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { HttpPushDataTargetConfiguration } from "@interfaces/http-push-data-target-configuration.interface";
import { HttpPushDataTargetData } from "@interfaces/http-push-data-target-data.interface";
import { DataTargetSenderModule } from "@modules/data-target/data-target-sender.module";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";

describe("HttpPushDataTargetService (e2e)", () => {
    let app: INestApplication;
    let httpPushDataTargetService: HttpPushDataTargetService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [DataTargetSenderModule],
        }).compile();
        moduleFixture.useLogger(false);

        app = moduleFixture.createNestApplication();
        await app.init();

        httpPushDataTargetService = moduleFixture.get("HttpPushDataTargetService");
    });

    // This test verifies that the functionality works by calling it directly to pipedream.
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

    // This test verifies that the functionality can be used to integrtate with Thinksboard (at Aarhus kommune)
    it("Send to integration at Thingsboard", async () => {
        // Arrange
        const config: HttpPushDataTargetConfiguration = {
            url:
                "https://IoT-dataplatform.aarhuskommune.dk/api/v1/integrations/http/e1a7a88c42fa43dfe6204a9443a7554f",
            timeout: 30000,
            authorizationType: AuthorizationType.NO_AUTHORIZATION,
        };
        const data: HttpPushDataTargetData = {
            rawBody: `{
                "relative_humidity_percent": 0.55,
                "temperature_celcius": 23
            }`,
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
