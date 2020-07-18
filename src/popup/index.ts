import Vue from "vue";
import AppComponent from "./App/App.vue";
import router from '@/router'
import Vuetify from "vuetify";

Vue.use(Vuetify);

Vue.component("app-component", AppComponent);

new Vue({
  el: "#app",
  router,
  vuetify: new Vuetify(),
  render: createElement => {
    return createElement(AppComponent);
  }
});
