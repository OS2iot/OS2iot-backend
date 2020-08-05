import { Test, TestingModule } from "@nestjs/testing";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";
import { HttpService } from "@nestjs/common";
import { AuthorizationType } from "@enum/authorization-type.enum";
import { HttpPushDataTargetConfiguration } from "@interfaces/http-push-data-target-configuration.interface";
import { HttpPushDataTargetData } from "@interfaces/http-push-data-target-data.interface";

describe("DataTargetService", () => {
    let service: HttpPushDataTargetService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HttpPushDataTargetService,
                {
                    provide: HttpService,
                    useValue: {
                        post: jest.fn().mockResolvedValue([{}]),
                    },
                },
            ],
        }).compile();

        service = module.get<HttpPushDataTargetService>(
            HttpPushDataTargetService
        );
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    it("makeAxiosConfiguration - translate config and data", () => {
        const config: HttpPushDataTargetConfiguration = {
            url: "http://example.com/endpoint",
            timeout: 1337,
            authorizationType: AuthorizationType.HEADER_BASED_AUTHORIZATION,
            authorizationHeader: "Bearer AbCdEf123456",
        };
        const data: HttpPushDataTargetData = {
            rawBody: '{"some_key": "some_value"}',
            mimeType: "application/json",
        };

        const res = HttpPushDataTargetService.makeAxiosConfiguration(
            config,
            data
        );

        expect(res).toMatchObject({
            timeout: 1337,
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer AbCdEf123456",
            },
        });
    });
});
