
/// <reference types="chai" />
/// <reference types="mocha" />

import {expect} from 'chai'
// import 'mocha'
import processFilter from '../src/processFilter'
import processResponse from '../src/processResponse';
import { FilterFunc } from '../src/interfaces/FilterFunc';


describe('[processFilter模块] 验证由 filter 生成请求参数的逻辑是否正确', () => {

  const gchop = (inp) => {
    return {data: inp, token: 'TOKEN'}
  }

  const inputData = {curt: 12, prev: 78}

  const genres = (justFilter) => processFilter(justFilter, inputData, gchop)

  it('最常规的使用方法', () => {
    expect(processFilter({
      method: 'GET',
      url: 'http://g.cn',
      chop: inp => ({...inp, total: inp.curt + inp.prev})
    }, inputData, gchop))
    .to.be.eql({
      url: 'http://g.cn',
      method: 'GET',
      data: {
        data: {curt: 12, prev: 78, total: 90},
        token: 'TOKEN', 
      },
    })
  })

  it('动态Url & 不提供gchop', () => {
    expect(processFilter({
      url: inp => `http://g.cn/query/${inp.curt}`,
      method: 'GET',
      chop: inp => ({...inp, total: inp.curt + inp.prev}),
    }, inputData, undefined))
    .to.be.eql({
      url: 'http://g.cn/query/12',
      method: 'GET',
      data: {curt: 12, prev: 78, total: 90},
    })
  })

  it('method与request.method 同时存在，且request.method动态生成', () => {
    expect(processFilter({
      url: 'url',
      method: 'POST',
      request: {
        method: inp => 'GET',
      },
    }, inputData, gchop))
    .property('method', 'GET')
  })

  it('gchop与chop都不存在', () => {
    expect(processFilter({
      url: inp => `http://g.cn/query/${inp.curt}`,
    }, inputData, undefined))
    .deep.property('data', {curt: 12, prev: 78})
  })

  it('存在gchop和多个chop', () => {
    expect(processFilter({
      chop: [
        inp => ({...inp, total: inp.curt + inp.prev}),
        inp => ({...inp, minus: inp.curt - inp.prev}),
      ],
    }, inputData, gchop))
    .deep.property('data', {
      data: {curt: 12, prev: 78, total: 90, minus: -66},
      token: 'TOKEN',
    })
  })

  it('request 输入了一个函数', () => {
    expect(processFilter({
      url: 'http://g.cn',
      method: 'POST',
      request: inp => ({
        url: `http://g.cn/query/${inp.curt}`,
        method: 'GET',
        data: 'a string',
      }),
    }, inputData, gchop))
    .eql({method: 'GET', url: 'http://g.cn/query/12', data: 'a string'})
  })

  it('request 存在多个项目', () => {
    const request = {
      data: 'some string data',
      method: 'GET',
      timeout: 1234,
      another: new Date(),
    }
    expect(processFilter({
      url: 'http://qq.com',
      method: 'POST',
      request,
    }, inputData, gchop))
    .to.be.eql({...request, url: 'http://qq.com'})
  })

  it('模拟使用者瞎输入参数', () => {
    expect(processFilter({
      url: undefined,
      chop: 0,
      request: '%',
    }, inputData, new Date(3456) as FilterFunc))
    .to.be.eql({
      data: new Date(3456),
      url: undefined,
    })
  })

})



describe('[processResponse] 处理AJAX响应', () => {

  const filter = {
    name: 'example',
    trim: rep => ({total: rep.curt + rep.prev})
  }
  
  const stater = (result, data, resp, filter) => {
    if (data.status == 0 && resp.status < 400) {
      result(true)
      return {result: true, code: +data.status, msg: `OK`}
    } else {
      result(false)
      return {
        result: false, code: +data.status, msg: `CODE=${resp.status},${data.status}`}
    }
  }

  const gtrim = rep => rep.query || {}

  it('常规', done => {
    processResponse({
      status: 200,
      data: {
        status: 0,
        query: {curt: 12, prev: 78}, 
      }
    },
    undefined, filter, gtrim, stater,
    ({data, stat}) => {
      expect(data)
      .to.be.eql({total: 90})
      done()
    }, undefined)
  })

  it('模拟HTTP错误', done => {
    processResponse({
      status: 404,
      data: {
        status: 0,
        query: {curt: 12, prev: 78}, 
      }
    },
    undefined, filter, gtrim, stater, undefined,
    ({data, stat}) => {
      expect(stat)
      .to.be.property('msg', 'CODE=404,0')
      done()
    })
  })

  it('没有gtrim', done => {
    processResponse({
      status: 200,
      data: {status: 0, query: 133},
    }, undefined, filter, undefined, stater,
    ({data, stat}) => {
      expect(data.total).to.be.NaN
      done()
    }, undefined)
  })

  it('trim和gtrim都没有', done => {
    processResponse({
      status: 200,
      data: 998,
    }, undefined, {}, undefined, stater, undefined,
    ({data, stat}) => {
      expect(data).to.be.equal(998)
      done()
    })
  })

  it.skip('参数乱七八糟', done => {
    const response = {
      status: 200,
      data: [1, 2, 3],
    }
    processResponse(response, {}, {}, undefined, '%',
    ({data, stat}) => {
      expect(stat).eql(response)
      done()
    }, undefined)
  })

})







