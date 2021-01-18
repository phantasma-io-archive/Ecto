<template>
  <div>
    <v-app-bar app color="primary" dark style="font-size:16px">
      <v-icon>mdi-wallet</v-icon><v-spacer />

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>{{ $t("wallets.select") }}</v-list-item-title>
          <v-list-item-subtitle></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-spacer />
    </v-app-bar>

    <v-main style="width:320px; max-height:500px">
      <v-list>
        <v-list-item
          v-for="acc in state.accounts"
          v-bind:key="acc.address"
          link
          @click="gotoAccount(acc)"
        >
          <v-list-item-avatar>
            <v-icon>mdi-wallet</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{
              getShorterAddress(acc.data)
            }}</v-list-item-title>
            <v-list-item-subtitle
              >{{ getShortAddress(acc.data) }}<br /><small>{{
                getTypeDesc(acc.type)
              }}</small></v-list-item-subtitle
            >
          </v-list-item-content>
          <v-list-item-action>
            <PopupMenu
              icon="mdi-dots-vertical"
              :actions="popupActions"
              :item="acc"
            ></PopupMenu>
          </v-list-item-action>
        </v-list-item>
      </v-list>

      <div style="padding: 20px">
        <v-btn block @click="$router.push('/addwallet')">{{
          $t("wallets.add")
        }}</v-btn>
      </div>
    </v-main>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Account } from "@/phan-js";

import { state, WalletAccount } from "@/popup/PopupState";
import PopupMenuComponent from "@/components/PopupMenu.vue";

@Component({
  components: {
    PopupMenu: PopupMenuComponent,
  },
})
export default class extends Vue {
  state = state;

  popupActions: any[] = [];
  desc: any = {};

  async mounted() {
    await this.state.check(this.$parent.$i18n);
    this.onChangeLanguage();
    this.$root.$on("changeLanguage", this.onChangeLanguage);
  }

  beforeDestroy() {
    this.$root.$off("changeLanguage", this.onChangeLanguage);
  }

  onChangeLanguage() {
    console.log("onChangeLanguage");
    this.popupActions = [
      // { icon: 'mdi-pen', title: "Add password", subtitle: "Store WIF with password", action: this.addPassword },
      // { divider: true },
      {
        icon: "mdi-delete",
        title: this.$i18n.t("wallets.title").toString(),
        subtitle: this.$i18n.t("wallets.subtitle").toString(),
        action: this.deleteAccount,
      },
    ];
  }

  getShorterAddress(account: Account): string {
    if (!account) return "account error";
    if (account.name && account.name != "") return account.name;

    let addr = account.address;
    if (!addr || addr.length < 8) return "account error";

    return (
      addr.substring(0, 6) +
      "..." +
      addr.substring(addr.length - 4, addr.length)
    );
  }

  getShortAddress(account: Account): string {
    if (!account) return "account error";
    let addr = account.address;
    if (!addr || addr.length < 8) return "account error";
    return (
      addr.substring(0, 8) +
      "..." +
      addr.substring(addr.length - 6, addr.length)
    );
  }

  getTypeDesc(type: string): string {
    if (type == "encKey") return this.$i18n.t("wallets.encKey").toString();
    else if (type == "unverified")
      return this.$i18n.t("wallets.unverified").toString();
    else if (type == "verified")
      return this.$i18n.t("wallets.verified").toString();
    return "";
  }

  async gotoAccount(account: WalletAccount) {
    await state.selectAccount(account);
    this.$router.push("/");
  }

  async deleteAccount(account: WalletAccount) {
    await state.deleteAccount(account);
  }
}
</script>

<style>
.v-expansion-panel-content__wrap {
  padding: 0;
}
</style>
