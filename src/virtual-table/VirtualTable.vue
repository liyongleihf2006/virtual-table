<template>
  <el-table
    ref="tableRef"
    v-bind="{...$props,...$attrs}"
    :show-header="showHeader"
    :expand-row-keys="expandRowKeys"
    :data="realData"
    class="virtual-table"
    :row-key="rowKey"
    :tree-props="_treeProps"
    :span-method="spanMethod || defaultSpanMethod"
    :default-expand-all="false"
    v-on="{...$listeners}"
    v-on:cell-click="cellClick"
    @expand-change="expandChange"
    @scroll="handleScroll"
  >
    <el-table-column
      v-if="selection"
      type="selection"
      :width="selectionWidth"
    >
      <template slot="header">
        <el-checkbox v-model="checkAll" :indeterminate="checkAllIndeterminate" class="checkAll" />
      </template>
      <template slot-scope="{row}">
        <el-checkbox :value="row._checked" :indeterminate="row._indeterminate" @change="handleSelect($event,row)" />
      </template>
    </el-table-column>
    <slot />
  </el-table>
</template>
<script>
import Vue from 'vue'
import { debounce } from 'lodash'
import Schema from 'async-validator'
import cleanVirtualData from './cleanVirtualData'
import activeRow from './activeRow'
export default {
  name: 'VirtualTable',
  inheritAttrs: false,
  props: {
    selection: {
      type: Boolean,
      default: false
    },
    treeProps: {
      type: Object,
      default() {
        return { children: 'children', hasChildren: 'hasChildren' }
      }
    },
    rowKey: {
      type: String,
      default: 'id'
    },
    // 当第一次注入数据后,是否展开全部
    defaultExpandAll: {
      type: Boolean,
      default: true
    },
    tableData: {
      type: Array,
      default() {
        return []
      }
    },
    lineHeight: {
      type: Number,
      default: 44
    },
    // 用来校验的规则,第一个参数数组指的是用于校验的字段,第二个参数是函数,传入单元格数据,this指的是当前组件
    // 返回是否是表单元素和校验规则,其中校验规则就是el-form上面的校验规则
    validateMap: {
      type: Map,
      default() {
        return new Map()
      }
    },
    expandRowKeys: {
      type: Array,
      default() {
        return []
      }
    },
    spanMethod: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      selectionWidth: 55,
      // 是否已经初始化展开过
      hasDefaultExpandAll: false,
      realData: [],
      prevScrollTop: 0,
      prevScrollLeft: 0,
      virtualIds: [],
      realCols: [], // 展示的列
      showHeader: true, // 用来hack全选
      // 校验的hash
      validateHash: this.getValidateHash(this.validateMap),
      // 可见的列数组
      visibleNodes: []
    }
  },
  provide() {
    return {
      validateField: this.validateField
    }
  },
  computed: {
    checkAll: {
      get() {
        const data = this.tableData
        if (!data.length) {
          return false
        }
        const isChecked = data.every(item => {
          return item._checked
        })
        return isChecked
      },
      set(bool) {
        const selection = this.doCheck(bool)
        this.$emit('select-all', selection)
      }
    },
    checkAllIndeterminate() {
      const data = this.tableData
      if (!data.length) {
        return false
      }
      const isAllChecked = data.every(item => {
        return item._checked
      })
      const isAllUnchecked = data.every(item => {
        return !item._checked
      })
      return !isAllChecked && !isAllUnchecked
    },
    childrenKey() {
      return this._treeProps.children
    },
    _treeProps() {
      const { children, hasChildren } = this.treeProps
      return {
        children: `_${children}`,
        hasChildren
      }
    }
  },
  watch: {
    checkAll: {
      handler() {
        this.hackCheckAllChange()
      }
    },
    checkAllIndeterminate: {
      handler() {
        this.hackCheckAllChange()
      }
    },
    '$slots.default': {
      handler(nodes) {
        setTimeout(() => {
          this.visibleNodes = this._getVisibleNodes(nodes)
        })
      },
      immediate: true,
      deep: true
    }
  },
  created() {
    this.warning()
  },
  mounted() {
    this.watchFlatLen()
    this.initTable()
    this.$nextTick(() => {
      this.getRealCols()
      this.getRealData()
    })
    this.debounceOnScroll = this.onScroll || debounce(this.onScroll)
    this.$emit('forward-table-ref', this.$refs.tableRef)
  },
  methods: {
    cellClick(row, column, cell) {
      activeRow.id = row.id
      this.$nextTick(() => {
        const select = cell.querySelector('.el-select')
        const input = cell.querySelector('input,textarea')
        if (select) {
          select.click()
        } else if (input) {
          input.focus()
        }
      })
    },
    onScroll() {
      const tableEl = this.$refs.tableRef.$el
      const bodyWrapper = tableEl.querySelector('.el-table__body-wrapper')
      if (bodyWrapper.scrollLeft !== this.prevScrollLeft) {
        this.getRealCols()
      }
      if (bodyWrapper.scrollTop !== this.prevScrollTop) {
        this.prevScrollTop = bodyWrapper.scrollTop
        this.getRealData()
      }
    },
    _getVisibleNodes(nodes) {
      return __getVisibleNodes(nodes)
      function __getVisibleNodes(nodes) {
        const columns = []
        nodes.forEach((node) => {
          if (node.tag) {
            columns.push(node)
            const componentOptions = node.componentOptions
            const children = componentOptions.children
            if (children) {
              const $children = __getVisibleNodes(children)
              componentOptions.children = $children
            }
          }
        })
        return columns
      }
    },
    // 判断传入的属性是否存在于$attrs中
    isHasAttrs(prop) {
      return Reflect.has(this.$attrs, prop)
    },
    warning() {
      const componentName = 'VirtualTable'
      const VNodes = this.visibleNodes
      const isHasSelection = VNodes.some(VNode => {
        return VNode.componentOptions.propsData.type === 'selection'
      })
      if (isHasSelection) {
        console.error(`${componentName}:因组件自己实现了多选功能,请不要使用Element的多选组件,请在VirtualTable实例上面使用selection属性并设置为true`)
      }
      const $attrs = this.$attrs
      console.log($attrs)
      if (this.isHasAttrs('show-header')) {
        console.error(`${componentName}:因组件中,show-header属性用于hack表头不能实时渲染的问题,所以传入该属性将不起作用`)
      }
      if (this.defaultExpandAll && this.expandRowKeys.length) {
        console.error(`${componentName}:当传入expand-row-keys的长度不为空的时候,default-expand-all=true将不起作用`)
      }
      if (this.spanMethod) {
        console.error(`${componentName}:因spanMethod用于了内部性能优化,因此传入spanMethod会导致部分性能优化失效,倘若一定要使用,那么在自己实现的时候请参照一下组件中spanMethod的实现`)
      }
    },
    defaultSpanMethod({ row, column, columnIndex }) {
      if (this.virtualIds.includes(row[this.rowKey])) {
        return [0, 0]
      } else if (column.fixed) {
        return [1, 1]
      } else {
        const columns = this.$refs.tableRef.columns
        const leftFixedLen = columns.filter(column => ['left', true].includes(column.fixed)).length
        const rightFixedLen = columns.filter(column => column.fixed === 'right').length
        const realColsLen = this.realCols.length
        const prevCol = +this.realCols[leftFixedLen] - 4
        const nextCol = +this.realCols[realColsLen - 1] + 1
        if (columnIndex < prevCol + 1) {
          return [0, 0]
        }
        if (columnIndex === prevCol + 1) {
          return [1, prevCol + 2 - leftFixedLen]
        }
        if (columnIndex === nextCol) {
          return [1, columns.length - nextCol - rightFixedLen]
        }
        if (columnIndex > nextCol) {
          return [0, 0]
        }
      }
    },
    getCleanVirtualData() {
      const privateProps = [
        this.childrenKey,
        '_checked',
        '_prop',
        '_errorFields',
        '_ancestors',
        '_parent',
        '_validates',
        '_indeterminate'
      ]
      return cleanVirtualData(this.tableData, privateProps, this.treeProps.children)
    },
    // 预处理:
    // 1.是将每一条数据中都放入一个_prop,这个_prop是从祖先一层层组合而成的,主要是为了form的prop属性
    // 2.向每一项放入其祖先元素,便于处理选中状态
    pretreatment(data, parentProp, totalLen) {
      const _pretreatment = (data, parentProp, parent) => {
        data.forEach((item, idx) => {
          const _prop = `${parentProp}.${idx}`
          item._prop = _prop
          if (!item._errorFields) {
            Vue.set(item, '_errorFields', [])
          }
          if (parent) {
            item._ancestors = [parent, ...parent._ancestors || []]
            item._parent = parent
          }
          Object.keys(item).forEach(key => {
            const validateFn = this.validateHash[key]
            if (validateFn) {
              if (!item._validates) {
                item._validates = {}
              }
              item._validates[key] = validateFn(item)
            }
          })
          const childrenKey = this.treeProps.children
          const children = item[childrenKey]
          if (children) {
            if (this.defaultExpandAll && !this.hasDefaultExpandAll) {
              this.expandRowKeys.push(item[this.rowKey])
            }
            _pretreatment(children, `${_prop}.${childrenKey}`, item)
          }
        })
      }
      _pretreatment(data, parentProp)
      if (totalLen) {
        this.hasDefaultExpandAll = true
      }
    },
    // 通过传入的map获取校验的hash
    getValidateHash(map) {
      const hash = {}
      for (const [keys, value] of map.entries()) {
        keys.forEach(key => {
          hash[key] = value
        })
      }
      return hash
    },
    doValidator(data) {
      const rows = []
      const promises = []
      _doValidator.call(this, data)
      return Promise.all(promises).then((...args) => {
        const arr = args.flat().filter(item => item)
        if (!arr.length) {
          return { valid: true, invalids: {}, rows: [] }
        } else {
          this.hasDoValidator = true
          const invalids = {}
          arr.forEach((item) => {
            Object.assign(invalids, item)
          })
          return { valid: false, invalids, rows }
        }
      })
      function _doValidator(data) {
        data.forEach(row => {
          const descriptor = {}
          Object.keys(row).forEach(key => {
            const validateFn = this.validateHash[key]
            if (validateFn) {
              const { rules, isFormItem } = validateFn(row)
              if (isFormItem) {
                descriptor[key] = rules
              }
            }
          })
          if (Object.keys(descriptor).length) {
            const validator = new Schema(descriptor)
            const promise = new Promise(resolve => {
              validator.validate(row, (errors, fields) => {
                if (fields) {
                  const obj = {}
                  Object.entries(fields).forEach(([key, arr]) => {
                    const key2 = `${row._prop}.${key}`
                    const newArr = arr.map(item => {
                      return { ...item, field: key2 }
                    })
                    obj[key2] = newArr
                    row._errorFields.push(key)
                  })
                  rows.push(row)
                  resolve(obj)
                } else {
                  row._errorFields = []
                  resolve()
                }
              })
            })
            promises.push(promise)
          }
          _doValidator.call(this, row[this.treeProps.children] || [])
        })
      }
    },
    validate(cb) {
      window.requestIdleCallback(() => {
        const tableData = this.tableData
        this.doValidator(tableData).then(({ valid, invalids, rows }) => {
          const errorRow = rows[0]
          if (errorRow) {
            this.scrollIntoError(errorRow)
          }
          cb(valid, invalids)
        })
      })
    },
    validateField({ row, props, callback = () => {} }) {
      const descriptor = {}
      props = props || Object.keys(row)
      props = [props].flat()
      props.forEach(key => {
        const validateFn = this.validateHash[key]
        if (validateFn) {
          const { rules, isFormItem } = validateFn(row)
          if (isFormItem) {
            descriptor[key] = rules
          }
        }
      })
      const validator = new Schema(descriptor)
      validator.validate(row, (errors, fields) => {
        if (fields) {
          const obj = {}
          Object.entries(fields).forEach(([key, arr]) => {
            const key2 = `${row._prop}.${key}`
            const newArr = arr.map(item => {
              return { ...item, field: key2 }
            })
            obj[key2] = newArr
            row._errorFields.push(key)
          })
          callback(false, obj)
        } else {
          row._errorFields = []
          callback(true, {})
        }
      })
    },
    clearValidate({ rows, props } = {}) {
      const _clearValidate = (rows) => {
        rows.forEach(row => {
          if (props) {
            const _errorFields = row._errorFields
            for (let i = _errorFields.length - 1; i >= 0; i--) {
              const _errorField = _errorFields[i]
              if (props.includes(_errorField)) {
                _errorFields.splice(i, 1)
              }
            }
          } else {
            row._errorFields = []
          }
          if (isClearAll) {
            const children = row[this.treeProps.children]
            if (children) {
              _clearValidate(children)
            }
          }
        })
      }
      let isClearAll = false
      if (!rows) {
        rows = this.tableData
        isClearAll = true
      }
      rows = [rows].flat()
      if (props) {
        props = [props].flat()
      }
      _clearValidate(rows)
    },
    // 获取元素展开后所在的位置
    getRowPosition(row) {
      const _getRowPosition = (data) => {
        return data.some(item => {
          pos++
          if (item === row) {
            return true
          } else if (this.expandRowKeys.includes(item[this.rowKey])) {
            const children = item[this.treeProps.children]
            if (children) {
              return _getRowPosition(children)
            }
          }
        })
      }
      let pos = -1
      // 将验证不通过的元素的所有祖先元素全部展开
      const ancestors = row._ancestors
      if (ancestors) {
        this.toggleExpandRowKeys(ancestors, true)
      }
      const data = this.tableData
      _getRowPosition(data)
      return pos
    },
    scrollIntoError(errorRow) {
      const pos = this.getRowPosition(errorRow)
      const tableEl = this.$refs.tableRef.$el
      const bodyWrapper = tableEl.querySelector('.el-table__body-wrapper')
      bodyWrapper.scrollTop = pos * this.lineHeight
    },
    // 监听数据每一层数量的变化
    watchFlatLen() {
      this.$watch(
        function() {
          const flatLen = { len: 0 }
          this.getFlatLen(this.tableData, flatLen)
          return flatLen.len
        },
        function(newVal) {
          // 当展开行数量不为空的时候,让default-row-keys=true的设置失效
          if (this.expandRowKeys.length) {
            this.hasDefaultExpandAll = true
          }
          this.pretreatment(this.tableData, 'tableData', newVal)
        }, {
          immediate: true
        }
      )
    },
    getFlatLen(data, flatLen) {
      data.forEach(item => {
        const children = item[this.treeProps.children]
        if (children) {
          this.getFlatLen(children, flatLen)
        }
      })
      flatLen.len += data.length
    },
    // hack 表头的checkbox不能通过数据驱动改变选中状态
    hackCheckAllChange() {
      this.showHeader = false
      this.$nextTick(() => {
        this.showHeader = true
        this.$nextTick(() => {
          const tableEl = this.$refs.tableRef.$el
          const tableBodyWrapper = tableEl.querySelector('.el-table__body-wrapper')
          const tableHeaderWrapper = tableEl.querySelector('.el-table__header-wrapper')
          tableHeaderWrapper.scrollLeft = tableBodyWrapper.scrollLeft
        })
      })
    },
    clearSelection() {
      this.doCheck(false)
    },
    toggleRowSelection(row, selected) {
      if (typeof selected === 'boolean') {
        this.doCheck(selected, row)
      } else {
        this.doCheck(!row._checked, row)
      }
    },
    toggleAllSelection(selected) {
      if (typeof selected === 'boolean') {
        this.doCheck(selected)
      } else {
        this.doCheck(!this.checkAll)
      }
    },
    handleSelect(bool, row) {
      const selection = this.doCheck(bool, row)
      this.$emit('select', selection, row, bool)
    },
    getSelection() {
      const _getSelection = (data) => {
        data.forEach(item => {
          if (item._checked) {
            selection.push(item)
          }
          const children = item[this.treeProps.children]
          if (children) {
            _getSelection(children)
          }
        })
      }
      const selection = []
      const tableData = this.tableData
      _getSelection(tableData)
      return selection
    },
    doCheck(bool, row) {
      const _doCheck = (bool, row) => {
        let children = []
        if (!row) {
          children = this.tableData
        } else {
          Vue.set(row, '_checked', bool)
          // 当被选中的时候,不确定状态取消掉
          Vue.set(row, '_indeterminate', false)
          children = row[this.treeProps.children] || []
        }
        // 当选中状态发生变化时,其所有的后代要跟着做同样的变化
        children.forEach(item => {
          _doCheck(bool, item)
        })
        if (row) {
          const ancestors = row._ancestors
          if (ancestors) {
            // 当选中状态发生变化时
            // 当祖先节点的子节点没有全部选中时,祖先节点取消掉选中
            // 当祖先节点的子节点没有全部选中或没有全部未选中时,加上不确定状态,否则去掉
            ancestors.forEach(ancestor => {
              const ancestorChildren = ancestor[this.treeProps.children]
              const isAllUnchecked = ancestorChildren.every(ancestorChild => {
                return !ancestorChild._checked
              })
              const isAllChecked = ancestorChildren.every(ancestorChild => {
                return ancestorChild._checked
              })
              Vue.set(ancestor, '_checked', isAllChecked)
              if (isAllUnchecked || isAllChecked) {
                Vue.set(ancestor, '_indeterminate', false)
              } else {
                Vue.set(ancestor, '_indeterminate', true)
              }
            })
          }
        }
      }
      _doCheck(bool, row)
      const selection = this.getSelection()
      this.$emit('selection-change', selection)
      return selection
    },
    initTable() {
      const tableRef = this.$refs.tableRef
      const tableEl = tableRef.$el
      tableEl.style.setProperty('--lineHeight', `${this.lineHeight}px`)
      setTimeout(() => {
        tableRef.doLayout()
      })
    },
    handleScroll() {
      this.debounceOnScroll()
    },
    getRealCols() {
      const tableEl = this.$refs.tableRef.$el
      const colgroup = tableEl.querySelector('colgroup')
      const cols = colgroup.querySelectorAll('col')
      const idxMapScroll = {};
      [...cols].reduce((prev, col, idx) => {
        idxMapScroll[idx] = { left: prev, right: prev + Number(col.width) }
        return idxMapScroll[idx].right
      }, 0)
      const tableBody = tableEl.querySelector('.el-table__body-wrapper')
      this.scrollLeft = tableBody.scrollLeft
      const scrollRight = this.scrollLeft + tableBody.clientWidth
      const realCols = []
      Object.entries(idxMapScroll).forEach(([key, { left, right }]) => {
        if (left > scrollRight || right < this.scrollLeft) {
          return false
        } else {
          realCols.push(key)
        }
      })
      this.realCols = realCols
    },
    refreshHeight({ totalHeight, prevHeight }) {
      const tableEl = this.$refs.tableRef.$el
      tableEl.style.setProperty('--prevHeight', `${prevHeight.height}px`)
      tableEl.style.setProperty('--totalHeight', `${totalHeight.height}px`)
    },
    getRealData() {
      const tableRef = this.$refs.tableRef
      if (!tableRef) {
        return false
      }
      const tableEl = tableRef.$el
      const tablePanel = tableEl
      let clientHeight = tablePanel.clientHeight
      const tableHeader = tableEl.querySelector('.el-table__header-wrapper')
      if (tableHeader) {
        clientHeight -= tableHeader.clientHeight
      }
      if (this.showSummary) {
        clientHeight -= this.lineHeight
      }
      const bodyWrapper = tableRef.$el.querySelector('.el-table__body-wrapper')
      // 滚动条的滚动距离
      const scrollTop = bodyWrapper.scrollTop
      const realData = []
      const totalHeight = { height: 0 }
      const prevHeight = { height: 0 }
      this._getRealData({ scrollTop, clientHeight, data: this.tableData, realData, totalHeight, prevHeight })
      this.refreshHeight({ totalHeight, prevHeight })
      this.realData = realData
      this.getVirtualIds({ realData, scrollTop, prevHeight, clientHeight })
    },
    _getRealData({ scrollTop, clientHeight, data, realData, totalHeight, prevHeight }) {
      data.forEach(item => {
        const groupHeight = this.getGroupHeight(item)
        // 当之上的高度加上自身组的高度小于滚动高度,那么可以认为其自身以及子元素未在视口中
        if (totalHeight.height + groupHeight < scrollTop) {
          prevHeight.height += groupHeight
        // 当之上的高度比视口的底部小的时候,那么可以认为其自身以及某些子元素在视口中
        } else if (totalHeight.height <= scrollTop + clientHeight) {
          realData.push(item)
          const currentGroupHeight = { height: this.lineHeight }
          this._setChildren({ item, totalHeight, scrollTop, clientHeight, currentGroupHeight })
        }
        // 总高度追加上当前组的高度
        totalHeight.height += groupHeight
      })
    },
    getGroupHeight(item) {
      const _getGroupCount = (item) => {
        count += 1
        const children = item[this.treeProps.children]
        if (
          this.expandRowKeys.includes(item[this.rowKey]) &&
          children
        ) {
          children.forEach(child => {
            _getGroupCount(child)
          })
        }
      }
      let count = 0
      _getGroupCount(item)
      return count * this.lineHeight
    },
    _setChildren({ item, totalHeight, scrollTop, clientHeight, currentGroupHeight }) {
      if (item[this.treeProps.children]) {
        // 当节点是展开的,那么子元素都放到realData的展示数据中
        if (this.expandRowKeys.includes(item[this.rowKey])) {
          item[this.childrenKey] = []
          const children = item[this.treeProps.children]
          children.forEach((child, idx) => {
            if (totalHeight.height + currentGroupHeight.height <= scrollTop + clientHeight) {
              item[this.childrenKey].push(child)
              currentGroupHeight.height += this.lineHeight
              this._setChildren({ item: child, totalHeight, scrollTop, clientHeight, currentGroupHeight })
            // hack 至少放一个子元素到展示数据中,避免展开收起图标不展示
            } else if (!idx) {
              item[this.childrenKey].push(child)
              delete child[this.childrenKey]
            }
          })
        } else {
          // hack 当节点是闭合的那么至少放一个子元素到展示数据中,避免展开收起图标不展示
          item[this.childrenKey] = item[this.treeProps.children].slice(0, 1)
        }
      }
    },
    getVirtualIds({ realData, scrollTop, prevHeight, clientHeight }) {
      const prevHiddenHeight = scrollTop - prevHeight.height
      const visibleHeightClosure = [prevHiddenHeight, prevHiddenHeight + clientHeight]
      const virtualTotalHeight = { height: 0 }
      const virtualIds = []
      this._getVirtualIds({ virtualIds, visibleHeightClosure, data: realData, isAncestorExpand: true, virtualTotalHeight })
      this.virtualIds = virtualIds
    },
    _getVirtualIds({ virtualIds, visibleHeightClosure, data, isAncestorExpand = true, virtualTotalHeight }) {
      data.forEach(item => {
        if (!isAncestorExpand) {
          virtualIds.push(item[this.rowKey])
        } else {
          if (virtualTotalHeight.height + this.lineHeight < visibleHeightClosure[0] || virtualTotalHeight.height > visibleHeightClosure[1]) {
            virtualIds.push(item[this.rowKey])
          }
          virtualTotalHeight.height += this.lineHeight
        }
        const isExpand = isAncestorExpand && this.expandRowKeys.includes(item[this.rowKey])
        const children = item[this.childrenKey]
        if (children) {
          this._getVirtualIds({ virtualIds, visibleHeightClosure, data: children, isAncestorExpand: isExpand, virtualTotalHeight })
        }
      })
    },
    toggleExpandRowKeys(rows, expanded) {
      let expandRowKeys = this.expandRowKeys
      const keys = rows.map(row => row[this.rowKey])
      if (expanded) {
        expandRowKeys.push(...keys)
      } else {
        for (let i = expandRowKeys.length - 1; i >= 0; i--) {
          const key = expandRowKeys[i]
          if (keys.includes(key)) {
            expandRowKeys.splice(i, 1)
          }
        }
      }
      expandRowKeys = new Set(expandRowKeys)
      this.expandRowKeys.length = 0
      this.expandRowKeys.push(...expandRowKeys)
    },
    doExpand(rows, expanded) {
      this.toggleExpandRowKeys(rows, expanded)
      this.getRealData()
    },
    expandChange(row, expanded) {
      this.doExpand([row], expanded)
    }
  }
}
</script>
<style>
  .virtual-table .el-table__cell{
    padding:0
  }
  .virtual-table .el-table__body-wrapper::before,
  .virtual-table .el-table__fixed-body-wrapper::before{
    content:'';
    display: block;
    position:absolute;
    top:0;
    left:0;
    width:100%;
    height: var(--totalHeight);
    z-index: -1;
  }
  .virtual-table .el-table__body-wrapper .el-table__body,
  .virtual-table .el-table__fixed-body-wrapper .el-table__body{
    transform: translateY(var(--prevHeight));
  }
  .virtual-table .cell{
    padding-left: 0;
    padding-right: 0;
    display:flex;
    align-items: center;
  }
  .virtual-table .el-table__row{
    height: var(--lineHeight);
  }
  .virtual-table .el-form-item{
    margin-bottom: 0;
    height: calc( var(--lineHeight) - 1px )!important;
    flex-grow: 1;
  }
  .virtual-table .el-form-item .el-input__inner,
  .virtual-table .el-form-item .el-textarea__inner{
    vertical-align: bottom;
    border-radius: 0;
    height: calc( var(--lineHeight) - 1px )!important;
  }
  .virtual-table .el-input-text{
    height: 100%;
    display: flex;
    align-items: center;
  }
  .virtual-table .el-form-item:not(.is-error) .el-input__inner:not(:focus),
  .virtual-table .el-form-item:not(.is-error) .el-textarea__inner:not(:focus){
    border-color: transparent;
  }
  .virtual-table .el-form-item > .el-input::after,
  .virtual-table .el-form-item > .el-select::after,
  .virtual-table .el-form-item > .el-textarea::after,
  .virtual-table .el-form-item > .el-input-text::after{
    content: "";
    width: 0;
    height: 0;
    display: block;
    border-width: 3px;
    border-style: solid;
    border-color: transparent rgba(85,135,240,.6) rgba(85,135,240,.6) transparent;
    position: absolute;
    bottom: 0;
    right: 0;
  }
  .virtual-table .el-table__indent~.el-form-item,
  .virtual-table .el-table__expand-icon~.el-form-item{
    display: inline-block;
  }
  .virtual-table .el-select{
    display:block;
  }
  .virtual-table .el-input-number{
    width:100%;
  }
</style>
