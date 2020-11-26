import { INestApplication, Logger } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import configuration from "@config/configuration";
import { AuthModule } from "@modules/user-management/auth.module";
import { clearDatabase, generateSavedKombitUser } from "../test-helpers";
import { KombitStrategy } from "@auth/kombit.strategy";
import { getManager } from "typeorm";
import { User } from "@entities/user.entity";

describe("KombitStrategy (e2e)", () => {
    let app: INestApplication;
    let jwtService: JwtService;
    let kombitStrategy: KombitStrategy;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ load: [configuration] }),
                AuthModule,
                PassportModule.register({ defaultStrategy: "jwt" }),
                JwtModule.register({
                    secret: "secretKey-os2iot-secretKey",
                    signOptions: { expiresIn: "9h" },
                }),
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
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        jwtService = moduleFixture.get("JwtService");
        kombitStrategy = moduleFixture.get("KombitStrategy");
    });

    beforeEach(async () => {
        await clearDatabase();
    });

    afterEach(async () => {
        await clearDatabase();
        // Ensure clean shutdown
        await app.close();
    });

    test.skip("KombitStrategy - no user exists", async () => {
        // Arrange
        const nameId = "C=DK,O=14814833,CN=TBK-OS2IoT-test,Serial=os2iot";
        const profile = `{"issuer":"https://saml.adgangsstyring.eksterntest-stoettesystemerne.dk","inResponseTo":"_9fb77d5e846bcce90a14","sessionIndex":"1865835509","nameID":"${nameId}","nameIDFormat":"urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName","dk:gov:saml:attribute:CvrNumberIdentifier":"14814833","dk:gov:saml:attribute:KombitSpecVer":"1.0","dk:gov:saml:attribute:SpecVer":"DK-SAML-2.0","dk:gov:saml:attribute:AssuranceLevel":"4"}`;

        // Act
        await kombitStrategy.validate(JSON.parse(profile), (err: any, res: any) => {
            Logger.log(`Callback called with err? ${err != null}. res? ${res != null}`);
            expect(err).toBeNull();
            expect(res).toMatchObject({
                nameId: nameId,
            });
        });

        // Assert
        const users = await getManager().find(User);
        expect(users).toHaveLength(1);
        expect(users[0]).toMatchObject({
            nameId: nameId,
        });
    });

    test.skip("KombitStrategy - match existing user exists", async () => {
        // Arrange
        const nameId = "C=DK,O=14814833,CN=TBK-OS2IoT-test,Serial=os2iot";
        const profile = `{"issuer":"https://saml.adgangsstyring.eksterntest-stoettesystemerne.dk","inResponseTo":"_9fb77d5e846bcce90a14","sessionIndex":"1865835509","nameID":"${nameId}","nameIDFormat":"urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName","dk:gov:saml:attribute:CvrNumberIdentifier":"14814833","dk:gov:saml:attribute:KombitSpecVer":"1.0","dk:gov:saml:attribute:SpecVer":"DK-SAML-2.0","dk:gov:saml:attribute:AssuranceLevel":"4"}`;
        const user = await generateSavedKombitUser(nameId);

        // Act
        await kombitStrategy.validate(JSON.parse(profile), (err: any, res: any) => {
            Logger.log(`Callback called with err? ${err != null}. res? ${res != null}`);
            expect(err).toBeNull();
            expect(res).toMatchObject({
                id: user.id,
                nameId: nameId,
            });
        });

        // Assert
        const users = await getManager().find(User);
        expect(users).toHaveLength(1);
        expect(users[0]).toMatchObject({
            id: user.id,
            nameId: nameId,
        });
    });
});
