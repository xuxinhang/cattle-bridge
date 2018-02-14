
# API参考 & 使用指引

## About Cattle Bridge

Cattle Bridge 是为了适合实际业务场景而对 AJAX 操作的进一步封装。

实际业务中，前后端分离应用广泛。但是HTTP返回的数据往往需要进行进一步的处理才可以用于前端逻辑。例如，前后端开发人员可能会约定：

``` javascript
/* 接口返回数据 */
{
    "status": 2200, // 很多不同的接口的状态码
    "error_msg": "OK",
    "data": { // 接口返回的实用数据
        "some field": "",
        // some other data ...
    },
    "extra_info": {},
}
```

这意味着前端需要对每个接口使用一套相同的代码进行处理。在较多接口的情况下，这些处理会分布在项目业务逻辑的各处。而且在这些基础约定变更的时候，维护会变得很困难。

CattleBridge会对输入输出接口的数据按给定的逻辑进行处理，免除这些冗余的代码。


## Install
1. git clone此仓库
2. 运行 `npm build`
3. 在`dist`目录下会生成UMD标准的模块文件
4. 在需要的地方引入，同时支持 ES6 `import` 和CommonJS `require`

## 快速开始

### 一个简单示例

```js
const CattleBridge = require('./cattle-bridge.umd.js');
const axios = require('axios');

const filters = {
  bindDevice: { // 绑定设备
    method: 'POST',
    url: '/user_device/bind',
    chop: inp => ({  // 对输入的数据进行处理
      code: inp.deviceId,
    }),
    trim: rep => ({
      result: !!rep.success, // 对AJAX返回的数据进行处理
    }),
  },

  updateUserInfo: {
    url: '/user_info',
    method: 'POST',
    chop: inp => ({
      name: inp.name,
      height: inp.height,
      weight: inp.weight,
      birthday: inp.birth,
      gender: inp.gender,
      profession: inp.job,
      emotion: inp.marriage,
    }),
  },
};

const stater = function (result, respData, respStat, currentFilter) {
  if (respStat.status !== 200) {
    result(false);
    return {
      code: -1,
      msg: 'HTTP Error',
      friMsg: 'Cannot connect to the servers.',
    };
  } else {
    result(respData.status == 0);
    return {
      code: respData.status,
      msg: respData.error_msg,
      friMsg: mapToFriendlyMessage(respData.status),
    };
  }
}

const apier = new CattleBridge({
  debug: true,
  stater,
  filters,
  requester: axios,
  gtrim: rep => resp.data || {},
});

```

现在你可以像下面这样请求接口了

```js
apier.fetch('bindDevice', {deviceId: 10001})
.then(() => {
  // The interface tell you task has been done 
  console.log('The operation is done.');
}, ({data, stat}) => {
  // The interface is failed
  console.log('Some error happend!');
  console.log('Error Code: ', stat.code);
  console.log('Tips: ', stat.friMsg);
});

```

明显可以看到，这次请求中输入的数据是一个很简单的对象
```json
{deviceId: 10001}
```

输入数据经过了一些处理才会交给axios
```json
{code: 10001}
```

axios收到的服务器返回的数据有些复杂

```json
{
  status: 2200,
  error_msg: 'OK',
  data: { success: 1 },
}
```

经过CattleBridge处理，你的`.then`回调收到的参数是这样的。处理后的数据置于data字段，很简洁。

```json
{
  data: { result: true },
  stat: {
    code: 2200,
    msg: 'OK',
    friMsg: "Your operation has been done!",
  },
}
```

或许有时候接口的操作失败了

```json
{
  status: 4400,
  error_msg: 'too many requests',
  data: { success: 0 },
}
```

你传入 `.catch` 的回调函数会收到
```json
{
  data: {result: false},
  stat: {
    code: 4400,
    msg: 'too many requests',
    friMsg: "Please wait for a minute and then try again",
  },
}
```

可见，CattleBridge会根据你的配置对每个请求进行自动的处理，网络请求调用更加简洁。经过适当的处理，你收到的返回数据也更加便于读取和操作。同时，接口状态的成功或失败会分流至 `.then` 和 `.catch` 两个函数里——即使这两种情况下从HTTP请求的角度看网络请求都是成功的。

上面是一个简短但明了的示例。CattleBridge还提供了更多的功能和更佳的灵活性。继续阅读此文档来看看CattleBridge还能做到什么。


# API参考

## 构造函数 `new CattleBridge(options)`

```json
{
  debug: boolean, // false 
  stater: function , // required
  requester: function,// required
  gchop: function, // optional
  gtrim: function, // optional
  filters: // 过滤器列表
}
```
* debug: 设置为 true 打开调试信息
* stater: 生成状态信息
* requester: 发送网络请求，按照axios的API进行设计
* gchop: 全局chop处理函数
* gtrim: 全局trim处理函数
* filters: 由数个filter组成的对象

### filters
由数个过滤器组成的对象。对象的值是filter，对应的键是接口调用名（对应实例 `.fetch` 方法的第一个参数）。

### gchop

全局chop处理函数，在filter自身的chop之后进行处理。详见下文对 `filter.chop` 的说明。

### trim

全局trim处理函数，在filter自身的trim之前进行处理。详见下文对 `filter.trim` 的说明。

### stater

一个函数。计算并返回状态值，生成的状态值会传入请求成功回调。详见 `.fetch` 方法。

此函数接受四个参数。

第一个参数是一个函数，需调用并传入布尔值，来标记这次结果的成功或失败。传入true表示接口状态为成功，传入false表示结果的失败。如果不调用此函数，任何的回调都不会被执行。


### requester

网络请求器，一个函数，需符合 axios 的API。这意味着你可以直接使用axios。

```javascript
{
  // ...
  requester: require('axios'),
  // 或者其他符合 axios API 的函数
  // ...
}
```

## filter 过滤器

过滤器选项告诉CattleBridge如何处理输入输出数据。CattleBridge对每个接口的处理都是根据各自过滤器来进行的。过滤器选项作为一个对象提供。

```typescript
{ // 选项一览
  name: String, // optional 过滤器名称, 会出现在debug输出中
  
  url: Function, // 请求URL
  method:  , // 请求方法
  
  chop: Function | Array[Function], // 对输入数据的处理 
  trim: Function | Array[Function], // 对输出数据的处理 
  
  request: Function | any, // 计算 requester 接受的参数 
  
  handler: Function, // 自定义处理

}
```

### name

*[optional]* 标记接口名称。如果开启了调试模式，控制台输出会使用此名称，增强可读性。


### chop (inp) 和 gchop

可以是函数或者是由它们构成的数组。

函数接受参数 `inp` 为输入数据，返回将要传送到请求器的 `data`。它对应着 axios 选项的 `options.data`。

如果传入函数数组，每一函数的参数都是上一函数的返回值，第一个函数的参数为输入数据 `inp`，最后一个函数的返回值作为请求器的 `options.data`。

如果指定了 `filter.gchop` ，它相当于被附加在所有的 `chop` 之后。

### trim (rep) 和 gtrim

可以是函数或者是由它们构成的数组。

函数接受HTTP响应的数据，即 axios 的 `response.data` 。返回输出数据。输出数据会传给 `fetch.then` 或者 `fetch.catch` 回调。详见 `.fetch`。

如果传入函数数组，每一函数的参数都是上一函数的返回值。第一个函数的参数为axios的相应数据 `response.data` ，最后一个函数的返回值作为`fetch.then` 或者 `fetch.catch` 参数的一部分。

如果指定了 `filter.gtrim` ，它相当于被附加在所有的 `trim` 之前。

### request: Function | Object

`request` 可以是一个函数或者是一个参数对象。

如果是一个对象，其值会作为请求参数传入axios中。

如果是一个函数，那么它接受输入数据作为参数，返回 axios 接受的请求参数对象。

```javascript
request(inp)
```

### url & method

*[optional]* url 请求的URL地址

*[optional]* method 请求的HTTP方法

这两个字段是为了方便使用而设置的，效果等同于把它们写为`requset.url `或者` requset.method`。

如果是函数。CattleBridge会将输入数据作为唯一的参数传入，并将返回值作为axios参数的对应字段传入。
如果不是函数，CattleBridge会将其直接作为对应的axios参数传入。

### 不同字段之间的优先级和覆盖

CattleBridge 允许你灵活地输入axios要求的参数。

`chop / trim` 具有最高的优先级。`request`其次。`url / method` 具有最低的优先级。

例如，如果你同时指定了 `chop` 和 `request` ，`request` 的data字段（如果你指定了的话）会被 `chop` 的值覆盖。同样地，如果提供了 `request` 参数，且有method字段，那么直接在filter里指定的 `method` 值就会被覆盖。


### handler

有时候，CattleBridge提供的处理流程是不够用的，所以CattleBridge允许使用 `handler` 自定义处理过程。

`handler` 函数，接受数个参数。

```javascript
filter.handler(resolve, reject, name, input)
```
| 参数 |  |
| -----| -----|
| resolve | 同 Promise 中的 `resolve` 回调 |
| reject | 同 Pormise 中的 `reject` 回调 |
| name | 调用 `CattleBridge.prototype.fetch` 方法发起请求时传入的请求名称 `name` |
| input | 调用 `CattleBridge.prototype.fetch` 方法发起请求时传入的请求输入数据 `input` |

`handler` 选项允许你发起和处理更加复杂的请求。

如果你经常编写自己的 `Promise` 实例，你会感到非常熟悉。在需要的地方调用 `resolve()` 或 `reject()` 就可以完成一次成功的或者失败的调用。传入`resolve()` 或 `reject()` 的参数会直接传给`fetch.then` 和 `fetch.catch` 回调。传入的参数无需符合 `{data,stat}` 的形式，只要在`fetch` 调用对应的回调中对应起来就没有问题。


## 开始发起请求

完成配置之后，你就可以使用CattleBridge发起请求了。

你现在应该拿到了CattleBridge的实例，使用`CattleBridge.prototype.fetch`发起请求。

`CattleBridge.prototype.fetch`接受两个参数：接口名称、输入数据。返回一个Promise对象，使用`.then`和`.catch`传入成功或失败时的处理函数。

被传入的函数接受一个对象，包括输出数据`data`和状态信息`stat`。

应该注意到，`data`和`stat`分别是`trim`函数与`stater`函数返回的值。这两个函数和它们返回的值由用户自己提供，CattleBridge不会作任何修改。

```javascript
{
  data: '',
  stat: ,
}
```

下面是一个很简单的示例。
```javascript
var CattleBridge = new CattleBridge(options)

CattleBridge.fetch('ImplementName', inputData)
.then(({data, stat}) => {
  // Succcess Handler
}).catch(({data, stat}) => {
  // Error Handler
}))
```

## 使用其他的网络请求库

CattleBridge按照axios的API进行设计，这意味着你可以直接将axios作为CattleBridge的`requester`参数，无需额外的配置。

```javascript
import axios from 'axios'

var CattleBridge = new CattleBridge({
  ...,
  requester: axios, // That works!
  ...
})
```

但是我们有时无法使用axios，例如我们在另一个 JS Runtime 中使用专门的网络请求API（一个典型的例子是微信小程序），或者是用于种种原因不得不使用其他的网络请求库。

无论如何，仅需提供一个符合axios API的`requester`，就可以结合使用CattleBridge。CattleBridge对运行环境中的网络请求API不作任何假设。

















