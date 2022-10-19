<template>
  <v-app style="width:320px; min-height:480px; max-height:540px">
    <router-view></router-view>

    <v-dialog v-model="settingsDialog" style="z-index:10000">
      <v-card style="height:408px">
        <v-card-title>
          <v-img
            src="ecto.png"
            class="mx-auto mt-3 mb-3"
            style="max-width:80px"
          ></v-img>
          <div class="overline mx-auto">Ecto wallet v{{ version }}</div>
        </v-card-title>
        <v-card-text>
          <div v-if="!showAdvancedSettings">
          <v-row class="mt-3">
            <v-select
              v-model="currency"
              :items="currencies"
              :label="$t('app.currencyDescription')"
              class="pl-4 pr-4"
              @input="changeCurrency()"
            ></v-select>
          </v-row>
          <v-row class="mt-3">
            <v-select
              v-model="language"
              :items="languages"
              :label="$t('app.languageDescription')"
              class="pl-4 pr-4"
              @input="changeLanguage()"
            >
            </v-select>
          </v-row>
          </div>
          <div v-else>
          <v-row class="mt-3">
            <v-combobox class="mt-3 px-3 minicombo" label="Phantasma max gas limit" :items="gasLimitItems" v-model="gasLimitValue" dense @change="changeGasSettings">
            </v-combobox>
            <v-combobox class="my-3 px-3 minicombo" label="Phantasma gas price" :items="gasPriceItems" v-model="gasPriceValue" dense @change="changeGasSettings">
            </v-combobox>
          </v-row>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn text small color="grey darken-1" @click="showAdvancedSettings = !showAdvancedSettings">{{showAdvancedSettings ? "Back": "Advanced" }}</v-btn>
          <v-spacer />
          <v-btn text color="blue darken-1" @click="settingsDialog = false">{{
            $t("app.closeButton")
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-sheet
      v-if="snackError"
      @click="snackError = false"
      elevation="12"
      rounded="true"
      class="pa-5 mx-auto"
      style="max-width: 90%; left: 5%; bottom: 40px; position: absolute !important; background-color: #555; z-index: 303; color:white;opacity:0.95; border-radius:8px; font-size:14px"
    >
      {{ snackErrorMessage }}
      <p style="opacity:0.7; font-size: 10px; margin-top: 8px">
        {{ snackErrorMessageDetails }}
      </p>

      <v-row>
        <v-spacer />
        <v-btn text @click="snackError = false" color="#1bb7dc">OK</v-btn>
      </v-row>
    </v-sheet>

    <v-footer
      color="#17b1e8"
      tile
      elevation="0"
      dark
      style="padding:2px 5px; opacity:0; z-index:-1"
      >{{ state.nexusName }}</v-footer
    >
    <v-footer
      color="#17b1e8"
      tile
      elevation="0"
      dark
      style="position:fixed; width:100%; bottom:0; padding:2px 5px; background:linear-gradient(45deg, #28cec6, #17b1e8); background-color:#17b1e8; z-index:1000;"
      ><v-menu top offset-y :close-on-content-click="false">
        <template v-slot:activator="{ on, attrs }">
          <span color="primary" dark v-bind="attrs" v-on="on">
            {{ state.nexusName }}
          </span>
        </template>
        <v-list dense>
          <v-list-item-group v-model="netIndex">
            <v-list-item @click="selectNet('SimNet')">
              <v-list-item-title>SimNet</v-list-item-title>
              <v-list-item-action-text
                class="ma-0"
                style="font-size:10px; width:450px; text-align: right"
                ><v-text-field
                  v-if="editSimnetRpc"
                  v-model="simnetRpc"
                  autofocus
                  dense
                  @blur="acceptSimnetRpc"
                  @keyup.native.enter="acceptSimnetRpc"
                ></v-text-field
                ><span v-else style="width:300px; word-break:break-all">{{
                  simnetRpc
                }}</span></v-list-item-action-text
              ><v-list-item-action v-if="!editSimnetRpc" class="ml-1"
                ><v-btn icon small @click="editSimnetRpc = true"
                  ><v-icon small>mdi-pencil</v-icon></v-btn
                ></v-list-item-action
              >
            </v-list-item>
            <v-list-item @click="selectNet('TestNet')">
              <v-list-item-title>TestNet</v-list-item-title>
              <v-list-item-action-text
                class="ma-0"
                style="font-size:10px; width:450px; text-align: right"
                ><v-text-field
                  v-if="editTestnetRpc"
                  v-model="testnetRpc"
                  autofocus
                  dense
                  @blur="acceptTestnetRpc"
                  @keyup.native.enter="acceptTestnetRpc"
                ></v-text-field
                ><span v-else style="width:300px; word-break:break-all">{{
                  testnetRpc
                }}</span></v-list-item-action-text
              ><v-list-item-action v-if="!editTestnetRpc" class="ml-1"
                ><v-btn icon small @click="editTestnetRpc = true"
                  ><v-icon small>mdi-pencil</v-icon></v-btn
                ></v-list-item-action
              >
            </v-list-item>
            <v-list-item @click="selectNet('MainNet')">
              <v-list-item-title>MainNet</v-list-item-title>
              <v-list-item-action-text
                class="ma-0"
                style="font-size:12px; width:320px; text-align: right"
                ><v-select
                  dense
                  v-model="mainnetRpc"
                  item-text="info"
                  item-value="location"
                  :items="rpcList"
                  style="font-size:12px"
                  @change="acceptMainnetRpc"
                >
                  <template v-slot:item="data">
                    <div>
                      <strong style="font-size:14px">{{
                        data.item.location + " · " + data.item.msecs + " ms"
                      }}</strong>
                      <br />
                      {{ data.item.url + "/rpc" }}
                    </div>
                  </template></v-select
                ></v-list-item-action-text
              >
            </v-list-item>
          </v-list-item-group>
        </v-list> </v-menu
      ><v-icon x-small class="ml-2" @click="refreshAccount">mdi-refresh</v-icon
      ><v-icon x-small class="ml-2" @click="toggleBalance">mdi-eye</v-icon
      ><v-spacer /><span style="cursor:pointer;" @click="settingsDialog = true"
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

import { LOCALES } from "@/i18n/locales";
import { defaultLocale } from "@/i18n";
import { state } from "@/popup/PopupState";
import { Watch } from "vue-property-decorator";

@Component({})
export default class extends Vue {
  state = state;
  version = "";
  currencies = ["EUR", "USD", "GBP", "JPY", "CAD", "AUD", "CNY"];
  currency = "EUR";
  languages = [
    "English",
    "Français",
    "Italiano",
    "Spanish",
    "Русский",
    "中文",
    "Nederlands",
    "Deutsch",
    "Türkçe",
    "Tiếng Việt",
    "Norwegian",
    "Português",
  ];
  language = "en";
  balanceShown = true;

  LOCALES = LOCALES;
  defaultLocale = defaultLocale;

  rpcList: any[] = [];

  settingsDialog = false;

  snackError = false;
  snackErrorMessage = "";
  snackErrorMessageDetails = "";

  simnetRpc = "http://localhost:7077/rpc";
  editSimnetRpc = false;
  testnetRpc = "http://testnet.phantasma.io:7077/rpc";
  editTestnetRpc = false;
  mainnetRpc = "Auto";

  netIndex = 0;

  
  showAdvancedSettings = false;

  gasLimitValue: any = { text: '90000 (Default)', value: 90000}

  gasLimitItems = [ 
    { text: '2100000 (Advanced TXs)', value: 2100000},
    { text: '500000 (Standard TXs)', value: 500000},
  ]

  gasPriceValue: any = { text: '100000 (Default)', value: 100000}

  gasPriceItems = [ 
    { text: '100000 (Default)', value: 100000},
  ]


  @Watch("state.mainnetRpcList", { deep: true, immediate: true })
  onRpcListUpdate(old: any, newList: any) {
    if (!state.mainnetRpcList || state.mainnetRpcList.length == 0) return;
    const first = state.mainnetRpcList[0];
    this.rpcList = [
      { location: "Auto", url: first.url, info: "Auto", msecs: first.msecs },
      ...state.mainnetRpcList,
    ];
  }

  resetGasSettings() {
    this.gasLimitValue = { text: `${state.gasLimit} (Custom)` , value: state.gasLimit }
    this.gasPriceValue = { text: `${state.gasPrice} (Custom)` , value: state.gasPrice }

    // set item with proper label, if available
    const gasLimitItem = this.gasLimitItems.find(i =>  i.value == state.gasLimit)
    if (gasLimitItem) this.gasLimitValue = gasLimitItem

    const gasPriceItem = this.gasPriceItems.find(i =>  i.value == state.gasPrice)
    if (gasPriceItem) this.gasPriceValue = gasPriceItem
  }

  async mounted() {
    await state.check(this.$parent.$i18n);
    this.currency = state.currency;
    this.language = state.language;
    this.balanceShown = state.balanceShown;

    this.version = chrome.runtime.getManifest().version;

    this.resetGasSettings();

    const nexus = state.nexus;
    if (nexus == "simnet") this.netIndex = 0;
    if (nexus == "testnet") this.netIndex = 1;
    if (nexus == "mainnet") this.netIndex = 2;

    this.simnetRpc = state.simnetRpc;
    this.testnetRpc = state.testnetRpc;
    this.mainnetRpc = state.mainnetRpc;
    console.log("MainnetRpc is", this.mainnetRpc);

    if (!state.hasAccount) {
      this.$router.push("/addwallet");
    }

    this.$root.$on(
      "errorMessage",
      (error: { msg: string; details: string }) => {
        console.log("Error message: " + error.msg + " with " + error.details);
        this.snackErrorMessage = error.msg;
        this.snackErrorMessageDetails = error.details;
        this.snackError = true;
      }
    );

    this.$root.$on("checkTx", (tx: string) => {
      setTimeout(async () => {
        if (tx && tx !== "") {
          const error = await state.checkTxError(tx);
          if (error === "pending") {
            // retry because tx is pending
            setTimeout(async () => {
              const error = await state.checkTxError(tx);
              if (error) {
                let shortError =
                  error.length > 120 ? error.substring(0, 120) + "..." : error;
                this.$root.$emit("errorMessage", {
                  msg: this.$t("app.errorMessage"),
                  details: shortError,
                });
              }
            }, 2500);
          } else if (error) {
            let shortError =
              error.length > 120 ? error.substring(0, 120) + "..." : error;
            this.$root.$emit("errorMessage", {
              msg: this.$t("app.errorMessage"),
              details: shortError,
            });
          }
        }
      }, 2500);
    });
  }

  async changeCurrency() {
    console.log("setting currency", this.currency);
    await this.state.setCurrency(this.currency);
  }

  async changeLanguage() {
    console.log("setting language", this.language);
    const locale = state.getLocaleFromLanguage(this.language);
    if (this.$i18n.locale !== locale) {
      this.$i18n.locale = locale;
      await this.state.setLanguage(this.language);
      this.$root.$emit("changeLanguage");
    }
  }

  async changeGasSettings() {
    const gasPrice = typeof this.gasPriceValue == 'string' ? parseInt(this.gasPriceValue) : this.gasPriceValue.value
    const gasLimit = typeof this.gasLimitValue == 'string' ? parseInt(this.gasLimitValue) : this.gasLimitValue.value
    if (gasPrice > 0 && gasLimit > 0) {
      state.setGasPriceAndLimit(gasPrice, gasLimit)
    }
    else {
      this.resetGasSettings()
    }
  }

  async refreshAccount() {
    if (state.hasAccount) {
      this.$root.$emit("loading", true);
      await state.refreshCurrentAccount();
      this.$root.$emit("loading", false);
    }
  }

  async toggleBalance() {
    this.balanceShown = !this.balanceShown;
    console.log("setting balance toggle", this.balanceShown);
    await this.state.toggleBalance(this.balanceShown);
  }

  async selectNet(item: string) {
    console.log("selectNet", item);
    state.setNexus(item);
    if (state.nexus != item) await this.refreshAccount();
  }

  async acceptSimnetRpc() {
    this.editSimnetRpc = false;
    state.setSimnetRpc(this.simnetRpc);
  }

  async acceptTestnetRpc() {
    this.editTestnetRpc = false;
    state.setTestnetRpc(this.testnetRpc);
  }

  async acceptMainnetRpc() {
    console.log("Mainnet rpc set to", this.mainnetRpc);
    state.setMainnetRpc(this.mainnetRpc);
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
<style scoped>
.v-input .v-label {
  font-size: 10px;
}

.v-text-field input {
  font-size: 10px;
}

.v-list-item__title {
  flex: 1 1 70% !important;
}

.v-menu__content {
  max-width: 92%;
}

footer button:hover,
footer span:hover,
footer span:hover > i {
  color: black;
}
</style>
