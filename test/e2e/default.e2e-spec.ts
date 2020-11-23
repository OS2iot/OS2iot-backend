import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { DefaultModule } from "@modules/default.module";

describe("DefaultController (e2e)", () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [DefaultModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    test.skip("/ (GET)", done => {
        return request(app.getHttpServer())
            .get("/")
            .expect(200)
            .expect("OS2IoT backend - See /api/v1/docs for Swagger")
            .end(done);
    });
});
