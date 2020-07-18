import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "../views/Home.vue";
import QR from "../views/QR.vue";
import Wallets from "../views/Wallets.vue";
import AddWallet from "../views/AddWallet.vue";
import Authorize from "../views/Authorize.vue";
import Sign from "../views/Sign.vue";
import Nfts from "../views/Nfts.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/nfts/:symbol/:mode",
    name: "Nfts",
    component: Nfts,
  },
  {
    path: "/qr",
    name: "QR",
    component: QR,
  },
  {
    path: "/wallets",
    name: "Wallets",
    component: Wallets,
  },
  {
    path: "/addwallet",
    name: "Add Wallet",
    component: AddWallet,
  },
  {
    path: "/authorize/:dapp/:token/:id/:tabid/:sid/:url/:favicon",
    name: "Authorize",
    component: Authorize,
  },
  {
    path: "/sign/:token/:id/:tabid/:sid/:url/:favicon/:b64txdata",
    name: "Sign",
    component: Sign,
  },
];

const router = new VueRouter({
  routes,
  base: "/popup.html",
});

export default router;
