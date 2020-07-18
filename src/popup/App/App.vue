<template>
  <v-app style="width:320px; min-height:480px; max-height:540px">
    <router-view></router-view>

    <v-dialog v-model="settingsDialog" style="z-index:100">
      <v-card style="height:400px">
        <v-card-title>
          <v-img
            src="ecto.png"
            class="mx-auto mt-3 mb-3"
            style="max-width:120px"
          ></v-img>
          <div class="overline mx-auto">Ecto wallet v{{ version }}</div>
        </v-card-title>
        <v-card-text>
          <v-row class="mt-3">
            <v-select
              v-model="currency"
              :items="currencies"
              label="Currency to show"
              class="pl-4 pr-4"
              @input="changeCurrency()"
            ></v-select>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text color="blue darken-1" @click="settingsDialog = false"
            >Close</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-footer
      color="#17b1e8"
      tile
      elevation="0"
      dark
      style="padding:2px 5px; opacity:0; z-index:-1"
      >MainNet</v-footer
    >
    <v-footer
      color="#17b1e8"
      tile
      elevation="0"
      dark
      style="position:fixed; width:100%; bottom:0; padding:2px 5px; background:linear-gradient(45deg, #28cec6, #17b1e8); background-color:#17b1e8; z-index:1000"
      >MainNet<v-icon x-small class="ml-2" @click="refreshAccount"
        >mdi-refresh</v-icon
      ><v-spacer /><span @click="settingsDialog = true"
        >v{{ version }}<v-icon x-small class="ml-2">mdi-settings</v-icon>
      </span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import {
  PhantasmaAPI,
  Account,
  Transaction,
  getPrivateKeyFromWif,
  Balance,
} from "@/phan-js";

import { state } from "@/popup/PopupState";

@Component({})
export default class extends Vue {
  state = state;
  version = "";
  currencies = ["EUR", "USD", "GBP", "JPY", "CAD", "AUD", "CNY"];
  currency = "EUR";

  settingsDialog = false;

  async mounted() {
    await state.check();
    this.currency = state.currency;

    this.version = chrome.runtime.getManifest().version;

    if (!state.hasAccount) {
      this.$router.push("/addwallet");
    }
  }

  async changeCurrency() {
    console.log("setting currency", this.currency);
    await this.state.setCurrency(this.currency);
  }

  async refreshAccount() {
    if (state.hasAccount) {
      this.$root.$emit("loading", true);
      await state.refreshCurrentAccount();
      this.$root.$emit("loading", false);
    }
  }
}
</script>

<style>
.main_app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

header {
  background: linear-gradient(45deg, #28ceaf, #17b1e8);
}
</style>
