function correctArray(array) {
  return Array.isArray(array) ? array : [array];
}
function correctLimit(limit) {
  if (typeof limit !== 'number') {
    limit = parseInt(limit);
  }
  if (isNaN(limit) || limit <= 0) throw new Error(`Limit must be a number and greater than 0`);
  return limit;
}
function correctNumber(num) {
  if (typeof num !== 'number') {
    num = parseInt(num);
  }
  if (isNaN(num)) throw new Error(`require number ${num}`);
  return num;
}
class PromiseLimit {
  /**
   * loop and get result
   * @param {Array} array
   * @param {number} limit
   * @param {Function} iterator
   * @return {Promise<*[]>}
   */
  static async map(array, limit, iterator) {
    array = correctArray(array);
    limit = correctLimit(limit);
    const executing = [];
    const result = {};
    let i = 0;
    while (array.length > i) {
      while (executing.length < limit && array.length > i) {
        let e;
        const index = i++;
        const queue = async () => {
          result[index] = await Promise.resolve(iterator(array[index], index, array));
          executing.splice(executing.indexOf(e), 1);
        };
        executing.push(e=queue());
      }
      executing.length && await Promise.race(executing);
    }
    await Promise.all(executing);
    const result_list = [];
    for (let j = 0; j < i; j++) {
      result_list.push(result[j]);
    }
    return result_list;
  }
  /**
   * loop forEach
   * @param {Array} array
   * @param {number} limit
   * @param {Function} iterator
   * @return {Promise<void>}
   */
  static async forEach(array, limit, iterator) {
    array = correctArray(array);
    limit = correctLimit(limit);
    const executing = [];
    let i = 0;
    while (array.length > i) {
      while (executing.length < limit && array.length > i) {
        let e;
        const queue = async (index) => {
          await Promise.resolve(iterator(array[index], index, array));
          executing.splice(executing.indexOf(e), 1);
        };
        executing.push(e=queue(i++));
      }
      executing.length && await Promise.race(executing);
    }
    await Promise.all(executing);
  }

  /**
   * for loop
   * @param {number} from
   * @param {number} to
   * @param {number} limit
   * @param {Function} iterator
   * @param {Boolean} returnResult
   * @return {Promise<*[]>}
   */
  static async for(from, to, limit, iterator, returnResult = false) {
    from = correctNumber(from);
    to = correctNumber(to);
    if (from > to) throw new Error(`from '${from}' must less than to '${to}'`);
    limit = correctLimit(limit);

    const result_obj = {};
    const executing = [];
    let i = from;
    while (i <= to) {
      while (i <= to && executing.length < limit) {
        let e;
        const queue = async (index) => {
          const result = await Promise.resolve(iterator(index));
          if (returnResult)
            result_obj[index] = result
          executing.splice(executing.indexOf(e), 1);
        };
        executing.push(e=queue(i++));
      }
      executing.length && await Promise.race(executing);
    }
    await Promise.all(executing);
    if (returnResult) {
      const result_list = [];
      for (i = from; i <= to; i++) {
        result_list.push(result_obj[i]);
      }
      return result_list;
    }
  }

  /**
   * loop until conditionFunc return falsy
   * @param {Function} conditionFunc
   * @param {Function} generatorFunc
   * @param {number} limit
   * @param {Function} iterator
   * @param {*|null} params
   * @return {Promise<void>}
   */
  static async until(conditionFunc, generatorFunc, limit, iterator, params) {
    const executing = [];
    do {
      while (executing.length < limit) {
        let e;
        const queue = async (func) => {
          func.then(async data => {
            await Promise.resolve(iterator(data));
            executing.splice(executing.indexOf(e), 1);
          })
        };
        executing.push(e = queue(Promise.resolve(generatorFunc(params))));
      }
      executing.length && await Promise.race(executing);
    } while (await Promise.resolve(conditionFunc(params)));
    await Promise.all(executing);
  }
}

module.exports = PromiseLimit;
