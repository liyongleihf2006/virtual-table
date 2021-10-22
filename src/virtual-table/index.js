import Vue from "vue";
import ElTable from "./ElTable";
import ElTableColumn from "./ElTableColumn";
import VirtualTable from "./VirtualTable.vue";
import VirtualTableColumn from "./VirtualTableColumn.vue";
export { VirtualTable, VirtualTableColumn };
// 全局注册组件
Vue.component(ElTable.name, ElTable);
Vue.component(ElTableColumn.name, ElTableColumn);
const components = [VirtualTable, VirtualTableColumn];
const install = function(Vue) {
  components.forEach((component) => {
    Vue.component(component.name, component);
  });
};

/* istanbul ignore if */
if (typeof window !== "undefined" && window.Vue) {
  install(window.Vue);
}

export default {
  version: "0.0.1",
  install,
  VirtualTable,
};
