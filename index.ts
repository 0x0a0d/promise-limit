import { ensureLimit, getOrderResults } from './src/utils'

type FunctionIterator<R = any, T = any> = (item: T, index: number, items: T[])=> R | Promise<R>
type FunctionIndexIterator = (index: number)=> void | Promise<void>
type FunctionCondition = ()=> boolean | Promise<boolean>
type FunctionGenerator<R = any, P = any> = (params?: P)=> R | Promise<R>
type FunctionWhileIterator<R = any> = (resolvedFromGenerator: R)=> void | Promise<void>

const PromiseLimitLoop = {
  async map<R = any, T = any>(items: T[], limit: number, iterator: FunctionIterator<R, (typeof items)[number]>): Promise<R[]> {
    limit = ensureLimit(limit)

    const executing: Promise<void>[] = []
    const results: {[k: string]: R} = {}

    let i = 0
    while (items.length > i) {
      while (executing.length < limit && items.length > i) {
        let e: Promise<void>
        const queue = async(index: number): Promise<void> => {
          return Promise.resolve(iterator(items[index], index, items)).then((result) => {
            results[index] = result
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

  async forEach<R = any, T = any>(items: T[], limit: number, iterator: FunctionIterator<R, (typeof items)[number]>): Promise<void> {
    limit = ensureLimit(limit)

    const executing: Promise<void>[] = []

    let i = 0
    while (items.length > i) {
      while (executing.length < limit && items.length > i) {
        let e: Promise<void>
        const queue = async(index: number): Promise<void> => {
          return Promise.resolve(iterator(items[index], index, items)).then(() => {
            executing.splice(executing.indexOf(e), 1)
          })
        }
        executing.push(e = queue(i++))
      }
      executing.length && await Promise.race(executing)
    }
    await Promise.all(executing)
  },

  async for(from: number, to: number, limit: number, iterator: FunctionIndexIterator, step = 1): Promise<void> {
    limit = ensureLimit(limit)

    const executing: Promise<void>[] = []

    let i: number = from

    if (step > 0) {
      if (from > to) {
        throw new Error(`from '${from}' can not greater than to '${to}'`)
      }
      while (i <= to) {
        while (i <= to && executing.length < limit) {
          let e
          const queue = async(index: number) => {
            return Promise.resolve(iterator(index)).then(() => {
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
          let e
          const queue = async(index: number) => {
            return Promise.resolve(iterator(index)).then(() => {
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
    const executing: Promise<void>[] = []
    do {
      do {
      // noinspection DuplicatedCode
        let e
        const queue = async(promise: Promise<R>) => {
          return promise.then((data) => {
            return Promise.resolve(iterator(data))
          }).then(() => {
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
    const executing: Promise<void>[] = []
    while (await conditionFunc()) {
      while (await conditionFunc() && executing.length < limit) {
      // noinspection DuplicatedCode
        let e
        const queue = async(promise: Promise<R>) => {
          return promise.then((data) => {
            return Promise.resolve(iterator(data))
          }).then(() => {
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
