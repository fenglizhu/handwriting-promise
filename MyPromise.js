class MyPromise {
  static PENDING = 'pending';
  static FULLFILLED = 'fullfilled';
  static REJECTED = 'reject';
  constructor(fnc) {
      this.status = MyPromise.PENDING;
      this.result = null;
      this.resolveCallbacks = [];
      this.rejectCallballs = [];
      try {
          fnc(this.resolve.bind(this), this.reject.bind(this));
      } catch (error) {
          this.reject(error)
      }
      
  }
  /**
   * 
   * @param {*} result 
   */
  resolve(result) {
      if (this.status === MyPromise.PENDING) {
          setTimeout(() => {
              this.status = MyPromise.FULLFILLED;
              this.result = result;
              this.resolveCallbacks.forEach(callback => {
                  callback(result)
              })
          });
      }  
  }

  /**
   * 
   * @param {*} result 
   */
  reject(result) {
      if (this.status === MyPromise.PENDING) {
          setTimeout(() => {
              this.status = MyPromise.REJECTED;
              this.result = result;
              this.rejectCallballs.forEach(callback => {
                  callback(result)
              })
          });
      }  
  }
  /**
   * Promise.prototype.then() 
   * 接收两个参数：Promise 的成功和失败情况的回调函数。
   * @param {*} onFULLFILLED fulfilled状态回调函数
   * @param {*} onREJECTED rejected状态回调函数
   * @returns 返回一个新的promise对象
   */
  then(onFULLFILLED, onREJECTED) {

      onFULLFILLED = typeof onFULLFILLED === 'function' ? onFULLFILLED : () => {};
      onREJECTED = typeof onREJECTED === 'function' ? onREJECTED : () => {};

      // 2.2.7 then 必须返回一个 promise
      let promise2 = new MyPromise((resolve, reject) => {
          
          // 待定状态
          if(this.status === MyPromise.PENDING) {
              // 如果还是PENDING状态，也不能直接保存回调方法了，需要包一层来捕获错误
              this.resolveCallbacks.push(()=>{
                  setTimeout(() => {
                      try {
                          let x = onFULLFILLED(this.result);
                          resolvePromise(promise2, x, resolve, reject)
                      } catch (e) {
                          reject(e)
                      }   
                  });
              });
              this.rejectCallballs.push(() => {
                  setTimeout(() => {
                      try {
                          let x = onREJECTED(this.result);
                          resolvePromise(promise2, x, resolve, reject)
                      } catch (e) {
                          reject(e)
                      }
                  });
              });
          }
          // 成功状态
          if (this.status === MyPromise.FULLFILLED) {
              setTimeout(() => {
                  try {
                      let x = onFULLFILLED(this.result);
                      resolvePromise(promise2, x, resolve, reject)
                  } catch (e) {
                      reject(e)
                  }
              });
          }
          // 决绝状态
          if (this.status === MyPromise.REJECTED) {
              setTimeout(() => {
                  try {
                      let x = onREJECTED(this.result);
                      resolvePromise(promise2, x, resolve, reject)
                  } catch (e) {
                      reject(e)
                  }
              });
          }
      })
      return promise2
      
  }
  /**
   * Promise.prototype.catch()
   * 它的行为与调用Promise.prototype.then(undefined, onRejected) 
   * @param {*} onREJECTED rejected状态回调函数
   * @returns 
   */
  catch(onREJECTED) {
      return this.then(undefined, onREJECTED)
  }

  /**
   * Promise.prototype.finally()
   * 在promise结束时，无论结果是fulfilled或者是rejected，都会执行指定的回调函数。
   * @param {*} callback fulfilled状态或者rejected状态回调函数
   * @returns 
   */
  finally(callback) {
      return this.then(
          (value) => {
              MyPromise.resolve(callback(value)).then(()=>{
                  return value
              })
          },
          (reason) => {
              MyPromise.resolve(callback(value)).then(()=>{
                  throw reason
              })
          }
      )
  }

  /**
   * Promise.resolve(value)
   * 将被Promise对象解析的参数，也可以是一个Promise对象，或者是一个thenable。
   * 如果参数本身就是一个Promise对象，则直接返回这个Promise对象。
   * @param {*} params 
   * @returns 返回一个以给定值解析后的Promise 对象
   */
  static resolve(params) {
      if (params instanceof MyPromise) {
          return params
      }
      return new MyPromise((resolve)=>{
          resolve(params)
      })
  }
  /**
   * Promise.reject()
   * @param {*} reason 拒绝原因
   * @returns 返回一个带有拒绝原因的Promise对象。
   */
  static reject(reason) {
      return new MyPromise((resolve, reject)=>{
          reject(reason)
      })
  }

  /**
   * 接收一个可迭代的对象参数【Array或者String】
   * 只返回一个Promise实例，并且是在所有传入的promise的resolve回调都结束，才会执行Promise实例的resolve回调
   * 只要有一个传入的promise的reject回调执行，则会执行Promise实例的reject回调抛出错误
   * 返回一个数组
   */
  static all(list) {
      // 判断不是数组或者字符串，抛出异常
      throwError(list);

      return new MyPromise((resolve, reject) => {
          
          // 判断传入的可迭代对象为空，直接返回空数组
          if (!list.length) return resolve([]);
          // 结果集合
          let result = [];
          let count = 0;
          for (let i = 0; i < list.length; i++) {
              var promise = MyPromise.resolve(list[i])
              promise.then(
                  value => {
                      count++;
                      result[i] = value
                      if (count === list.length) {
                          return resolve(result)
                      }
                  },
                  (reason) => {
                      count++;
                      return reject(reason)
                  }
              )
          }
      })
  }

  /**
   * Promise.race()
   * 接收一个可迭代的对象参数【Array或者String】
   * 只要给定的迭代中的一个promise解决或拒绝，就采用第一个promise的值作为它的值，从而异步地解析或拒绝
   * 跟 all 方法不同的是不需要等待所有的resolve,只要有一个 resolve 结果就可以直接返回
   * @param {*} list 
   * @returns 返回一个promise
   */
  static race(list) {
      // 判断不是数组或者字符串，抛出异常
      throwError(list);

      return new MyPromise((resolve, reject) => {
          // 判断传入的可迭代对象为空，直接返回空
          if (!list.length) return resolve();
          for (let i = 0; i < list.length; i++) {
              MyPromise.resolve(list[i]).then(
                  (value) => {
                      return resolve(value)
                  },
                  (reason) => {
                      return reject(reason)
                  }
              );
          }
      })
  }

  /**
   * Promise.allSettled()
   * 返回一个在所有给定的promise都已经fulfilled或rejected后的promise，并带有一个对象数组，每个对象表示对应的promise结果。
   * 数据格式如下：[{status: 'fulfilled', value: 3},{status: 'rejected', reason: 'bar'}]
   * @param {*} list 
   * @returns 
   */
  static allSettled(list) {
      // 判断不是数组或者字符串，抛出异常
      throwError(list);

      return new MyPromise((resolve, reject) => {
          var result = [];
          if (!list.length) return resolve([]);

          let count = 0;
          for (let i = 0; i < list.length; i++) {
              var promise = MyPromise.resolve(list[i]);
              promise.then(
                  (value) => {
                      result[i] = {
                          status: 'fulfilled',
                          value
                      }
                      count++;
                      if(count === list.length) {
                          resolve(result)
                      }
                  },
                  (reason) => {
                      count++;
                      result[i] = {
                          status: 'rejected',
                          reason
                      }
                      if(count === list.length) {
                          resolve(result)
                      }
                  }
              )
          }
      })
  }
  
  /**
   * Promise.any()
   * 接收一个Promise可迭代对象
   * 只要其中的一个 promise 成功，就返回那个已经成功的 promise
   * 如果可迭代对象中没有一个 promise 成功（即所有的 promises 都失败/拒绝），就返回一个失败的 promise 和AggregateError类型的实例，它是 Error 的一个子类，用于把单一的错误集合在一起。
   * @param {*} list 
   * @returns 
   */
  static any(list) {
      // 判断不是数组或者字符串，抛出异常
      throwError(list);
      
      return new MyPromise((resolve, reject) => {
          let count = 0;
          let errors = [];

          if (!list.length) {
              reject(new AggregateError([], 'All promises were rejected')) 
          }
          for (let i = 0; i < list.length; i++) {
              MyPromise.resolve(list[i]).then(
                  (value) => {
                      return resolve(value)
                  },
                  (reason) => {
                      count++;
                      errors.push(reason)
                      if(count === list.length) {
                          reject(new AggregateError(errors, 'All promises were rejected'));
                      }
                  }
              )
          }
      })
  }
}

/**
* promise A+ 规则统一处理
* @param {*} promise2  promise.then方法返回的 新的 promise对象
* @param {*} x         promise1中onFulfilled或onRejected的返回值
* @param {*} resolve   promise2的resolve方法
* @param {*} reject    promise2的reject方法
* @returns 
*/
function resolvePromise(promise2, x, resolve, reject) {
  // 2.3.1 如果promise和x引用同一个对象，promise 以 a TypeError为理由拒绝。
  if(x === promise2) {
      // 无效，待检查测试
      return reject(new TypeError('Chaining cycle detected for promise'));
  }

  //  如果 x 为 Promise ，则使 promise 接受 x 的状态
  if (x instanceof MyPromise) {
      if(x.status === MyPromise.PENDING) {
          // 2.3.2.1如果处于挂起状态x，则promise必须保持挂起状态，直到x完成或被拒绝。
          x.then(resolve, reject)
      } else if (x.status === MyPromise.FULLFILLED) {
          // 2.3.2.2如果/何时x完成，则promise用相同的值完成。
          resolve(x.result)

      } else if (x.status === MyPromise.REJECTED) {
          // 如果/何时x被拒绝，promise以同样的理由拒绝。
          reject(x.result)
      }
  // 2.3.3 否则，如果x是一个对象或函数，
  } else if (typeof x === 'object' || typeof x === 'function') {
      try {
          // 2.3.3.1 把 x.then 赋给 then
          var then = x.then
      } catch (e) {
          // 2.3.3.2如果检索属性x.then中抛出的异常的结果e，拒绝promise与e作为的原因。
          reject(e)
      }

      /**
       * 2.3.3.3
       * 如果 then 是一个函数，将 x 作为函数的作用域 this 调用之
       * 传递两个函数作为参数，第一个参数resolvePromise和第二个参数调用它rejectPromise
       */
      if (typeof then === 'function') {
          // 2.3.3.3.3 如果同时调用resolvePromise和rejectPromise，或者多次调用同一个参数，则第一个调用优先，任何进一步的调用都将被忽略。
          // 定义一个变量called来避免 resolvePromise 和 rejectPromise 都被调用
          let called = false;
          try {
              this.call(
                  x,
                  y => {
                      if (called) return;
                      called = true;
                      resolvePromise(promise2, y, resolve, reject)
                  },
                  r => {
                      if (called) return;
                      called = true;
                      reject(r)
                  }
              )
          // 2.3.3.3.4 如果调用then抛出异常e
          } catch (e) {
              // 2.3.3.3.4.1 如果resolvePromise或rejectPromise已被调用，则忽略它。
              if (called) return;

              // 2.3.3.3.4.2 否则，拒绝promise与e作为的原因。
              reject(e)
          }
          
      } else {
          // 2.3.3.4 如果then不是一个函数，实现promise用x。
          resolve(x);
      }
  // 2.3.4 如果x不是一个对象或功能，实现promise与x。
  } else {
      resolve(x);
  }
}

/**
* 统一判断不是数组或者字符串，抛出异常
* @param {*} list 
*/
function throwError(list) {
  if (Object.prototype.toString.call(list) != '[object Array]'
  && Object.prototype.toString.call(list) != '[object String]') {
      throw new TypeError((typeof list) + ' is not iterable (cannot read property Symbol(Symbol.iterator))');
  }
}
