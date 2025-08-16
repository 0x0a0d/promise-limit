import path from 'path'
import fs from 'fs'
import { Config } from 'jest'

const jestInitFile = path.join(__dirname, 'jest.init.ts')

const config: Config = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        sourceMap: true,
      },
    }],
  },
  setupFiles: [].concat(
    fs.existsSync(jestInitFile) ? jestInitFile : [],
  ),
}
export default config
