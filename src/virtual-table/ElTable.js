
import { Table } from 'element-ui'
// 根据阅读Vue源代码(src/core/global-api/extend.js 第23~26),当Vue将一个配置对象注册成组件的时候,会自动的在配置上面
// 加上属性_Ctor,当再次使用同一个配置对象的时候,因为这个对象上面已经有_Ctor[SuperId]了,那么就会直接返回早已经注册后的
// 组件,导致我们下面的注册代码无效果
/* 这就是上述的Vue源代码
  const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
  if (cachedCtors[SuperId]) {
    return cachedCtors[SuperId]
  }
*/
// 解决方案两个:1.直接让Vue.component...这段注册代码早于Vue.use(ElementUI) 2.执行 delete Table._Ctor后再注册
delete Table._Ctor
Object.assign(Table, {
  inheritAttrs: false
})
const bindEvents = Table.methods.bindEvents
const unbindEvents = Table.methods.unbindEvents
Object.assign(Table.methods, {
  bindEvents() {
    bindEvents.call(this)
    this.bodyWrapper.addEventListener('scroll', (event) => {
      this.$emit('scroll', event)
    })
    const resizeObserver = new ResizeObserver(() => {
      this.resize({ type: 'resize' })
    })
    resizeObserver.observe(this.$el)
  },
  unbindEvents() {
    unbindEvents.call(this)
    window.removeEventListener('resize', this.resize)
  },
  resize(event) {
    this.$emit('resize', event)
  }
})
export default Table
