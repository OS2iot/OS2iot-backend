import { Test, TestingModule } from "@nestjs/testing";

import { AuthorizationType } from "@enum/authorization-type.enum";
import { HttpPushDataTargetData } from "@interfaces/http-push-data-target-data.interface";
import { FiwareDataTargetService } from "@services/data-targets/fiware-data-target.service";
import { FiwareDataTargetConfiguration } from "@interfaces/fiware-data-target-configuration.interface";
import { HttpService } from "@nestjs/axios";

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

    it("check headers without context with authorizationHeader", () => {
        const config: FiwareDataTargetConfiguration = {
            url: "http://example.com/endpoint",
            timeout: 1337,
            authorizationType: AuthorizationType.HEADER_BASED_AUTHORIZATION,
            authorizationHeader: "Bearer AbCdEf123456",
        };

        const res = service.makeAxiosConfiguration(config);

        expect(res).toMatchObject({
            timeout: 1337,
            headers: {
                "Content-Type": "application/ld+json",
                Authorization: "Bearer AbCdEf123456",
            },
        });
    });

    it("check headers with context and tenant", () => {
        const config: FiwareDataTargetConfiguration = {
            url: "http://example.com/endpoint",
            timeout: 0,
            authorizationType: AuthorizationType.NO_AUTHORIZATION,
            context: "http://contextfile.json",
            tenant: "Test"
        };

        const res = service.makeAxiosConfiguration(config);

        expect(res).toMatchObject({
            timeout: 0,
            headers: {
                "Content-Type": "application/json",
                "Link":  '<http://contextfile.json>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"',
                "NGSILD-Tenant": 'Test',
            },
        });
    });


});
