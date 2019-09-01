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
function checkAsyncCallback(asyncCallback) {
  if (asyncCallback.constructor.name !== 'AsyncFunction') {
    console.warn(`callback should be an AsyncFunction, you could also return a pending Promise too. If that, just ignore this message or call PromiseLimit.disableWarningMessage(true)`);
  }
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
   * hide warning when validate asyncCallback
   * @param {Boolean} bool
   * @return {this}
   */
  static disableWarningMessage(bool) {
    /**@private*/
    this.hide_warning_message = bool === true;
    return this;
  }
  /**@private*/
  static isWarningMessageDisabled() {
    return this.hide_warning_message === true;
  }
  /**
   * loop and get result
   * @param {Array} array
   * @param {number} limit
   * @param {Function} asyncCallBack
   * @return {Promise<*[]>}
   */
  static async map(array, limit, asyncCallBack) {
    array = correctArray(array);
    limit = correctLimit(limit);
    if (!this.isWarningMessageDisabled()) checkAsyncCallback(asyncCallBack);
    const executing = [];
    const result = {};
    let i = 0;
    while (array.length > i) {
      while (executing.length < limit && array.length > i) {
        let e;
        const index = i++;
        const queue = async () => {
          result[index] = await asyncCallBack(array[index], index, array);
          executing.splice(executing.indexOf(e), 1);
        };
        executing.push(e=queue());
      }
      await Promise.race(executing);
    }
    await Promise.all(executing);
    const result_list = [];
    for (let j = 0; j < i; j++) {
      result_list.push(result[j]);
    }
    return result_list;
  }
  /**
   * loop
   * @param {Array} array
   * @param {number} limit
   * @param {Function} asyncCallBack
   * @return {Promise<void>}
   */
  static async forEach(array, limit, asyncCallBack) {
    array = correctArray(array);
    limit = correctLimit(limit);
    if (!this.isWarningMessageDisabled()) checkAsyncCallback(asyncCallBack);
    const executing = [];
    let i = 0;
    while (array.length > i) {
      while (executing.length < limit && array.length > i) {
        let e;
        const index = i++;
        const queue = async () => {
          await asyncCallBack(array[index], index, array);
          executing.splice(executing.indexOf(e), 1);
        };
        executing.push(e=queue());
      }
      await Promise.race(executing);
    }
    await Promise.all(executing);
  }

  /**
   * for loop
   * @param {number} from
   * @param {number} to
   * @param {number} limit
   * @param {Function} asyncCallBack
   * @return {Promise<*[]>}
   */
  static async for(from, to, limit, asyncCallBack) {
    if (from > to) throw new Error(`from ${from} must less than to ${to}`);
    from = correctNumber(from);
    to = correctNumber(to);
    limit = correctLimit(limit);
    if (!this.isWarningMessageDisabled()) checkAsyncCallback(asyncCallBack);

    const result_obj = {};
    const executing = [];
    let i = from;
    while (i <= to) {
      while (i <= to && executing.length < limit) {
        let e;
        const queue = async (index) => {
          result_obj[index] = await asyncCallBack(index);
          executing.splice(executing.indexOf(e), 1);
        };
        executing.push(e=queue(i++));
      }
      await Promise.race(executing);
    }
    await Promise.all(executing);
    const result_list = [];
    for (i = from; i <= to; i ++) {
      result_list.push(result_obj[i]);
    }
    return result_list;
  }
  static async forever(asyncDelayAndCondition, asyncGenerator, limit, asyncCallback) {
    const executing = [];
    do {
      while (executing.length < limit) {
        let e;
        const queue = async (data) => {
          await asyncCallback(data);
          executing.splice(executing.indexOf(e), 1);
        };
        executing.push(e=queue(await asyncGenerator()));
      }
      await Promise.race(executing);
    } while (await asyncDelayAndCondition());
  }
}

module.exports = PromiseLimit;
