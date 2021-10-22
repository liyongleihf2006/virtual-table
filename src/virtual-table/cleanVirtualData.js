import { cloneDeep } from 'lodash'
function getType(obj) {
  return Object.prototype.toString.call(obj)
}
function isArray(obj) {
  return getType(obj) === '[object Array]'
}
function isObject(obj) {
  return getType(obj) === '[object Object]'
}
export function cleanVirtualData(tableData, privateProps, childrenKey) {
  const data = cloneDeep(tableData)
  _cleanVirtualData(data)
  return data
  function _cleanVirtualData(data) {
    if (isObject(data)) {
      const keys = Object.keys(data)
      keys.forEach(key => {
        if (privateProps.includes(key)) {
          delete data[key]
        }
      })
      const children = data[childrenKey]
      if (children) {
        _cleanVirtualData(children)
      }
    } else if (isArray(data)) {
      data.forEach(item => {
        _cleanVirtualData(item)
      })
    }
  }
}
export default cleanVirtualData
