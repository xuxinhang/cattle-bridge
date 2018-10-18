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
import printError from './printError'
import processFilter from './processFilter'
import processResponse from './processResponse'
import { FilterFunc } from './interfaces/FilterFunc';
import { Filter } from './interfaces/Filter';


interface InputProcessFunction {
  (inp: any, ...cb: any[]): any
}

interface Filters {
  [prop: string]: Filter;
}

interface StaterFunction {
  (cb: Function, data: any, resp: any, filter: Filter): any
}

interface ConstructOptions {
  stater: StaterFunction;
  requester: (requestOptions: any) => any;
  debug?: boolean;
  filters?: Filters;
  gtrim?: FilterFunc;
  gchop?: FilterFunc;

}

function isFunction (fn) {
  return Object.prototype.toString.call(fn) == '[object Function]';
}


class CattleBridge {
  protected filters: Filters; // 过滤器列表
  protected debug: boolean; // 调试模式
  protected stater: StaterFunction; // Stater 获取响应的stater返回
  protected requester: Function; // 请求发送器 按照axios的API进行调用
  protected gtrim: FilterFunc; // 全局trim处理
  protected gchop: FilterFunc; // 全局chop处理

  constructor (options: ConstructOptions) {
    this.filters = options.filters
    this.debug = !!options.debug
    this.stater = options.stater
    this.requester = options.requester
    this.gtrim = options.gtrim
    this.gchop = options.gchop
    
    // 校验初始化参数的有效性   // Map type later, maybe.
    if (!(this.filters instanceof Object)) {
      devPrint('throw', "❌ Invalid Options: filters list");
    }
    if (!this.filters) {
      devPrint('throw', "❌ Invalid Options: filters list are expected to be an object");
    }
    if(!isFunction(this.stater)) {
      devPrint('throw', "❌ Invalid Options: stater is expected to be a Function");
    }
  }

  // 发起请求
  fetch (name: string, input?: any) {

    if (!(name in this.filters)) {
      devPrint('throw', "❌ Invalid param `name`: no matched filter in filter list.");
      return false;
    }

    let filter = this.filters[name];
    // 打印调试信息
    this.debug && devPrint('info', `⌛ [发起请求] 项目名 ${name}\n`, `输入参数:`, input)
  
    // 如果用户自定义了处理函数
    if (isFunction(filter.handler)) {
  
      return new Promise ((resolve, reject) => filter.handler(resolve, reject, name, input))
  
    } else {  // 没有自定义函数
      return new Promise ((resolve, reject) => {
        // 处理Filter
        let requestParams: any = processFilter.call(this, filter, input, this.gchop)

        this.requester(requestParams)
        // 如果HTTP正常响应
        .then((rawStat: any) => {
          this.debug && printError('info', '🌐 请求正常')
          processResponse.call(this, rawStat, undefined, filter, this.gtrim, this.stater, resolve, reject)
        // AJAX发生错误
        }, (error: any) => {
          this.debug && printError('info', '🌐 请求错误\n', 'error: ', error);
          processResponse.call(this, error.response, error, filter, this.gtrim, this.stater, resolve, reject)
        })
      })
    }
  }
}


// 模块输出
export default CattleBridge
