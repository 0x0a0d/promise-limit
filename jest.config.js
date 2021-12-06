const fs = require('fs')
const { join } = require('path')

const jestInitFile = join(__dirname, 'jest.init.js')

module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: {
        sourceMap: true,
      },
    },
  },
  setupFiles: [].concat(
    fs.existsSync(jestInitFile) ? jestInitFile : [],
  ),
}
