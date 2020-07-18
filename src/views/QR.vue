<template>
  <div>
    <v-app-bar key="appbar" app color="primary" dark style="font-size:16px">
      <v-icon>mdi-wallet</v-icon><v-spacer />
      <v-list-item link @click="goto('/wallets')">
        <v-list-item-content>
          <v-list-item-title>{{ shorterAddress }}</v-list-item-title>
          <v-list-item-subtitle>{{ shortAddress }}</v-list-item-subtitle>
        </v-list-item-content>
        <v-icon>mdi-menu-down</v-icon>
      </v-list-item>
      <v-spacer />
      <v-btn icon @click="goto('/')">
        <v-icon>mdi-home</v-icon>
      </v-btn>
    </v-app-bar>

    <v-content style="width:320px; max-height:500px">
      <v-container
        class="overflow-y-auto overflow-x-hidden pa-0"
        style="max-height:400px; font-size:10px; text-align:center"
      >
        <div class="text-subtitle-1 mt-4">
          This is your wallet's public address
        </div>
        <v-skeleton-loader
          v-if="isLoading"
          type="image"
          style="width:148px; height:148px; margin: 20px auto;"
        ></v-skeleton-loader>
        <img v-else :src="imgSrc" />

        {{ account.address }}
        <br />
        <a href="" @click.prevent="copyAddressToClipboard()"
          >copy to clipboard</a
        >
      </v-container>
    </v-content>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Account } from "@/phan-js";

import { state } from "@/popup/PopupState";
import { QRCode, ErrorCorrectLevel } from "qrcode-generator-ts/js";

@Component({})
export default class extends Vue {
  isLoading = true;
  imgSrc = "";

  state = state;

  goto(route: string) {
    this.$router.push(route);
  }

  get account() {
    return this.state.currentAccount;
  }

  get shorterAddress(): string {
    if (!this.account) return "<no wallet>";

    if (this.account.data.name && this.account.data.name != "")
      return this.account.data.name;

    let addr = this.account.address;
    return (
      addr.substring(0, 6) +
      "..." +
      addr.substring(addr.length - 4, addr.length)
    );
  }

  get shortAddress(): string {
    if (!this.account) return "<no wallet>";

    let addr = this.account.address;
    return (
      addr.substring(0, 10) +
      "..." +
      addr.substring(addr.length - 8, addr.length)
    );
  }

  async mounted() {
    await this.state.check();

    if (this.account) {
      const qr = new QRCode();
      qr.setTypeNumber(5);
      qr.setErrorCorrectLevel(ErrorCorrectLevel.Q);
      qr.addData(this.account.address);
      qr.make();

      this.imgSrc = qr.toDataURL(4);
    }

    this.isLoading = false;
  }

  copyAddressToClipboard() {
    if (!this.account) return;
    const el = document.createElement("textarea");
    el.value = this.account.address;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}
</script>

<style></style>
