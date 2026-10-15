export default {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    },
    moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
    moduleNameMapper: {
        "\\.(svg|png|jpe?g|gif|webp)$": "<rootDir>/src/__mocks__/file-stub.js",
        "^@/(.*)$": "<rootDir>/src/$1",
    },
};
