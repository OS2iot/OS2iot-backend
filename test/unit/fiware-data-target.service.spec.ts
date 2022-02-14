import { HttpService } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { AuthorizationType } from "@enum/authorization-type.enum";
import { HttpPushDataTargetConfiguration } from "@interfaces/http-push-data-target-configuration.interface";
import { HttpPushDataTargetData } from "@interfaces/http-push-data-target-data.interface";
import { FiwareDataTargetService } from "@services/data-targets/fiware-data-target.service";

describe("FiwareDataTargetService", () => {
    let service: FiwareDataTargetService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FiwareDataTargetService,
                {
                    provide: HttpService,
                    useValue: {
                        post: jest.fn().mockResolvedValue([{}]),
                    },
                },
            ],
        }).compile();

        service = module.get<FiwareDataTargetService>(FiwareDataTargetService);
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
            context: ""
        };

        const res = FiwareDataTargetService.makeAxiosConfiguration(config, data);

        expect(res).toMatchObject({
            timeout: 1337,
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer AbCdEf123456",
            },
        });
    });
});
