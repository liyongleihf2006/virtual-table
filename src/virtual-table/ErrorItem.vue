<template>
  <div
    class="el-form-item"
    :class="{'is-error':row._errorFields.includes(prop)}"
  >
    <slot />
  </div>
</template>

<script>
export default {
  inheritAttrs: false,
  inject: ['validateField'],
  props: {
    row: {
      type: Object,
      default() {
        return {}
      }
    },
    prop: {
      type: String,
      default: ''
    }
  },
  mounted() {
    var unwatch = this.$watch(
      function() {
        return this.row[this.prop]
      },
      function() {
        this.validateField({ row: this.row, props: [this.prop] })
      }
    )
    this.$once('hook:beforeDestroy', function() {
      unwatch()
    })
  }
}
</script>

<style>
  .el-no-edit ~ ::after{
    display: none;
  }
</style>
