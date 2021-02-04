<template>
  <div>
    <v-app-bar app color="primary" dark style="font-size:16px">
      <v-icon>mdi-wallet</v-icon><v-spacer />

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>PHANTASMA LINK</v-list-item-title>
          <v-list-item-subtitle>{{
            $t("authorize.request")
          }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-spacer />
    </v-app-bar>

    <v-main style="width:300px; max-height:500px">
      <div style="padding: 20px">
        <v-row
          justify="space-around"
          style="background: url('connect.png'); background-position: center; height:140px"
        >
          <v-col style="text-align:center; width:124px; max-width:124px"
            ><v-avatar><img :src="faviconUrl" :title="url"/></v-avatar>
            <br /><strong>{{ $route.params.dapp }}</strong
            ><br />
            <div style="overflow:hidden;text-overflow:ellipsis">
              {{ hostname }}
            </div></v-col
          >
          <v-col style="text-align:center; width:124px; max-width:124px"
            ><v-avatar><img src="assets/soul.png"/></v-avatar><br /><strong>{{
              accountLabel
            }}</strong
            ><br />{{ accountAddress }}</v-col
          >
        </v-row>

        <div style="text-align:center" class="mb-4 mt-4">
          <strong>{{ $route.params.dapp }}</strong>
          {{ $t("authorize.description") }}
          <br />
          <br />
          {{ domain }}
        </div>

        <v-row style="margin: 5px;display:none;">
          <v-select
            :items="authorizeAccounts"
            v-model="authorizeAccount"
            :label="$t('authorize.labelAccount')"
          ></v-select>
        </v-row>

        <v-row style="margin: 5px">
          <v-select
            :items="authorizeForItems"
            v-model="authorizeFor"
            :label="$t('authorize.label')"
          ></v-select>
        </v-row>

        <v-row class="mt-6">
          <v-col>
            <v-btn secondary style="width: 100%" @click="refuse()">{{
              $t("authorize.refuse")
            }}</v-btn>
          </v-col>
          <v-col>
            <v-btn
              dark
              style="width: 100%; background-color:#17b1e7"
              @click="connect()"
              >{{ $t("authorize.connect") }}</v-btn
            >
          </v-col>
        </v-row>
      </div>
    </v-main>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";
import { Account, Transaction, getPrivateKeyFromWif, Balance } from "@/phan-js";

import { state, WalletAccount } from "@/popup/PopupState";

@Component({})
export default class extends Vue {
  state = state;

  url = "";
  hostname = "";
  domain = "";
  faviconUrl = "";
  authorizeFor = "";
  authorizeForItems: string[] = [];
  authorizeAccount: string = "";
  authorizeAccounts: string[] = [];

  async mounted() {
    console.log("authorize");

    await state.check(this.$parent.$i18n);

    this.authorizeForItems = [
      this.$i18n.t("authorize.periodCurrent").toString(),
      this.$i18n.t("authorize.period1h").toString(),
      this.$i18n.t("authorize.period1d").toString(),
      this.$i18n.t("authorize.period1m").toString(),
      this.$i18n.t("authorize.periodAlways").toString(),
    ];
    this.authorizeFor = this.$i18n.t("authorize.periodCurrent").toString();

    state.accounts.forEach((account) => {
      this.authorizeAccounts.push(account.address)
    })
    this.authorizeAccount = state.currentAccount!.address;

    this.url = atob(this.$route.params.url);
    this.faviconUrl = atob(this.$route.params.favicon);
    this.hostname = new URL(this.url).hostname;
    this.domain = new URL(this.url).protocol + "//" + this.hostname;

    if (!state.hasAccount) {
      this.$router.push("/addwallet");
    }
  }

  get accountLabel() {
    const account = state.currentAccount;
    if (!account) return "";
    const address = account.address;
    if (!account.data.name)
      return (
        address.substring(0, 8) +
        "..." +
        address.substring(address.length - 6, address.length)
      );

    return account.data.name;
  }

  get accountAddress() {
    const account = state.currentAccount;
    if (!account) return "";
    const address = account.address;
    return (
      address.substring(0, 8) +
      "..." +
      address.substring(address.length - 6, address.length)
    );
  }

  get currentAccountDescription() {
    const account = state.currentAccount;

    if (!account) return "";

    const address = account.address;
    const name = account.data.name;

    const saddr =
      address.substring(0, 8) +
      "..." +
      address.substring(address.length - 6, address.length);

    return name.length > 0 ? name + " (" + saddr + ")" : saddr;
  }

  refuse() {
    const id = this.$route.params.id;
    const tabid = parseInt(this.$route.params.tabid);
    const sid = this.$route.params.sid;

    chrome.runtime.sendMessage({
      uid: "plsres",
      tabid,
      sid,
      data: { id, success: false },
    });
    window.close();
  }

  @Watch("authorizeAccount")
  onWatchauthorizeAccount(oldValue: string, newValue: string) {

    // const matchAccount = this.state.accounts.filter((a) => a.address == newValue);
    // this.selectAccount(matchAccount[0]);

  }

  async selectAccount(newValue: WalletAccount) {

    await state.selectAccount(newValue);

  }

  async connect() {
    const date = new Date();

    switch (this.authorizeFor) {
      case this.authorizeForItems[1]:
        date.setHours(date.getHours() + 1);
        break;
      case this.authorizeForItems[2]:
        date.setDate(date.getDate() + 1);
        break;
      case this.authorizeForItems[3]:
        date.setMonth(date.getMonth() + 1);
        break;
      case this.authorizeForItems[4]:
        date.setDate(date.getDate() + 1000000);
        break;
    }

    const dapp = this.$route.params.dapp;
    const token = this.$route.params.token;
    const id = this.$route.params.id;
    const tabid = parseInt(this.$route.params.tabid);
    const sid = this.$route.params.sid;
    const hostname = this.hostname;

    await state.authorizeDapp(dapp, hostname, token, date);

    chrome.runtime.sendMessage({
      uid: "plsres",
      tabid,
      sid,
      data: { wallet: "Ecto", dapp, token, id, success: true },
    });

    window.close();
  }
}
</script>

<style>
.v-expansion-panel-header__icon {
  display: none;
}

.v-avatar {
  border-radius: 0;
}
</style>
