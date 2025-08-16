import { getOrderResults } from './src/utils'

type FunctionIterator<R = any, T = any> = (item: T, index: number, items: T[])=> R | Promise<R>
type FunctionIndexIterator = (index: number)=> any | Promise<any>
type FunctionCondition = ()=> boolean | Promise<boolean>
type FunctionGenerator<R = any, P = any> = (params?: P)=> R | Promise<R>
type FunctionWhileIterator<R = any> = (resolvedFromGenerator: R)=> any | Promise<any>
declare function HandleLimit(increaseOrDecrease?: number, directlySetToLimit?: boolean): number
type FunctionParallelIterator = (handleLimit: typeof HandleLimit)=> any | Promise<any>
type FunctionLimitExecute = (executing: Promise<any>[])=> number

const PromiseLimitLoop = {
  /**
   * Map items with limit, return an array with results of execution
   */
  async map<R = any, T = any>(items: T[], limit: number | FunctionLimitExecute, iterator: FunctionIterator<R, (typeof items)[number]>): Promise<R[]> {
    const getLimit = typeof limit === 'function' ? limit : () => limit

    const executing: any[] = []
    const results: {[k: string]: R} = {}

    let i = 0
    while (items.length > i) {
      while (executing.length < getLimit(executing) && items.length > i) {
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

  /**
   * Pass each item in arrays to iterator with limit, return nothing
   */
  async forEach<T = any>(items: T[], limit: number | FunctionLimitExecute, iterator: FunctionIterator<any, (typeof items)[number]>): Promise<void> {
    const getLimit = typeof limit === 'function' ? limit : () => limit

    const executing: any[] = []

    let i = 0
    while (items.length > i) {
      while (executing.length < getLimit(executing) && items.length > i) {
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

  /**
   * Increase number and pass to iterator with limit of execution, return nothing
   */
  async for(from: number, to: number, limit: number | FunctionLimitExecute, iterator: FunctionIndexIterator, step = 1): Promise<void> {
    const getLimit = typeof limit === 'function' ? limit : () => limit

    const executing: any[] = []

    let i: number = from

    if (step > 0) {
      if (from > to) {
        throw new Error(`from '${from}' can not greater than to '${to}'`)
      }
      while (i <= to) {
        while (i <= to && executing.length < getLimit(executing)) {
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
        while (i >= to && executing.length < getLimit(executing)) {
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
    await Promise.all(executing)
  },

  /**
   * pass result of generator function to iterator with limit of execution, then check result return from condition function,
   * if condition function return true, continue to next iteration, otherwise stop the loop
   * - conditionFunc: function that return a promise of truly or falsy value
   * - generatorFunc: function that return a value that used as parameter for iterator
   * - limit: number of execution in parallel, or a function that return number of execution in parallel
   * - iterator: function that receive result of generator function
   * - generatorParams: parameter for generator function
   */
  async doWhile<R = any, P = any>(conditionFunc: FunctionCondition, generatorFunc: FunctionGenerator<R, P>, limit: number | FunctionLimitExecute, iterator: FunctionWhileIterator<R>, generatorParams?: P): Promise<void> {
    const getLimit = typeof limit === 'function' ? limit : () => limit
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
      } while (await conditionFunc() && executing.length < getLimit(executing))
      executing.length && await Promise.race(executing)
    } while (await conditionFunc())
    await Promise.all(executing)
  },

  /**
   * check condition function, if truly, execute generator function and pass the result to iterator function
   * - conditionFunc: function that return a promise of truly or falsy value
   * - generatorFunc: function that return a value that used as parameter for iterator
   * - limit: number of execution in parallel, or a function that return number of execution in parallel
   * - iterator: function that receive result of generator function
   * - generatorParams: parameter for generator function
   */
  async while<R = any, P = any>(conditionFunc: FunctionCondition, generatorFunc: FunctionGenerator<R, P>, limit: number | FunctionLimitExecute, iterator: FunctionWhileIterator<R>, generatorParams?: P): Promise<void> {
    const getLimit = typeof limit === 'function' ? limit : () => limit
    const executing: any[] = []

    while (await conditionFunc()) {
      while (await conditionFunc() && executing.length < getLimit(executing)) {
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

  /**
   * execute parallelFunc in parallel with limit of execution
   * - limit: number of execution in parallel
   * - parallelFunc: function that receive function `handleLimit` to change limit of execution, and `directlySetToLimit` to set limit directly (ignore counting)
   * - handleLimit: If you want to add more execution, call the function with positive number, otherwise call with negative number. If you call `handleLimit` with non or null parameter, it will return current limit. The execution will stop if `limit` is less than or equal to 0
   */
  async parallel(limit: number, parallelFunc: FunctionParallelIterator) {
    const executing: any[] = []
    const handleLimit = (increaseOrDecrease?: number, directlySetToLimit?: boolean) => {
      if (directlySetToLimit) {
        if (typeof increaseOrDecrease !== 'number' || isNaN(increaseOrDecrease)) {
          throw new Error('limit must be a number')
        }
        limit = increaseOrDecrease
        if (increaseOrDecrease > limit) {
          addQueue()
        }
        return limit
      }
      if (!increaseOrDecrease) return limit
      if (typeof increaseOrDecrease !== 'number' || isNaN(increaseOrDecrease)) {
        throw new Error('limit must be a number')
      }
      limit += increaseOrDecrease
      if (increaseOrDecrease > 0) {
        addQueue()
      }
      return limit
    }

    const addQueue = () => {
      let e: any
      const queue = async() => {
        return Promise.resolve(parallelFunc(handleLimit)).finally(() => {
          executing.splice(executing.indexOf(e), 1)
        })
      }
      executing.push(e = queue())
    }

    // eslint-disable-next-line no-unmodified-loop-condition
    while (limit > 0) {
      while (executing.length < limit) {
        addQueue()
      }
      executing.length && await Promise.race(executing)
    }

    await Promise.all(executing)
  },
}

export = PromiseLimitLoop
