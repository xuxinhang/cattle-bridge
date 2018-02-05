

interface ChopFunc {
  // 未来对类型会有更严格的要求
  (inp: any, cb1?: Function, cb2?: Function): any
}

function pipeProcess (rawData: any, pipes: ChopFunc[]): any {
  return pipes.reduce((prev: any, curt: ChopFunc): any => curt(prev), rawData)
}

export default pipeProcess
