import { ensureLimit, getOrderResults } from './src/utils'

type FunctionIterator<R = any, T = any> = (item: T, index: number, items: T[]) => R | Promise<R>
type FunctionIndexIterator = (index: number) => any | Promise<any>
type FunctionCondition = () => boolean | Promise<boolean>
type FunctionGenerator<R = any, P = any> = (params?: P) => R | Promise<R>
type FunctionWhileIterator<R = any> = (resolvedFromGenerator: R) => any | Promise<any>

const PromiseLimitLoop = {
  async map<R = any, T = any>(items: T[], limit: number, iterator: FunctionIterator<R, (typeof items)[number]>): Promise<R[]> {
    limit = ensureLimit(limit)

    const executing: any[] = []
    const results: {[k: string]: R} = {}

    let i: number = 0
    while (items.length > i) {
      while (executing.length < limit && items.length > i) {
        let e: Promise<void>
        const queue = async(index: number) => {
          return Promise.resolve(iterator(items[index], index, items)).then((result) => {
            results[index] = result
          }).finally(() => {
            executing.splice(executing.indexOf(e), 1)
          })
        }
        executing.push(e = queue(i++))
      }
      executing.length && await Promise.race(executing)
    }
    await Promise.all(executing)

    return getOrderResults<R>(results, items.length)
  },

  async forEach<T = any>(items: T[], limit: number, iterator: FunctionIterator<any, (typeof items)[number]>): Promise<void> {
    limit = ensureLimit(limit)

    const executing: any[] = []

    let i: number = 0
    while (items.length > i) {
      while (executing.length < limit && items.length > i) {
        let e: Promise<void>
        const queue = async(index: number) => {
          return Promise.resolve(iterator(items[index], index, items)).finally(() => {
            executing.splice(executing.indexOf(e), 1)
          })
        }
        executing.push(e = queue(i++))
      }
      executing.length && await Promise.race(executing)
    }
    await Promise.all(executing)
  },

  async for(from: number, to: number, limit: number, iterator: FunctionIndexIterator, step: number = 1): Promise<void> {
    limit = ensureLimit(limit)

    const executing: any[] = []

    let i: number = from

    if (step > 0) {
      if (from > to) {
        throw new Error(`from '${from}' can not greater than to '${to}'`)
      }
      while (i <= to) {
        while (i <= to && executing.length < limit) {
          let e: any
          const queue = async(index: number) => {
            return Promise.resolve(iterator(index)).finally(() => {
              executing.splice(executing.indexOf(e), 1)
            })
          }
          executing.push(e = queue(i))
          i += step
        }
        executing.length && await Promise.race(executing)
      }
    } else {
      if (from < to) {
        throw new Error(`from '${from}' can not less than to '${to}'`)
      }
      while (i >= to) {
        while (i >= to && executing.length < limit) {
          let e: any
          const queue = async(index: number) => {
            return Promise.resolve(iterator(index)).finally(() => {
              executing.splice(executing.indexOf(e), 1)
            })
          }
          executing.push(e = queue(i))
          i += step
        }
        executing.length && await Promise.race(executing)
      }
    }
  },

  async doWhile<R = any, P = any>(conditionFunc: FunctionCondition, generatorFunc: FunctionGenerator<R, P>, limit: number, iterator: FunctionWhileIterator<R>, generatorParams?: P): Promise<void> {
    const executing: any[] = []
    do {
      do {
        // noinspection DuplicatedCode
        let e: any
        const queue = async(promise: Promise<R>) => {
          return promise.then((data) => {
            return Promise.resolve(iterator(data))
          }).finally(() => {
            executing.splice(executing.indexOf(e), 1)
          })
        }
        executing.push(e = queue(Promise.resolve(generatorFunc(generatorParams))))
      } while (await conditionFunc() && executing.length < limit)
      executing.length && await Promise.race(executing)
    } while (await conditionFunc())
    await Promise.all(executing)
  },

  async while<R = any, P = any>(conditionFunc: FunctionCondition, generatorFunc: FunctionGenerator<R, P>, limit: number, iterator: FunctionWhileIterator<R>, generatorParams?: P): Promise<void> {
    const executing: any[] = []
    while (await conditionFunc()) {
      while (await conditionFunc() && executing.length < limit) {
        // noinspection DuplicatedCode
        let e: any
        const queue = async(promise: Promise<R>) => {
          return promise.then((data) => {
            return Promise.resolve(iterator(data))
          }).finally(() => {
            executing.splice(executing.indexOf(e), 1)
          })
        }
        executing.push(e = queue(Promise.resolve(generatorFunc(generatorParams))))
      }
      executing.length && await Promise.race(executing)
    }
    await Promise.all(executing)
  },
}

export = PromiseLimitLoop
