
import { TableColumn } from 'element-ui'
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
delete TableColumn._Ctor
const setColumnRenders = TableColumn.methods.setColumnRenders
Object.assign(TableColumn.methods, {
  setColumnRenders(column) {
    column = setColumnRenders.call(this, column)
    if (column.type === 'selection') {
      if (this.$slots.header || this.$scopedSlots.header) {
        column.renderHeader = (h, scope) => {
          return this.$scopedSlots.header(scope)
        }
      }
    }
    return column
  }
})
export const cellStarts = {
  default: {
    order: ''
  },
  selection: {
    width: 48,
    minWidth: 48,
    realWidth: 48,
    order: '',
    className: 'el-table-column--selection'
  },
  expand: {
    width: 48,
    minWidth: 48,
    realWidth: 48,
    order: ''
  },
  index: {
    width: 48,
    minWidth: 48,
    realWidth: 48,
    order: ''
  }
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}
export function mergeOptions(defaults, config) {
  const options = {}
  let key
  for (key in defaults) {
    options[key] = defaults[key]
  }
  for (key in config) {
    if (hasOwn(config, key)) {
      const value = config[key]
      if (typeof value !== 'undefined') {
        options[key] = value
      }
    }
  }
  return options
}
// https://github.com/reduxjs/redux/blob/master/src/compose.js
export function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }
  if (funcs.length === 1) {
    return funcs[0]
  }
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
let columnIdSeed = 1
Object.assign(TableColumn, {
  beforeCreate() {
    this.row = {}
    this.column = {}
    this.$index = 0
    this.columnId = ''
  },
  created() {
    const parent = this.columnOrTableParent
    this.isSubColumn = this.owner !== parent
    this.columnId = (parent.tableId || parent.columnId) + '_column_' + columnIdSeed++

    const type = this.type || 'default'
    const sortable = this.sortable === '' ? true : this.sortable
    const defaults = {
      ...cellStarts[type],
      id: this.columnId,
      type: type,
      property: this.prop || this.property,
      align: this.realAlign,
      headerAlign: this.realHeaderAlign,
      showOverflowTooltip: this.showOverflowTooltip || this.showTooltipWhenOverflow,
      // filter 相关属性
      filterable: this.filters || this.filterMethod,
      filteredValue: [],
      filterPlacement: '',
      isColumnGroup: false,
      filterOpened: false,
      // sort 相关属性
      sortable: sortable,
      // index 列
      index: this.index
    }

    const basicProps = ['columnKey', 'label', 'className', 'labelClassName', 'type', 'renderHeader', 'formatter', 'fixed', 'resizable']
    const sortProps = ['sortMethod', 'sortBy', 'sortOrders']
    const selectProps = ['selectable', 'reserveSelection']
    const filterProps = ['filterMethod', 'filters', 'filterMultiple', 'filterOpened', 'filteredValue', 'filterPlacement']

    let column = this.getPropsData(basicProps, sortProps, selectProps, filterProps)
    column = mergeOptions(defaults, column)

    // 注意 compose 中函数执行的顺序是从右到左
    const chains = compose(this.setColumnRenders, this.setColumnWidth, this.setColumnForcedProps)
    column = chains(column)
    this.columnConfig = column
    // 注册 watcher
    this.registerNormalWatchers()
    this.registerComplexWatchers()
  }
})
export default TableColumn
