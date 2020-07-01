module.exports = {
    moduleNameMapper: {
        "^@services/(.*)": "<rootDir>//src/services/$1",
        "^@admin-controller/(.*)": "<rootDir>//src/admin-controller/$1",
        "^@device-data-controller/(.*)":
            "<rootDir>//src/device-data-controller/$1",
        "^@dto/(.*)": "<rootDir>//src/entities/dto/$1",
        "^@entities/(.*)": "<rootDir>//src/entities/$1",
        "^@modules/(.*)": "<rootDir>//src/modules/$1",
        "^@loaders/(.*)": "<rootDir>//src/loaders/$1",
    },
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: ".",
    testEnvironment: "node",
    testMatch: ["<rootDir>/test/**/*.e2e-spec.{ts,js}"],
    transform: {
        "^.+\\.(t|j)s$": "ts-jest",
    },
    coverageDirectory: "./coverage-e2e",
};
