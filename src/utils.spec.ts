import { ensureLimit, getOrderResults } from './utils'

describe('Utils test', () => {
  it('ensureLimit', () => {
    expect(ensureLimit(1)).toBe(1)
    expect(ensureLimit('1')).toBe(1)
    expect(ensureLimit(1.5)).toBe(1)
    expect(ensureLimit('1.5')).toBe(1)
    expect(() => ensureLimit(-1.5)).toThrowError('Limit must be a number and greater than 0')
    expect(() => ensureLimit(-1.5, -1)).toThrowError('Limit must be a number and greater than -1')
    expect(() => ensureLimit(5, 6)).toThrowError('Limit must be a number and greater than 6')
  })
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
