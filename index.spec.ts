import PromiseLimitLoop from './index'

describe('PromiseLimitLoop', () => {
  let arr: any[]
  beforeEach(() => {
    arr = [...Array(10)].map((_, i) => i)
  })
  it('map', async() => {
    const results = await PromiseLimitLoop.map(arr, 2, item => {
      return item * 2
    })
    expect(results).toEqual([...Array(10)].map((_, i) => i * 2))
  })
  it('forEach', async() => {
    const results = {}
    const result = await PromiseLimitLoop.forEach(arr, 2, (item, index) => {
      results[index] = item * 2
    })
    expect(result).toBeUndefined()
    expect(results).toEqual({ 0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 5: 10, 6: 12, 7: 14, 8: 16, 9: 18 })
  })
  it('for', async() => {
    const next: number[] = []
    expect(await PromiseLimitLoop.for(0, 9, 2, index => {
      next.push(index)
    }, 2)).toBeUndefined()
    expect(next.sort()).toEqual([0, 2, 4, 6, 8])

    const back: number[] = []
    expect(await PromiseLimitLoop.for(9, 0, 2, index => {
      back.push(index)
    }, -2)).toBeUndefined()
    expect(back.sort()).toEqual([1, 3, 5, 7, 9])

    await expect(PromiseLimitLoop.for(1, 2, 2, () => { /**/ }, -1)).rejects.toThrow(`from '1' can not less than to '2'`)
    await expect(PromiseLimitLoop.for(2, 1, 2, () => { /**/ }, 1)).rejects.toThrow(`from '2' can not greater than to '1'`)
  })
  it('doWhile', async() => {
    let i = 0
    const condition = jest.fn(() => i < arr.length)

    await PromiseLimitLoop.doWhile(condition, () => {
      i === 0 && expect(condition).toHaveBeenCalledTimes(0)
      return (i++)
    }, 2, resolvedFromGenerator => {
      arr[resolvedFromGenerator] += resolvedFromGenerator
    })
    expect(arr).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18])
  })
  it('doWhile - with params', async() => {
    let i = 0
    const condition = jest.fn(() => i < arr.length)

    await PromiseLimitLoop.doWhile(condition, (params) => {
      i === 0 && expect(condition).toHaveBeenCalledTimes(0)
      // @ts-ignore
      return (params + i++)
    }, 2, resolvedFromGenerator => {
      arr[resolvedFromGenerator - 3] += resolvedFromGenerator
    }, 3)
    expect(arr).toEqual([3, 5, 7, 9, 11, 13, 15, 17, 19, 21])
  })
  it('while', async() => {
    let i = 0
    const condition = jest.fn(() => i < arr.length)

    await PromiseLimitLoop.while(condition, () => {
      i === 0 && expect(condition).toHaveBeenCalledTimes(2)
      return (i++)
    }, 2, resolvedFromGenerator => {
      arr[resolvedFromGenerator] += resolvedFromGenerator
    })
    expect(arr).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18])
  })
  it('while - with params', async() => {
    let i = 0
    const condition = jest.fn(() => i < arr.length)

    await PromiseLimitLoop.while(condition, (params) => {
      i === 0 && expect(condition).toHaveBeenCalledTimes(2)
      // @ts-ignore
      return (params + i++)
    }, 2, resolvedFromGenerator => {
      arr[resolvedFromGenerator - 3] += resolvedFromGenerator
    }, 3)
    expect(arr).toEqual([3, 5, 7, 9, 11, 13, 15, 17, 19, 21])
  })
  it('test', async() => {
    const start = Date.now()
    await PromiseLimitLoop.for(0, 10, 2, async function(i) {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          console.log(i, Date.now() - start)
          resolve()
        }, 100)
      })
    })
  })
  describe('parallel', () => {
    it('execution', async() => {
      const start = Date.now()
      let timeAnchor = 1e3
      const results = []
      let limit = 2
      await PromiseLimitLoop.parallel(limit, async(handleLimit) => {
        await new Promise(resolve => setTimeout(resolve, 100))
        const time = Date.now() - start
        results.push(time)
        if (time > timeAnchor) {
          timeAnchor += 1e3
          handleLimit(-1)
          limit = handleLimit()
        }
      })
      expect(results[results.length - 1] > 2e3).toBeTruthy()
      expect(limit).toBe(0)
    })
    it('change limit', async() => {
      const tests = [
        [2, 3],
        [-1, 2],
        [null, 2],
      ]
      expect.assertions(3)
      await PromiseLimitLoop.parallel(1, async(handleLimit) => {
        if (!tests.length) {
          handleLimit(0, true)
          return
        }
        const [change, expectLimit] = tests.shift()
        const limit = handleLimit(change)
        expect(limit).toBe(expectLimit)
      })
    })
  })
})

describe('PromiseLimitLoop - function limit edge cases', () => {
  let arr: any[]
  beforeEach(() => {
    arr = [...Array(10)].map((_, i) => i)
  })
  it('map with dynamic limit', async() => {
    let maxExecuting = 0
    const results = await PromiseLimitLoop.map(arr, (executing) => {
      maxExecuting = Math.max(maxExecuting, executing.length)
      return executing.length < 3 ? 3 : 1
    }, item => item * 3)
    expect(results).toEqual([...Array(10)].map((_, i) => i * 3))
    expect(maxExecuting).toBeGreaterThanOrEqual(1)
  })
  it('forEach with dynamic limit', async() => {
    let maxExecuting = 0
    const results: any = {}
    await PromiseLimitLoop.forEach(arr, (executing) => {
      maxExecuting = Math.max(maxExecuting, executing.length)
      return executing.length < 4 ? 4 : 2
    }, (item, index) => {
      results[index] = item * 4
    })
    expect(results).toEqual({ 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36 })
    expect(maxExecuting).toBeGreaterThanOrEqual(2)
  })
  it('for with dynamic limit', async() => {
    let maxExecuting = 0
    const next: number[] = []
    await PromiseLimitLoop.for(0, 9, (executing) => {
      maxExecuting = Math.max(maxExecuting, executing.length)
      return executing.length < 2 ? 2 : 1
    }, index => {
      next.push(index)
    }, 2)
    expect(next.sort()).toEqual([0, 2, 4, 6, 8])
    expect(maxExecuting).toBeGreaterThanOrEqual(1)
  })
  it('doWhile with dynamic limit', async() => {
    let i = 0
    let maxExecuting = 0
    const condition = () => i < arr.length
    await PromiseLimitLoop.doWhile(condition, () => i++, (executing) => {
      maxExecuting = Math.max(maxExecuting, executing.length)
      return executing.length < 2 ? 2 : 1
    }, resolvedFromGenerator => {
      arr[resolvedFromGenerator] += resolvedFromGenerator
    })
    expect(arr).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18])
    expect(maxExecuting).toBeGreaterThanOrEqual(1)
  })
  it('while with dynamic limit', async() => {
    let i = 0
    let maxExecuting = 0
    const condition = () => i < arr.length
    await PromiseLimitLoop.while(condition, () => i++, (executing) => {
      maxExecuting = Math.max(maxExecuting, executing.length)
      return executing.length < 2 ? 2 : 1
    }, resolvedFromGenerator => {
      arr[resolvedFromGenerator] += resolvedFromGenerator
    })
    expect(arr).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18])
    expect(maxExecuting).toBeGreaterThanOrEqual(1)
  })
})
