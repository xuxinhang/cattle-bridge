/**
 * CattleBridge ThrowError.ts
 * 进行错误处理 / 抛出错误
 */


const printError = function (type: string, fstmsg: any, ...othmsg: any[]) {

  let consoleArray: any[] = [
    `[CattleBridge][${type.toUpperCase()}]\t`,
    fstmsg,
    ...othmsg,
  ];

  switch (type) {
    case 'throw':
      throw new Error(consoleArray[0] + fstmsg)
    case 'info':
      console.info(...consoleArray)
      break
    case 'warn':
      console.warn(...consoleArray)
      break
    case 'error':
      console.error(...consoleArray)
      break
    case 'log':
    default:
      console.log(...consoleArray)
  }

}

printError['throw'] = function (fstmsg: any, ...othmsg: any[]) {
  printError('throw', fstmsg, ...othmsg);
}

printError['error'] = function (fstmsg: any, ...othmsg: any[]) {
  printError('error', fstmsg, ...othmsg);
}

printError['log'] = function (fstmsg: any, ...othmsg: any[]) {
  printError('log', fstmsg, ...othmsg);
}

printError['info'] = function (fstmsg: any, ...othmsg: any[]) {
  printError('info', fstmsg, ...othmsg);
}

printError['warn'] = function (fstmsg: any, ...othmsg: any[]) {
  printError('warn', fstmsg, ...othmsg);
}

export default printError

