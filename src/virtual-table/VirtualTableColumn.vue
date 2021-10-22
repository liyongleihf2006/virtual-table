<template>
  <table-column
    ref="tableColumnRef"
    v-bind="{...$attrs,...$props}"
    v-on="{...$listeners}"
  >
    <template slot="header" slot-scope="scope">
      <slot name="header" v-bind="scope">
        {{ label }}
      </slot>
    </template>
    <template slot="default" slot-scope="scope">
      <error-item v-bind="{...$attrs,...$props,...scope}">
        <slot v-if="activeId!==scope.row.id" name="default" v-bind="scope">
          <div class="el-input__inner cell--text">
            {{ scope.row[prop] }}
          </div>
        </slot>
        <slot v-if="activeId===scope.row.id" name="edit" v-bind="scope">
          <slot name="default" v-bind="scope">
            <div class="el-input__inner cell--text">
              {{ scope.row[prop] }}
            </div>
          </slot>
        </slot>
      </error-item>
    </template>
  </table-column>
</template>

<script>
import { addListener } from './activeRow'
import { TableColumn } from 'element-ui'
import ErrorItem from './ErrorItem.vue'
export default {
  name: 'VirtualTableColumn',
  components: {
    TableColumn,
    ErrorItem
  },
  inheritAttrs: false,
  props: {
    prop: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    fixed: {
      type: [Boolean, String],
      default: false
    }
  },
  data(){
    return {
      activeId:''
    }
  },
  mounted(){
    addListener((id)=>{
      this.activeId = id
    })
  }
}
</script>

<style>
  .virtual-table .el-input--text,
  .virtual-table .cell--text{
    height: 100%;
    display: flex;
    align-items: center;
    white-space: nowrap;
  }
</style>
