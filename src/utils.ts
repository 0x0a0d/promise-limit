export const ensureLimit = (limit: number, min = 0): number => {
  limit = parseInt(limit as any)
  if (isNaN(limit) || limit <= min) {
    throw new Error(`Limit must be a number and greater than ${min}`)
  }
  return limit
}

export function getOrderResults<T = any>(obj: {[k: string|number]: T}, length: number = Object.keys(obj).length): T[] {
  const results: T[] = []
  for (let i = 0; i < length; i++) {
    results[i] = obj[i]
  }
  return results
}
