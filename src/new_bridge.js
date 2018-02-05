// API 数据转接器
// By Green Bob / Super Cattle

import axios from 'axios'

const debugEnable = true;

// import {apis, errors} from './apiServerParams.js';
// var requestFilters = apis;
// var errorCodeMap = errors;

// Bridge 构造函数

/*
options：
  friendlyErrorMessageMap:
  filters:
  debug:
  gchop
  gtrim
  stater:

*/



function CattleBridge (options) {
  this.filters = options.filters;
  this.errmsgMap = options.friendlyErrCodeMsgMap;
  this.debug = !!options.debug;
  this.stater = options.stater;
  // 校验options有效性
    // Map type later, maybe.
  if (! this.errmsgMap instanceof Object) {
    throw new Error("❌ Invalid Options: friendlyErrCodeMsgMap");
    return false;
  }
  if (! this.filters instanceof Object) {
    throw new Error("❌ Invalid Options: filters list");
    return false;
  }
  /*
   * * * * 状态判断回调 * * * *
   * 输入：响应体、HTTP状态
   * 输出一个字典：成功还是失败result、状态码code、状态消息msg、友好的状态消息friMsg
   *
  */
  if(! this.stater.toString() == '[object Function]') {
    throw new Error("❌ Invalid Options: stater is expected to be a function");
    return false;
  }

}

CattleBridge.prototype.fetch = function (name, input) {
  // 没有对应的接口
  if (!(name in this.filters)) {
    throw new Error("❌ [fetch function] Invalid param `name`: no matched filter in filter list.");
    return false;
  }
  var filter = this.filters[name];
  // 打印调试信息
  console.log('⌛', `[发起请求] 项目名 ${name}\n`, `输入参数:`, input);
  // 开始分析并发起请求

  // 如果用户自定义了处理函数
  if (filter.handler && filter.handler.constructor) {
    return new Promise ((resolve, reject) => {
      filter.handler(resolve, reject, filter.path, input);
    })
  } else {
    // 否则
    return new Promise (function (resolve, reject) {

      ////////// [STEP] 检查参数 //////////

      // resolve、reject 回调不可为空
      resolve = resolve || function(){};
      reject  = reject  || function(){};
      // 应检查path参数
      if ('path' in filter) {
        throw new Error('❌ Invalid filter path, `path` is expected');
        return false;
      }

      // 使用回调代理 以允许直接触发 resolve / reject
      var resolveDirect = false, rejectDirect = false;
      var resolveProxy = function () {
        resolveDirect = true;
      }
      var rejectProxy = function () {
        rejectDirect = true;
      }

      ////////// 开始构造请求 //////////

      var pinto = {};
        // pinto.headers = {'Content-Type': 'application/x-www-form-urlencoded'};
      if (filter.responseType) pinto.responseType = filter.responseType;
      if (filter.method) pinto.method = filter.method;
      var resolveDirect = false, rejectDirect = false;
      var inputData = filter.chop instanceof Function ? filter.chop(input, resolveProxy, rejectProxy) : input;
      // 检查回调代理 针对chop方法
      if (resolveDirect) { resolve(); return; }
      if (rejectDirect) { reject(); return; }
      if (inputData.toString() == '[object Object]') {
        // 如果是纯粹的字典，那么...
        // 填充路径
        pinto.url = (filter.path).replace(/\{(.+?)\}/g, function (m, p) {
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
      }

      ////////// 送出HTTP请求 //////////

      axios(pinto)
        .then((response) => {
          debugEnable && console.log('🌐 AJAX正常');
          var respData = response.data;
          // 获得响应结果、状态和消息 // 返回：结果、状态码、消息文本、友好消息
          var respState = this.stater(respData, response.status);
          // 重置回调代理
          var resolveDirect = false, rejectDirect = false;
          var processedData = filter.trim ? filter.trim(respData, resolveProxy, rejectProxy) : respData;
          // 检查回调代理 - 针对trim方法
          if (resolveDirect) { resolve(); return; }
          if (rejectDirect) { reject(); return; }
          // 调用回调
          if (respState.code !== undefined) {
            var statusObj = new Status(respState.code, respState.msg);
          } else {
            throw new Error('❌ State Code is requested.');
            return false;
          }
          // 检查接口是否错误
          if (respState.result) {
            resolve(processedData, statusObj);       
            // 打印debug信息
            debugEnable && console.log('✔ 接口正常\n', '数据: ', processedData, '\n', '状态实例: ', statusObj);
          } else {
            reject(statusObj, data.data);
            // 打印debug信息
            debugEnable && console.log('💔 接口错误\n', '状态: ', statusObj);
          }
        }, (error) => { // AJAX发生错误
          debugEnable && console.log('🌐 AJAX错误\n', '状态: ', statusObj);
          // 获得响应结果、状态和消息
          var respState = this.stater(response.data, response.status);
          if (respState.code !== undefined) {
            var statusObj = new Status(respState.code, respState.msg);
          } else {
            throw new Error('❌ State Code is requested.');
            return false;
          }
          if (respState.result) {
            resolve(processedData, statusObj);       
            debugEnable && console.log('✔ 接口正常\n', '数据: ', processedData, '\n', '状态实例: ', statusObj);
          } else {
            reject(statusObj, data.data);
            debugEnable && console.log('💔 接口错误\n', '状态: ', statusObj);
          }
        })
    })

  }
}

CattleBridge.prototype.printDebugMsg = function (a) {
  console.log(a);
}


// Status 构造类型制造机
function Status (code, msg, rawResponse) {
  this.code = parseInt(code);
  // console.log(msg);
  this.rawMsg = (msg === undefined || msg === null) ? undefined : String(msg);
  this.msg = this.rawMsg;
  this.friMsg = errorCodeMap[this.code];
  this.rawResponse = rawResponse;
}
