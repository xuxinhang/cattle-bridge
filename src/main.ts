// API 数据转接器
// By Bob Green / Super Cattle

const debugEnable = true;


/**
 * 
 * 
 * 
 * CattleBridge 选项列表
 * Options：
 * 
 * filters: [Object] 用于过滤的数据处理器
 *      handler 自定义处理器
 *      chop 对输入数据的处理 Function/Array[Function]
 *          chop (inp)
 *              接受输入数据，返回值为传送到requster的数据
 *      trim 对输出数据的处理 Function/Array[Function]
 *          trim (rep)
 *              接受返回的数据，输出输出数据
 *      inputProcessor 接收数据进行处理，返回requester接受的参数对象 Function
 *          inputProcessor(rawInp, choppedInpData)
 *          返回的参数对象会和经filter处理后的其他值以及默认值进行合并
 *          此函数返回的参数值具有最低的优先级。也就是说，filter项指定的其他参数值可以优先于inputProcessor计算出的参数值传入requester中。
 * 
 *      name 此请求的个性化表述，会出现在debug输出中
 *      method 方法（不会进行处理）
 *      url 支持参数代入功能 String/Function
 *          url(inp)
 *      
 * debug: 启用调试模式
 * 
 * stater: 处理状态参量
 * 
 * requester: 请求发送器(参照 axio 来实现)
 * 
 * gtrim: 针对接收数据的全局预处理函数
 * 
 * gchop: 针对发送数据的全局终处理函数
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */

/*
 * * * * 状态判断回调 * * * *
 * 输入：响应体、HTTP状态
 * 输出一个字典：成功还是失败result、状态码code、状态消息msg、友好的状态消息friMsg
 * 
*/


import devPrint from './printError' // 调试信息输出模块
import dataPipeProcess from './dataPipeProcess' // 数据管道式处理模块
import * as libParams from './params' // 导入常量参数
import printError from './printError';


interface InputProcessFunction {
  (inp: any, ...cb: any[]): any
}

function isFunction (fn) {
  return Object.prototype.toString.call(fn) == '[object Function]';
}

function CattleBridge (options) {

  // 初始化项目参数，写入this内部参量
  this.filters = options.filters

  // this.errmsgMap = options.friendlyErrCodeMsgMap;
  // 调试模式 是否输出调试信息
  this.debug = !!options.debug

  // Stater 获取响应的stater返回
  this.stater = options.stater

  // 请求发送器 按照axios的API进行调用
  this.requester = options.requester

  // 全局trim处理
  this.gtrim = options.gtrim

  // 全局chop处理
  this.gchop = options.gchop

  // 校验初始化参数的有效性
  // Map type later, maybe.
  if (!(this.filters instanceof Object)) {
    devPrint('throw', "❌ Invalid Options: filters list");
  }
  // 校验filters
  if (!this.filters) {
    devPrint('throw', "❌ Invalid Options: filters list are expected to be an object");
  }
  if(!isFunction(this.stater)) {
    devPrint('throw', "❌ Invalid Options: stater is expected to be a Function");
  }
}

/** fetch(name, inputData)
 * name 接口名称
 * inputData 输入的数据
 * 
*/

CattleBridge.prototype.fetch = function (name: string, input: any) {
  // 如果没有对应的接口
  if (!(name in this.filters)) {
    devPrint['throw']("❌ Invalid param `name`: no matched filter in filter list.");
    return false;
  }

  let filter = this.filters[name];
  // 打印调试信息
  devPrint('info', `⌛ [发起请求] 项目名 ${name}\n`, `输入参数:`, input)

  // 如果用户自定义了处理函数
  if (filter.handler && isFunction(filter.handler)) {

    return new Promise ((resolve, reject) => filter.handler(resolve, reject, name, input))

  } else {
    // 没有自定义函数

    return new Promise ((resolve, reject) => {

      // 使用回调代理 以允许直接触发 resolve / reject
      var resolveDirect = false, rejectDirect = false
      const resolveProxy = () => {
        resolveDirect = true
      }
      const rejectProxy = () => {
        rejectDirect = true
      }

      let rawInputData = input

      
      /** 拷贝并构造 Requester 参数 **/

      // 处理一般参数
      let requestParams: Object = libParams.allowedRequesterParamsToCopy.reduce((prev: Object, curt: string): Object => {
        if (filter[curt] !== undefined && filter[curt] !== null) {
          prev[curt] = filter[curt]
        }
        return prev
      }, {})
      if (isFunction(filter.requestParams)) {
        Object.assign(requestParams, filter.requestParams.call(filter, rawInputData))
      } else if (filter.requestParams) {
        Object.assign(requestParams, filter.requestParams)
      }
    
      // 处理request data / 处理 chop & gchop
      let processedInputData: any = dataPipeProcess(
        rawInputData,
        flatArray(
          filter.chop || undefined,
          this.gchop || undefined
        )
      )
      Object.assign(requestParams, {data: processedInputData})

      // 处理动态url: String | Function
      let proUrl: string = undefined
      if ("string" == String(typeof filter.url).toLowerCase()) {
        proUrl = filter.url
      } else if (isFunction(filter.url)) {
        proUrl = filter.url.call(filter, rawInputData)
      }
      if (proUrl !== undefined) {
        Object.assign(requestParams, {url: proUrl})
      }

      // DEV
      console.log(requestParams)


      ////////// 开始构造请求 //////////

/*       var pinto = {};

      if (filter.responseType) pinto.responseType = filter.responseType;
      if (filter.method) pinto.method = filter.method;
      var resolveDirect = false, rejectDirect = false;
      var inputData = input;
      inputData = isFunction(filter.chop)? filter.chop(inputData, resolveProxy, rejectProxy) : inputData;
      inputData = isFunction(this.gchop) ? this.gchop (inputData, resolveProxy, rejectProxy) : inputData;
      // 检查回调代理 针对chop方法
      if (resolveDirect) { resolve(); return; }
      if (rejectDirect) { reject(); return; }
      if (inputData && inputData.toString() == '[object Object]') {
        // 如果是纯粹的字典，那么填充路径
        pinto.url = (filter.url).replace(/\{(.+?)\}/g, function (m, p) {
          var tmp = inputData[p];
          // Maybe something later.
          return tmp;
        });
        // 清理临时输入项 key == (^__.+?__$)
        for (let k in inputData) {
          if ((/^__.+?__$/g).test(k)) {
            delete inputData[k];
          }
        }
        // 针对GET方法，设置参数到params参数中
        if (filter.method == 'GET' || filter.method == 'get') {
          pinto.params = inputData;
        } else {
          pinto.data = inputData;
        }
      } else {
        pinto.url = filter.url;
      }

      console.log(pinto);
 */
      ////////// 送出HTTP请求 //////////

      this.requester(requestParams)

      // 如果HTTP正常响应
      .then((rawStat: Object) => {

        printError('info', '🌐 HTTP正常')

        // 获得响应结果、状态和消息 // 返回：结果、状态码、消息文本、友好消息 等等
        let rawOutputData = rawStat['data']
        let proStat = this.stater(rawOutputData, rawStat, filter)

        // 重置回调代理
        var resolveDirect = false, rejectDirect = false;

        // 处理 response data / 处理 chop & gchop
        let proOutputData: any = dataPipeProcess(
          rawOutputData,
          flatArray(
            this.gtrim  || undefined,
            filter.trim || undefined
          )
        )

        // 检查回调代理 - 针对trim方法
        if (resolveDirect) { resolve(); return; }
        if (rejectDirect) { reject(); return; }
        // 调用回调
        if (proStat.code !== undefined) {
          var statusObj = proStat;
        } else {
          throw new Error('❌ State Code is requested.');
        }

        // 打印成功/失败消息（如果有result字段，可以判断的话）
        if (proStat.result !== undefined) {
          let cbp = {data: proOutputData, stat: proStat}
          if (proStat.result) {
            resolve(cbp)
            printError(
              'info', '✔ 接口正常\n',
              '状态: ', cbp.stat, '\n',
              '数据: ', cbp.data
            );
          } else {
            reject(cbp)
            printError(
              'warn', '💔 接口错误\n',
              '数据: ', cbp.data, '\n',
              '状态: ', cbp.stat
            );
          }
        } else {
          printError('warn', '😑你没有指定`stater()`返回result字段，回调不会被执行')
        }

      // AJAX发生错误
      }, (error) => {

        let rawStat = error.response
        printError('info', '🌐 HTTP错误\n', 'error: ', error);

        // 获得响应结果、状态和消息
        let proStat = this.stater(rawStat, filter)
        let proOutputData: any = dataPipeProcess(
          rawStat.data,
          flatArray(
            filter.trim || undefined,
            this.gtrim  || undefined
          )
        )

        // 打印成功/失败消息（如果有result字段，可以判断的话）
        if (proStat.result !== undefined) {
          let cbp = {data: proOutputData, stat: proStat}
          if (proStat.result) {
            resolve(cbp)
            printError(
              'info', '✔ 接口正常\n',
              '状态: ', cbp.stat, '\n',
              '数据: ', cbp.data
            );
          } else {
            reject(cbp)
            printError(
              'warn', '💔 接口错误\n',
              '数据: ', cbp.data, '\n',
              '状态: ', cbp.stat
            );
          }
        } else {
          printError('warn', '😑你没有指定`stater()`返回result字段，回调不会被执行')
        }

      })
    })

  }
}


// 扁平化数组
function flatArray (...par: any[]) {
  return par.reduce((prev, curt) => {
    if (curt === undefined || curt === null) return prev
    if (Array.isArray(curt)) {
      prev.push(...curt)
    } else {
      prev.push(curt)
    }
    return prev
  }, [])
}


// 模块输出

export default CattleBridge
