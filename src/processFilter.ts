
import dataPipeProcess from './dataPipeProcess' // 数据管道式处理模块
import { flatArray, isFunction } from './ulti/common'
import { Filter } from './interfaces/Filter';
import { FilterFunc } from './interfaces/FilterFunc';

// 构造请求参数

function processFilter (filter: Filter, rawInputData: any, gchop: FilterFunc) {

  // 复制filter 的 Key为参数
  let contactedParams = {}
  const allowedKeys = ['url', 'method'] // 'params', 'data'
  for (let k of allowedKeys) {
    if (filter.hasOwnProperty(k)) {
      contactedParams[k] = filter[k]
    }
  }

  // 覆盖掉之前的键，注意优先级
  if (filter.request instanceof Object) {
    Object.assign(contactedParams, processFilterItem(filter.request, filter, rawInputData))
  }
  
  // 构造请求参数
  let paramKeys = Object.keys(contactedParams)
  for (let k of paramKeys) {
    contactedParams[k] = processFilterItem(contactedParams[k], filter, rawInputData)
  }

  // 数据预处理参数
  if (!contactedParams.hasOwnProperty('data')) {
    contactedParams['data'] = dataPipeProcess(
      rawInputData,
      flatArray(
        filter.chop ? filter.chop : undefined,
        gchop ? gchop : undefined
      )
    )
  }

  return contactedParams

}


// 此函数对输入的选项进行处理

function processFilterItem (itemValue: any, currentFilter: Filter, rawInputData: any): any {
  if (isFunction(itemValue)) {
    return itemValue.call(currentFilter, rawInputData)
  } else {
    return itemValue
  }
}


export default processFilter

