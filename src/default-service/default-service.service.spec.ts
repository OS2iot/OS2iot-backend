import { Test, TestingModule } from "@nestjs/testing";
import { HealthCheckService } from "../services/health/health-check.service";

describe("DefaultServiceService", () => {
  let service: HealthCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthCheckService],
    }).compile();

    service = module.get<HealthCheckService>(HealthCheckService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
