import { Test, TestingModule } from "@nestjs/testing";

import { DefaultController } from "@admin-controller/default.controller";
import { NoOpLogger } from "test/e2e/no-op-logger";

describe("DefaultController", () => {
    let appController: DefaultController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [DefaultController],
        }).compile();
        app.useLogger(new NoOpLogger());

        appController = app.get<DefaultController>(DefaultController);
    });

    describe("root", () => {
        it('should return "OS2IoT backend - See /api/v1/docs for Swagger"', () => {
            expect(appController.getDefault()).toBe(
                "OS2IoT backend - See /api/v1/docs for Swagger"
            );
        });
    });
});
