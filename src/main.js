import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
// import opencv from "./plugins/opencv";
import router from "./router";
// import

Vue.config.productionTip = false;
Vue.prototype.$window = window;

new Vue({
  vuetify,
  router,
  // opencv,
  render: (h) => h(App),
}).$mount("#app");
