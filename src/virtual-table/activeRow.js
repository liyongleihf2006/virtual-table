const listeners = []
const activeRow = new Proxy({id:''},{
  set(obj,prop,value){
    listeners.forEach(observer=>{
      observer(value)
    })
    return Reflect.set(obj,prop,value)
  },
  get(obj){
    return obj
  }
})
const addListener = (listener)=>{
  listeners.push(listener)
}
export default activeRow
export {addListener}