# Cattle Bridge

`./README_CN.md` for translation.

## About Cattle Bridge
Cattle Bridge is a further encapsulation of network request operations that fits the actual application requirement.
In the actual application, the seperation of front-end and back-end is widely used. However, the data returned by network requests often requires further processing before it can be used for front-end logic. For example, front-end developers might agree:
``` javascript
/* Return API data - an example of the common structure */
{
  "status": 2200, // Various status code for APIs
  "error_msg": "OK",
  "data": { // Useful data returned by APIs. 
    "some field": "",
    // some other data ...
  },
  "extra_info": {},
}
```
This means that the front-end developers have to process each group of data offered by APIs, using the same code. When dealing with many APIs, these processes might be distributed throughout the whole project's files. And when the basic appointments are changed, maintenance could be a nightmare.
Cattle Bridge can process the data from the input-or-output interface according to the given rules, as a reault, redundant codes could be eliminated.

## Install
#### Use NPM
1. Install
```bash
npm install cattle-bridge -s
```
4. Import when needed. As an UMD module it supports both ES6 `import` and CommonJS `require`.
```js
import CattleBridge from 'cattle-bridge';      // ES6
const CattleBridge = require('cattle-bridge'); // CommonJS
```

#### Install and build manually
1. `git clone` this repository.
2. Execute command: `npm run build`
3. Then, a UMD module file would be created in `./dist`.
4. Import when needed. The UMD module supports both ES6 `import` and CommonJS `require`

## Quick Start

### A primary example
```js
const CattleBridge = require('./cattle-bridge.umd.js');
const axios = require('axios');
const filters = {
  bindDevice: {
    method: 'POST',
    url: '/user_device/bind',
    chop: inp => ({ // Do some handling before submited to the network requester.
      code: inp.deviceId,
    }),
    trim: rep => ({
      result: !!rep.success, // Do some handling for data returned by network.
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

With the assistance of the configuration above, you can operate like the following now:

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

It is obvious that a pretty simple object is inputed as data for this request.

```js
{ deviceId: 10001 }
```

The input data is processed before passed to axios.

```js
{ code: 10001 }
```

Data returned by network responses is a bit complex.

```js
{
  status: 2200,
  error_msg: 'OK',
  data: { success: 1 },
}
```

After processed by Cattle Bridge, the parameters received by your `.then` callback are as follows. The processed data is placed in the `data` key. So concise.

```js
{
  data: { result: true },
  stat: {
    code: 2200,
    msg: "OK",
    friMsg: "Your operation has been done!",
  },
}
```

Maybe sometimes the operation of the API request failed. Error codes and error descriptions are attached to interface responses content.

```js
{
  status: 4400,
  error_msg: 'too many requests',
  data: { success: 0 },
}
```

In this case, the callback function passed into `.catch` will receive:
```js
{
  data: { result: false },
  stat: {
    code: 4400,
    msg: "too many requests",
    friMsg: "Please wait for a minute and then try again", // Friendly error message.
  },
}
```

So, Cattle Bridge can automatically proceed each network request according to configured rules. It is concise to call a network request and data received is easier to read and operate. Moreover, `.then` and `.catch` are called according to whether the API has a successive operating result or not - although both them are '200 OK' in the view of HTTP response.  

The above is a short but clear example. Cattle Bridge also offers more features and greater flexibility. Please read this document further to explore what else Cattle Bridge can do.

# API Reference

## Constructor `new CattleBridge(options)`

```typescript
{
  debug: boolean, // false 
  stater: function , // required
  requester: function,// required
  gchop: function, // optional
  gtrim: function, // optional
  filters: // filter list
}
```
* debug: true to print debug console messages.
* stater: a function to generate state information.
* requester: a function used to send network requests. Compatible with axios API.
* gchop: global chop processor.
* gtrim: global trim processor.
* filters: an object including several filters.

### filters
An object including several filters. Each item has the interface call name as its key and the filter object as its value. The interface call name should be passed to `.fetch` method as its first parameters to use the corresponding filter or interface.

### gchop
Global chop handler. It is used to proceed data after the current filter's chop handler.
Refer to the description of `filter.chop` in the next section.

### trim
Global trim handler. It is used to proceed data before the current filter's trim handler.
Refer to the description of `filter.trim` in the next section.

### stater
A function used to compute a state value for a response and return, which would be passed into request callbacks - both successive callback (.then) and failure callback (.catch). 

Refer to `.fetch` method for more information.

4 parameters are avaliable.

The first parameter is a callback function that must be called to mark this response as a successive response or a fail one. 
```js
const stater = function (result, respData, respStat, currentFilter) {
  result(true);  // The interface has finished asked operations successively.
                 // Mark this response as a successive one to continue the next steps.
  // - OR -
  result(false); // The interface has not finished operations correctly.
                 // Mark this response as a failure to continue the next steps.
}
```
Neither callback (`.then`/`.catch`) will be called if the result-marking function is not called.

### requester

Network requester, a function that can send network requests. It should be compatible with the basic API of axios, which means axios can be directly applied to this item.

```javascript
{
  // ...
  requester: require('axios'),
  // Or other functions compatible with axios' API.
  // ...
}
```

## filter

`Filter` is a key option given as an object that tells Cattle Bridge how to proceed input and output data. Each interface is proceeded according to the corresponding filter.

```typescript
{ // Option overlook
  name: String,   // (optional) filter name, used in console debug outputs.

  url: Function,  // Network request URL
  method: ,       // HTTP method
  
  chop: Function | Array[Function], // The handler for request input data  
  trim: Function | Array[Function], // The handler for response output data
   
  request: Function | any, // Parameters accepted by the requester. 
   
  handler: Function,  // The customised handler for request, which operates
                      // independently and return the response.
}
```

### name

*[optional]* filter name, used in console debug outputs to make them more readable.

### `chop` and `gchop`

A function or a array constituted by functions.

The functions accept `inp` as data inputed by calling `.fetch` and return `data` to be sent to network, which is corresponding to `options.data` in axios' options.

When using a function array, the input data of a function is what returned by the previous function. The first function in the array accepts data inputed by calling `.fetch` and the return value of the last function is used as requester's `options.data`.

`filter.gchop` is same as being attached to the end of all of chops.

### `trim ` and `gtrim`

A function or a array constituted by functions.

The function accepts network response data as its input (axios' `response.data`) and returns output data passed to Promise callback (then/catch).

When using a function array, the input data of a function is what returned by the previous function. The first function in the array accepts network response data as input data and the return value of the last function is used as a part in parameters of callbacks (then/catch).

Assigned `filter.gtrim` is equal to be attached to the beginning of trims。

### request: Function | Object

`request` can be a function or an object.

Using an object, its return value is passed into requester as the network request options.
Using a function, it accepts input data (proceeded by chops) as a parameter and returns an option object accepted by the requester.

Refer to axios' API documents to find out the details of the option object. 

```javascript
request(inp)
```

### url & method

*[optional]* url : Network request URL

*[optional]* method : HTTP request method

The two fields are sweets, whose effects are same as the assigned `requset.url ` or `requset.method`.

Using a function, input data would be passed into this function as the only parameter, and set its return value to requester's corresponding field.
A given constant value would directly become requester's corresponding fields.

### Priority and coverage between different fields

The network request parameter values are covered when various options are given.

`chop / trim` have the highest priority. `request` is the second. `url / method` are less prior. 

For example, if both `chop` and `request` are assigned at the same time, the value given by  `data` field in  `request` is covered by the value given by `chop`. Similarly, if the `request` option is assigned and it offers `method` fields, the `method` value assigned in filter option object would be rewrite. 

### `handler` : more flexibility allowed

Sometimes, it is not enough to just rely on allowed options offered by Cattle Bridge. Use `handler` option in the filter option object for more precise control in this case. 

`handler` is a function accepting several parameters.

```javascript
filter.handler(resolve, reject, name, input)
```
| Parameters | |
| -----| -----|
| resolve | Same as `resolve` in Promise |
| reject | Same as `reject` in Promise |
| name | Request interface name offered to `.fetch` method. |
| input | Interface input data offered to `.fetch` method. |

`handler` offers a way to generate and process more complex requests or responses. 

You might have the familiar feelings if you often write Promise instances. A successful or failed callback is made by calling `resolve` or `reject` where needed. Parameters passed into `resolve` or `reject` are passed directly to the `fetch#then` or `fetch#catch` callbacks. The parameters passed in need not conform to the form of `{data,stat}` just like demo code in this document, various values are okay as long as there is no problem in the corresponding callback of the `fetch#then` or `fetch#catch`.


## Start a request

Start some network requests after configuration.
Now, you should have a instance of Cattle Bridge, whose `.fetch` method is used to construct a new request.

`#fetch` accepts two parameters, request interface name and input data. It returns a Promise instance whose `.then` and `.catch` are used to handle the resolved and rejected states.

The functions passed to `.then` or `.catch` accept an object including `data` as response output data and `stat` as interface request state information.


It is worth noticing that `data` is the return value from `trim` function and `stat` is the return value from assigned `stater` function. The two functions and their return values are designed and provided by users themselves, which would not be read or modified by Cattle Bridge.

```javascript
{
  data: '',   // Any value, any data type are acceptable .
  stat: ,
}
```
Below is a simple example.
```javascript
var CattleBridge = new CattleBridge(options);

CattleBridge.fetch('ImplementName', inputData)
  .then(({data, stat}) => {
    // Tips: destructuring assignment used in function parameters
    // Succcess handler <=> Promise resolve
  }).catch(({data, stat}) => {
    // Error handler <=> Promise reject
  }))
```

## Using other HTTP request libraries

Cattle Bridge is designed according to the axios' API, which means you can use `axios` directly as Cattle Bridge's `requester` parameter, without additional configuration.

```javascript
import axios from 'axios';

var CattleBridge = new CattleBridge({
  ...,
  requester: axios, // That works!
  ...
})
```
However, axios is not available in some cases, for example, a special JavaScript runtime whose network request APIs are designed particularly or some conditions where other AJAX libraries are compulsory.  

Anyhow, just a requester that conforms to the axios API can drive Cattle Bridge (encapsulating is easy, generally speaking). Cattle Bridge makes no assumptions about the network request APIs in the runtime environment. It just plays a role as middle layers.


