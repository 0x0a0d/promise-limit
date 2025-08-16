export function getOrderResults<T = any>(obj: {[k: string|number]: T}, length: number = Object.keys(obj).length): T[] {
  const results: T[] = []
  for (let i = 0; i < length; i++) {
    results[i] = obj[i]
  }
  return results
}
