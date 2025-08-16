import path from 'path'

// @ts-ignore
import('dotenv').then(dotenv => {
  dotenv.config({
    path: path.join(__dirname, '.env.jest'),
  })

  if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('test')) {
    throw new Error('This test should only run against a test database.')
  }
}).catch(e => {
  if (e.code !== 'MODULE_NOT_FOUND') {
    throw e
  }
})

// @ts-ignore
if (typeof vitest !== 'undefined') {
  // @ts-ignore
  global.jest = vitest
}

process.env.NODE_ENV = 'test'
