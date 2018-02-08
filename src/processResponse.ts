import printError from './printError'
import dataPipeProcess from './dataPipeProcess'

import { flatArray, isFunction } from './ulti/common'
import { Filter } from './interfaces/Filter';
import { FilterFunc } from './interfaces/FilterFunc';

interface RequesterResponse {
  data?: any;
  status?: number;
  [propName: string]: any;
}

const processResponse = function (response: RequesterResponse, error: any, filter: Filter, gtrim: FilterFunc, stater: any, resolve: Function, reject: Function) {

  // 获得响应结果、状态和消息 // 返回：结果、状态码、消息文本、友好消息 等等
  const rawOutputData: any = response.data
  let resultFlag: boolean = undefined
  const resultCb = (res: boolean): void => {
    resultFlag = res
  }

  let proStat: any = isFunction(stater) ? 
    stater(resultCb, rawOutputData, response, filter) :
    (stater || response)

  // 处理 response data / 处理 chop & gchop
  let proOutputData: any = dataPipeProcess(
    rawOutputData,
    flatArray(
      gtrim  || undefined,
      filter.trim || undefined
    )
  )

  // 打印成功/失败消息（如果有result字段，可以判断的话）
  if (resultFlag !== undefined) {
    let cbp = {data: proOutputData, stat: proStat}
    if (resultFlag) {
      if (isFunction(resolve)) {
        resolve(cbp) 
      }
      this.debug && printError(
        'info', '✔ 接口正常\n',
        '状态: ', cbp.stat, '\n',
        '数据: ', cbp.data
      );
    } else {
      if (isFunction(reject)) {
        reject(cbp) 
      }
      this.debug && printError(
        'warn', '💔 接口错误\n',
        '数据: ', cbp.data, '\n',
        '状态: ', cbp.stat
      );
    }
  } else {
    this.debug && printError('warn', '😑你没有指定`stater()`返回result字段，回调不会被执行')
  }

}

export default processResponse

