# promise limit loop

> npm i promise-limit-loop

this package support loop with promise, you dont need to create an array of pending promise before executing

##### PromiseLimitLoop.map(array, limit, iterator)
this method loop all values in array, send them to iterator (params of iterator like array.map)

* array: an array like [1,2,3,4]
* limit: limit promise executed at same time
* iterator: receive and process value
##### PromiseLimitLoop.forEach(array, limit, iterator)
like PromiseLimitLoop.map but doesn't return result

##### PromiseLimitLoop.for(from, to, limit, iterator, step = 1)

* from: number
* to: number
* step: number

loop from 'from' to 'to', value will be sent to iterator
> If `step > 0`, `from` must less than `to`

> If `step < 0`, `from` must greater than `to`

##### PromiseLimitLoop.while(conditionFunc, generatorFunc, limit, iterator, [generatorParams])

* conditionFunc(*): while conditionFunction return truly, the loop will continue executing
* generatorFunc: each loop round, iterator will receive value return from this function
* generatorParams: will pass to generator each loop

##### ~~PromiseLimitLoop.until~~ use `PromiseLimitLoop.doWhile`
##### PromiseLimitLoop.doWhile(conditionFunc, generatorFunc, limit, iterator, [generatorParams])

* conditionFunc(*): execute the loop, until the conditionFunc return falsy
* generatorFunc: each loop round, iterator will receive value return from this function
* generatorParams: will pass to generator each loop

> conditionFunc(*): pushing generatorFunc to Queue will execute conditionFunc to validate.
> 
> `PromiseLimitLoop.doWhile`: execute after pushing
>
> `PromiseLimitLoop.while`: execute before pushing

##### PromiseLimitLoop.parallel((handleLimit: (increaseOrDecrease?: number)=> void, executionTime: number))

* handleLimit: increase or decrease limit of promise executing. If no params, return current limit
* executionTime: the current total time of executing promise
* Call `handleLimit(-1)` will decrease limit by 1, and increase limit by 1 if call `handleLimit(1)`
* If the limit is 0 or negative, the promise will be executed immediately

##### example
```js
const PromiseLimitLoop = require('promise-limit-loop')
const start = Date.now()
PromiseLimitLoop.for(0, 10, 2, async function (i) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(i, Date.now() - start)
      resolve()
    }, 1e3)
  })
})
/**
0 1003
1 1010
2 2013
3 2013
4 3014
5 3014
6 4014
7 4015
8 5019
9 5020
10 6025
*/

// map is same
PromiseLimitLoop.forEach(['a', 'b', 'c', 'd', 'e', 'f'], 2, async function (i) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(i, Date.now() - start)
      resolve()
    }, 1e3)
  })
})
/**
a 1004
b 1011
c 2015
d 2015
e 3020
f 3020
*/

let i = 0
PromiseLimitLoop.doWhile(
  async function condition () {
    return new Promise(resolve => setTimeout(() => {
      resolve(Date.now() - start < 3e3) // stop if 3 sec passed
    }, 1e3)) // delay 1sec before each loop
  },
  async function generator () {
    return i++
  },
  3,
  async function (i) {
    console.log(i, Date.now() - start)
  }
)
.then(() => {
  console.log('done', Date.now() - start)
})
/**
0 0
1 5
2 5
3 1007
4 1007
5 1007
6 2010
7 2010
8 2010
done 3010 // exit when time > 3s
*/
```
