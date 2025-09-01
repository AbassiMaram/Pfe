module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
     '^@/(.*)$': '<rootDir>/src/$1',
    // Ajoute cette ligne pour gérer les imports depuis `app/components` :
    '^@/components/(.*)$': '<rootDir>/app/components/$1',
  }
}