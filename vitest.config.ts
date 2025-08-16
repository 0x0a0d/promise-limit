import { defineConfig } from 'vitest/config'
import fs from 'node:fs'
import path from 'path'

const jestInitFile = path.join(__dirname, 'jest.init.ts')

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: fs.existsSync(jestInitFile) ? [jestInitFile] : [],
    typecheck: {
      tsconfig: path.resolve(__dirname, 'tsconfig.test.json'),
    },
    pool: 'threads',
  },
})
