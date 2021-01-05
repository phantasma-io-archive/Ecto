import Vue from "vue";
import AppComponent from "./App/App.vue";
import router from '@/router'
import Vuetify from "vuetify";
import VueI18n from 'vue-i18n';
import { messages, defaultLocale } from "@/i18n";

Vue.use(VueI18n);
Vue.use(Vuetify);

const i18n = new VueI18n({
  messages,
  locale: defaultLocale,
  fallbackLocale: defaultLocale
});

Vue.component("app-component", AppComponent);


new Vue({
  el: "#app",
  router,
  i18n,
  vuetify: new Vuetify(),
  render: createElement => {
    return createElement(AppComponent);
  }
});
