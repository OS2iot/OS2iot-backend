module.exports = {
    // To generate these from tsconfig.json: https://github.com/kulshekhar/ts-jest/issues/414#issuecomment-502424036
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    moduleNameMapper: {
        "^@services/(.*)": "<rootDir>//src/services/$1",
        "^@admin-controller/(.*)": "<rootDir>//src/admin-controller/$1",
        "^@device-data-controller/(.*)":
            "<rootDir>//src/device-data-controller/$1",
        "^@dto/(.*)": "<rootDir>//src/entities/dto/$1",
        "^@interfaces/(.*)": "<rootDir>//src/entities/interfaces/$1",
        "^@enum/(.*)": "<rootDir>//src/entities/enum/$1",
        "^@entities/(.*)": "<rootDir>//src/entities/$1",
        "^@modules/(.*)": "<rootDir>//src/modules/$1",
        "^@loaders/(.*)": "<rootDir>//src/loaders/$1",
    },
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: "./",
    testMatch: ["<rootDir>/test/**/*spec.{ts,js}"],
    transform: {
        "^.+\\.(t|j)s$": "ts-jest",
    },
    coverageDirectory: "coverage",
    coverageReporters: ["text", "cobertura"],
    testEnvironment: "node",
    setupFiles: ["<rootDir>/.jest/setEnvVars.ts"],
};
