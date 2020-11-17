<template>
  <div>
    <v-app-bar app color="primary" dark style="font-size:16px">
      <v-icon>mdi-wallet</v-icon><v-spacer />

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>PHANTASMA LINK</v-list-item-title>
          <v-list-item-subtitle>Authorization request</v-list-item-subtitle>
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

        <div style="text-align:center" class="mb-7 mt-5">
          <strong>{{ $route.params.dapp }}</strong> wants to connect to
          Phantasma Link. Each transaction will request your permission. Do you
          want to allow it?
          <br />
          <br />
          {{ domain }}
        </div>

        <v-row style="margin: 5px">
          <v-select
            :items="authorizeForItems"
            v-model="authorizeFor"
            label="Authorize for"
          ></v-select>
        </v-row>

        <v-row class="mt-6">
          <v-col>
            <v-btn secondary style="width: 100%" @click="refuse()"
              >Refuse</v-btn
            >
          </v-col>
          <v-col>
            <v-btn
              dark
              style="width: 100%; background-color:#17b1e7"
              @click="connect()"
              >Connect</v-btn
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
import { Account, Transaction, getPrivateKeyFromWif, Balance } from "@/phan-js";

import { state } from "@/popup/PopupState";

@Component({})
export default class extends Vue {
  state = state;

  url = "";
  hostname = "";
  domain = "";
  faviconUrl = "";
  authorizeFor = "Current session";
  authorizeForItems = [
    "Current session",
    "One hour",
    "One day",
    "One month",
    "Always",
  ];

  async mounted() {
    console.log("authorize");

    this.url = atob(this.$route.params.url);
    this.faviconUrl = atob(this.$route.params.favicon);
    this.hostname = new URL(this.url).hostname;
    this.domain = new URL(this.url).protocol + "//" + this.hostname;

    await state.check();

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
