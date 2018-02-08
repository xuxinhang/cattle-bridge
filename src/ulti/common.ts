
// 扁平化数组
function flatArray (...par: any[]) {
  return par.reduce((prev, curt) => {
    if (curt === undefined || curt === null) return prev
    if (Array.isArray(curt)) {
      prev.push(...curt)
    } else {
      prev.push(curt)
    }
    return prev
  }, [])
}

function isFunction (fn: any): fn is Function {
  return Object.prototype.toString.call(fn) == '[object Function]';
}

export {isFunction, flatArray}

