import Vue from "vue";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import App from "./App.vue";
Vue.use(ElementUI);
import VirtualTable from "./virtual-table";
Vue.use(VirtualTable);
Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount("#app");
