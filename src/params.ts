
// 允许下面的字段从filter里面直接拷贝到Requester的请求参数里面

let allowedRequesterParamsToCopy: string[] = [
  'method',
  'responseType',
  'headers',
  'timeout',
]

let deletedFieldsWhenCopyFilterToRequestParams = [
  'handler',
  'chop',
  'trim',
  'inputProcessor',
  'stater',
]



export {
  allowedRequesterParamsToCopy,
  deletedFieldsWhenCopyFilterToRequestParams,
}