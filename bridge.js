// API 数据转接器
// By Green Bob

import axios from 'axios'

import {apis, errors} from './apiServerParams.js';
// console.log(importedData)
// var {apis: requestFilters, errors: errorCodeMap} = importedData;
var requestFilters = apis;
var errorCodeMap = errors;

var showDevInfo = (process.env.NODE_ENV !== 'production');

export default {
  fetch (item, params) {
    var filter = requestFilters[item];

    // 没有对应的接口
    if(!filter) {
      throw '请求的Ajax接口不存在';
      return new Promise(()=>{});
    }

    // 打印
    showDevInfo && console.log('⌛', `请求接口: ${item}\n`, `输入:`, params);

    // 如果有用户自定义处理函数
    if (filter.handler && filter.handler.constructor) { 
      return new Promise ((resolve, reject) => {
        filter.handler(resolve, reject, filter.url, params)
      })
    } else {
      return new Promise(function (resolve, reject) {
        // resolve、reject 回调不可为空
        resolve = resolve || function(){};
        reject  = reject  || function(){};
        // 回调代理
        var resolveDirect = false, rejectDirect = false;
        var resolveProxy = function () {
          resolveDirect = true;
        }
        var rejectProxy = function () {
          rejectDirect = true;
        }
        //
        let pinto = {};
        if (filter.responseType) pinto.responseType = filter.responseType;
        // pinto.headers = {'Content-Type': 'application/x-www-form-urlencoded'};
        if (filter.method) pinto.method = filter.method;
        let inputData = filter.chop ? filter.chop(params, resolveProxy, rejectProxy) : params;
        // 检查回调代理
        if (resolveDirect) {
          resolve();
          return;
        }
        if (rejectDirect) {
          reject();
          return;
        }
        // 应该处理参数在路径中的情况
        if (filter.url) {
          pinto.url = (filter.url).replace(/\{(.+?)\}/g, function (m, p) {
            var tmp = inputData[p];
            if (tmp !== undefined) {
              delete inputData[p];
            }
            return tmp;
          });
        } else {
          throw '不合法的Ajax接口URL\nURL是必须的';
        }
        // 为不同的方法设置参数
        if (filter.method == 'POST' || filter.method == 'post') {
          pinto.data = inputData;
        } else if (filter.method == 'GET' || filter.method == 'get') {
          pinto.params = inputData;
        } else {
          pinto.data = inputData;
        }
        // 送出HTTP请求
        axios(pinto)
          .then((response) => {
            var data = response.data;
            if (data.status <= 2999) {  // HTTP 200 & 返回值：正常
              var processedData = filter.trim ? filter.trim(data.data, resolveProxy, rejectProxy) : data.data;
              // 检查回调代理
              if (resolveDirect) {
                resolve();
                return;
              }
              if (rejectDirect) {
                reject();
                return;
              }
              // 打印
              showDevInfo && console.log('✔ 接口正常返回\n', '数据: ', processedData, '\n', '状态实例: ', statusObj);
              var statusObj = new Status(data.status, data.errmsg);
              resolve(processedData, statusObj);
            } else { // HTTP 200 & 返回值：错误
              var statusObj = new Status(data.status, data.errmsg);
              // 打印
              showDevInfo && console.log('💔 接口错误\n', '状态: ', statusObj);
              reject(statusObj, data.data);
            }
          }, (error) => { // HTTP发生错误
            showDevInfo && console.log('网络或服务器问题');
            reject(new Status(0, 'Internet Error', error.response));
          })
      });
    }
  }
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

function convertKey (source, maps, reserveRawKeys) {
  let newArray;
  if (Array.isArray(source)) {
    newArray = source.map( (c, i) => {
      let nv = {};
      if (reserveRawKeys) {
        Object.assign(nv, c)
      }
      let fromKey;
      for (fromKey in maps) {
        let toKey = maps[fromKey];
        if ('Object' === typeof toKey) {
          nv[toKey.key] = toKey.handler(c[fromKey]);
        } else {
          nv[toKey] = c[fromKey];
        }
      }
      return nv;
    })
  }
  return newArray;
}

