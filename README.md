# promise limit loop

> npm i promise-limit-loop

this package support loop with promise, you dont need to create an array of pending promise before executing

##### PromiseLimit.map(array, limit, iterator)
this method loop all values in array, send them to iterator (params of iterator like array.map)

* array: an array like [1,2,3,4]
* limit: limit promise executed at same time
* iterator: receive and process value
##### PromiseLimit.forEach(array, limit, iterator)
like PromiseLimit.map but doesn't return result

##### PromiseLimit.for(from, to, limit, iterator, returnResult = false)

* from: number
* to: number
loop from 'from' to 'to', value will be sent to iterator, if you wanna get results, you must set `returnResult=true`

##### PromiseLimit.until(conditionFunc, generatorFunc, limit, iterator, [conditionAndGeneratorParams])

* conditionFunc: until conditionFunction return falsy, the loop will stop
* generatorFunc: each loop round, iterator will receive value return from this function
* conditionAndGeneratorParams: will pass to condition & generator each loop

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
PromiseLimitLoop.until(
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