module.exports = {
    moduleNameMapper: {
        "^@services/(.*)": "<rootDir>//src/services/$1",
        "^@admin-controller/(.*)":
            "<rootDir>//src/controllers/admin-controller/$1",
        "^@device-data-controller/(.*)":
            "<rootDir>//src/controllers/device-data-controller/$1",
        "^@user-management-controller/(.*)":
            "<rootDir>//src/controllers/user-management/$1",
        "^@dto/(.*)": "<rootDir>//src/entities/dto/$1",
        "^@interfaces/(.*)": "<rootDir>//src/entities/interfaces/$1",
        "^@enum/(.*)": "<rootDir>//src/entities/enum/$1",
        "^@entities/(.*)": "<rootDir>//src/entities/$1",
        "^@modules/(.*)": "<rootDir>//src/modules/$1",
        "^@loaders/(.*)": "<rootDir>//src/loaders/$1",
        "^@auth/(.*)": "<rootDir>//src/auth/$1",
        "^@helpers/(.*)": "<rootDir>//src/helpers/$1",
        "^@config/(.*)": "<rootDir>//src/config/$1",
        "^@resources/(.*)": "<rootDir>//src/resources/$1",
    },
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: ".",
    testEnvironment: "node",
    testMatch: ["<rootDir>/test/**/*.e2e-spec.{ts,js}"],
    transform: {
        "^.+\\.(t|j)s$": "ts-jest",
    },
    coverageDirectory: "./coverage-e2e",
    setupFiles: ["<rootDir>/.jest/setEnvVars.ts"],
};
