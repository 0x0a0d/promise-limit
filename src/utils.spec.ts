import { getOrderResults } from './utils'

describe('Utils test', () => {
  it('getOrderResults', () => {
    const test = {
      0: 'a',
      2: 'c',
      1: 'b',
    }
    expect(getOrderResults(test)).toEqual(['a', 'b', 'c'])
    expect(getOrderResults(test, 2)).toEqual(['a', 'b'])
    expect(getOrderResults(test, 4)).toEqual(['a', 'b', 'c', undefined])
  })
})
