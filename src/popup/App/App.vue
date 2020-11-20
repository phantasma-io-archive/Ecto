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
      >{{ state.nexusName }}</v-footer
    >
    <v-footer
      color="#17b1e8"
      tile
      elevation="0"
      dark
      style="position:fixed; width:100%; bottom:0; padding:2px 5px; background:linear-gradient(45deg, #28cec6, #17b1e8); background-color:#17b1e8; z-index:1000"
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
import { Watch } from "vue-property-decorator";

@Component({})
export default class extends Vue {
  state = state;
  version = "";
  currencies = ["EUR", "USD", "GBP", "JPY", "CAD", "AUD", "CNY"];
  currency = "EUR";

  rpcList: any[] = [];

  settingsDialog = false;

  simnetRpc = "http://localhost:7077/rpc";
  editSimnetRpc = false;
  testnetRpc = "http://testnet.phantasma.io:7077/rpc";
  editTestnetRpc = false;
  mainnetRpc = "Auto";

  netIndex = 0;

  @Watch("state.mainnetRpcList", { deep: true, immediate: true })
  onRpcListUpdate(old: any, newList: any) {
    const first = state.mainnetRpcList[0];
    this.rpcList = [
      { location: "Auto", url: first.url, info: "Auto", msecs: first.msecs },
      ...state.mainnetRpcList,
    ];
  }

  async mounted() {
    await state.check();
    this.currency = state.currency;

    this.version = chrome.runtime.getManifest().version;

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

  async selectNet(item: string) {
    console.log("selectNet", item);
    state.setNexus(item);
    if (state.nexus != item)
      await this.refreshAccount();
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

.v-input .v-label {
  font-size: 10px;
}

.v-text-field input {
  font-size: 10px;
}
</style>
