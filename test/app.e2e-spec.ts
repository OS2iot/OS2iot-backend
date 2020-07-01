import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";

describe("AppController (e2e)", () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        // Ensure clean shutdown
        await app.close();
    });

    it("/ (GET)", (done) => {
        return request(app.getHttpServer())
            .get("/")
            .expect(200)
            .expect("OS2IoT backend - See /api/v1/docs for Swagger")
            .end(done);
    });
});
