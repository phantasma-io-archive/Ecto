<template>
  <div>
    <v-app-bar key="appbar" app color="primary" dark style="font-size:16px">
      <v-icon>mdi-wallet</v-icon><v-spacer />
      <v-list-item link @click="goto('/wallets')">
        <v-list-item-content v-if="!state.balanceShown">
          <v-list-item-title>***</v-list-item-title>
          <v-list-item-subtitle>***</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-content v-else>
          <v-list-item-title>{{ shorterAddress }}</v-list-item-title>
          <v-list-item-subtitle>{{ shortAddress }}</v-list-item-subtitle>
        </v-list-item-content>
        <v-icon>mdi-menu-down</v-icon>
      </v-list-item>
      <v-spacer />
      <v-btn icon @click="goto('/')">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main style="width:320px; max-height:500px">
      <v-progress-linear
        v-if="isLoading"
        color="#17b1e8"
        indeterminate
        style="z-index:7777;position:absolute;"
      ></v-progress-linear>
      <div class="pl-3 pr-3" style="overflow: auto; height: 500px">
        <div class="pa-0 ma-0 mt-3 mb-3">
          <v-row>
            <v-col class="pl-3 pt-1 flex-grow-1">
              <v-text-field
                tabindex="1"
                dense
                v-model="searchText"
                required
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                prepend-inner-icon="mdi-magnify"
              />
            </v-col>
            <v-col style="max-width: 85px">
              <v-btn icon small class="mr-1" @click="sortDialog = true"
                ><v-icon>mdi-sort</v-icon></v-btn
              >
              <v-btn
                :disabled="sendSymbol !== 'TTRS'"
                icon
                small
                @click="filtersDialog = true"
                ><v-icon>mdi-filter-menu</v-icon></v-btn
              >
            </v-col>
          </v-row>
          <p class="pa-0 ma-0" style="margin-top:-20px !important">
            {{ nftArray.length }} {{ sendSymbol }} NFTs
            <span v-if="viewModeSend"
              >- {{ selectedNum }} {{ $t("nfts.selected") }}
              <v-btn
                dense
                text
                style="height:25px; color:#17b1e8; margin-top:-2px"
                @click="askSendWhere"
                :disabled="sendNFTsDisabled"
                >{{ $t("nfts.send") }}</v-btn
              ></span
            >
            <span v-if="viewModeBurn"
              >- {{ selectedNum }} {{ $t("nfts.selected") }}
              <v-btn
                dense
                text
                style="height:25px; color:#17b1e8; margin-top:-2px"
                @click="askBurnWhere"
                :disabled="burnNFTsDisabled"
                >{{ $t("nfts.burn") }}</v-btn
              ></span
            >
          </p>
        </div>
        <v-row>
          <v-virtual-scroll
            bench="4"
            :items="nftArray"
            height="415"
            item-height="135"
          >
            <template v-slot="{ item }">
              <v-card
                style="height:120px; margin:10px"
                :color="item.isSelected ? 'blue lighten-4' : ''"
                @click="toggle(item)"
              >
                <div class="d-flex flex-no-wrap justify-space-between">
                  <div style="text-overflow:hidden; overflow:hidden">
                    <v-card-text
                      class="pr-1 pl-2 pt-0"
                      style="border:1px solid #aaa0"
                    >
                      <div
                        class="overline"
                        style="color:#17b1e8; font-size: 11px !important"
                      >
                        {{ getOverline(item) }}
                      </div>
                      <p
                        class="text--primary"
                        style="font-size:12px;line-height: 1.0275rem"
                      >
                        {{
                          item.name.length > 50
                            ? item.name.slice(0, 50) + "..."
                            : item.name
                        }}
                      </p>
                      <p></p>
                      <v-spacer />
                    </v-card-text>
                    <div
                      style="position:absolute; bottom:5px; left:10px; color:gray"
                    >
                      #{{ item.mint }}
                    </div>
                    <!-- v-if="item.infusion && item.infusion.length > 0" -->

                    <div
                      v-if="item.infusion"
                      style="position:absolute; bottom:5px; right:128px; color:gray"
                    >
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                          <v-icon v-bind="attrs" v-on="on"
                            >mdi-shield-lock-outline</v-icon
                          >
                        </template>
                        <div
                          style="width: 150px; max-width:240px; overflow: hidden"
                        >
                          <div
                            class="overline"
                            style="color:#17b1e8; font-size: 11px !important;text-shadow: 1px 1px 20px #000000, 1px 1px 2px #000000;"
                          >
                            {{ $t("nfts.infused") }}
                          </div>
                          <div
                            style="text-shadow: 1px 1px 10px #000000, 1px 1px 2px #000000;"
                            v-html="getInfusedItems(item)"
                          ></div>
                        </div>
                      </v-tooltip>
                    </div>
                  </div>

                  <v-avatar
                    class="ma-0"
                    size="118"
                    tile
                    style="background-color: #9991"
                  >
                    <v-img
                      contain
                      :class="{
                        placeholder: item.img.startsWith('placeholder'),
                      }"
                      :src="getResource(item.img)"
                      :lazy-src="getResource(item.img)"
                      height="84px"
                    ></v-img>
                  </v-avatar>
                </div>

                <!-- <v-img
                  :src="item.item_info.image_url + '?width=128'"
                  :lazy-src="item.item_info.image_url + '?width=128'"
                  height="80px"
                ></v-img>
                {{ item.item_info.name_english }}<br />
                #{{ item.mint }} -->
              </v-card>
              <!-- </v-col> -->
            </template>
          </v-virtual-scroll>
        </v-row>
      </div>
    </v-main>

    <v-dialog v-model="sendWhereDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{
          $t("nfts.destination")
        }}</v-card-title>

        <v-card-text>
          <span>
            {{ $t("nfts.select") }} {{ nftsToSend.length }}
            {{ sendSymbol }} NFTs
          </span>
          <br />
          <v-spacer />

          <v-form class="mt-5" @submit.prevent>
            <v-combobox
              :items="accountSendList"
              :label="$t('nfts.labelDest')"
              v-model="sendDestination"
              required
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              prepend-inner-icon="mdi-account"
            >
              <!-- <template v-slot:selection="data">
                <div>
                  <strong>{{ data.item.name }}</strong>
                  <br />
                  {{ data.item.address }}
                </div>
              </template> -->
              <template v-slot:item="data">
                <div>
                  <strong style="font-size:14px">{{ data.item.name }}</strong>
                  <br />
                  {{ data.item.address }}
                </div>
              </template>
            </v-combobox>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="sendWhereDialog = false">
            {{ $t("nfts.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="askSend">
            {{ $t("nfts.next") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="burnWhereDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{ $t("nfts.burnTitle") }}</v-card-title>

        <v-card-text>
          <span>
            {{ $t("nfts.confirmBurn") }} {{ nftsToBurn.length }}
            {{ burnSymbol }} NFTs. {{ $t("nfts.confirmBurnSecond") }}
          </span>
          <br />
          <v-spacer />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="burnWhereDialog = false">
            {{ $t("nfts.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="askBurn">
            {{ $t("nfts.next") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="signTxDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{ $t("nfts.authorize") }}</v-card-title>

        <v-card-text>
          <span v-if="needsWif">
            {{ $t("nfts.insertWIF") }}
          </span>
          <span v-if="needsPass">
            {{ $t("nfts.insertPassword") }}
          </span>
          <v-spacer />

          <v-form
            v-if="needsWif"
            @keyup.native.enter="doSignTx"
            @submit.prevent
          >
            <v-text-field
              tabindex="1"
              type="password"
              label="WIF"
              v-model="wif"
              required
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              prepend-inner-icon="mdi-key"
              counter="52"
            />
          </v-form>

          <v-form
            v-if="needsPass"
            @keyup.native.enter="doSignTx"
            @submit.prevent
          >
            <v-text-field
              tabindex="1"
              type="password"
              :label="$t('nfts.labelPassword')"
              v-model="password"
              required
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              prepend-inner-icon="mdi-lock"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="closeSignTx">
            {{ $t("nfts.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="doSignTx">
            {{ $t("nfts.sign") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="filtersDialog" max-width="290">
      <v-card>
        <v-card-title class="overline">{{ $t("nfts.filters") }}</v-card-title>
        <v-card-text class="pb-0">
          <v-form>
            <v-select
              v-model="filterType"
              class="pa-0"
              :items="filterTypeOptions"
              :label="$t('nfts.labeTypes')"
            ></v-select>
            <v-select
              v-model="filterRarity"
              class="pa-0"
              :items="filterRarityOptions"
              :label="$t('nfts.labelRarity')"
            ></v-select>
            <!-- <v-select v-model="filterMinted" class="pa-0" :items="filterMintedOptions" label="Minted"></v-select> -->
          </v-form>
        </v-card-text>

        <v-card-actions class="pt-0">
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="filtersDialog = false">
            {{ $t("nfts.close") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="sortDialog" max-width="290">
      <v-card>
        <v-card-title class="overline">{{ $t("nfts.sort") }}</v-card-title>
        <v-card-text class="pb-0">
          <v-form>
            <v-select
              v-model="sortDir"
              class="pa-0"
              :items="sortDirOptions"
              :label="$t('nfts.labelDirection')"
            ></v-select>
            <v-select
              v-model="sortParam"
              class="pa-0"
              :items="sortParamOptions"
              :label="$t('nfts.labelParameters')"
            ></v-select>
          </v-form>
        </v-card-text>

        <v-card-actions class="pt-0">
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="sortDialog = false">
            {{ $t("nfts.close") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ErrorDialog
      :show="errorDialog"
      :message="errorMessage"
      @close="errorDialog = false"
    />
  </div>
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
  TransactionData,
  ScriptBuilder,
} from "@/phan-js";

import { state, TxArgsData, PopupState } from "@/popup/PopupState";
import { Script } from "vm";
import ErrorDialogVue from "@/components/ErrorDialog.vue";

@Component({ components: { ErrorDialog: ErrorDialogVue } })
export default class extends Vue {
  requestInProcess = false;
  isLoading = true;
  panel = [];

  filterType = "All";
  filterTypeOptions = ["All", "Vehicle", "Item", "License", "Crate"];

  filterRarity = "All";
  filterRarityOptions = [
    "All",
    "Consumer",
    "Industrial",
    "Professional",
    "Custom",
    "Collector",
    "Unique",
  ];

  sortDir = "";
  sortDirOptions: string[] = [];

  messageNoWallet = "";

  sortParam = "Mint #";
  sortParamOptions = ["Mint #"];

  scrollKey = 0;

  sendDialog = false;
  sendWhereDialog = false;
  burnDialog = false;
  burnWhereDialog = false;

  sortDialog = false;
  filtersDialog = false;

  searchText = "";

  sendAmount = 0;
  sendMaxAmount = 0;
  sendSymbol = "";
  sendDecimals = 0;
  sendDestination = "";
  burnAmount = 0;
  burnMaxAmount = 0;
  burnSymbol = "";
  burnDecimals = 0;

  errorDialog = false;
  errorMessage = "";

  nftsToSend: any[] = [];
  nftsToBurn: any[] = [];

  signTxDialog = false;
  signTxCallback: (() => void) | null = null;

  state = state;

  wif = "";
  password = "";

  viewModeSend = false;
  viewModeBurn = false;

  async mounted() {
    this.viewModeSend = this.$route.params.mode == "send";
    this.viewModeBurn = this.$route.params.mode == "burn";
    this.sendSymbol = this.$route.params.symbol;
    this.burnSymbol = this.$route.params.symbol;
    console.log("sendSymbol", this.sendSymbol);
    console.log("burnSymbol", this.burnSymbol);

    await state.check(this.$parent.$i18n);
    this.isLoading = false;

    this.$root.$on("loading", (value: boolean) => {
      this.isLoading = value;
    });

    this.sortDir = this.$i18n.t("nfts.sortDirOptionsAsc").toString();
    this.sortDirOptions = [
      this.$i18n.t("nfts.sortDirOptionsAsc").toString(),
      this.$i18n.t("nfts.sortDirOptionsDesc").toString(),
    ];
  }

  goto(route: string) {
    this.$router.push(route);
  }

  get sendNFTsDisabled() {
    const num = this.selectedNum;
    return num === 0 || num > 100;
  }

  get burnNFTsDisabled() {
    const num = this.selectedNum;
    return num === 0 || num > 100;
  }

  get nftArray() {
    const unit = (k: any) => k;
    const sortAsc = (k: any[]) => k.sort((a, b) => a.mint - b.mint);
    const sortDesc = (k: any[]) => k.sort((a, b) => b.mint - a.mint);

    const sort =
      this.sortDir == this.$i18n.t("nfts.sortDirOptionsAsc").toString()
        ? sortAsc
        : sortDesc;

    const searchText = this.searchText.toLowerCase();

    const search = (k: any[]) =>
      k.filter((n) => n.name.toLowerCase().includes(searchText));

    const filterType = (k: any[]) =>
      k.filter((n: any) => this.filterType == n.type);

    const filterRarity = (k: any[]) =>
      k.filter((n: any) => {
        const rarity = n.rarity;
        switch (this.filterRarity) {
          case "Consumer":
            return rarity === 1;
          case "Industrial":
            return rarity === 2;
          case "Professional":
            return rarity === 3;
          case "Custom":
            return rarity === 4;
          case "Collector":
            return rarity === 5;
          case "Unique":
            return rarity === 6;
        }
        return true;
      });

    var idsNfts = this.account?.data.balances.find(
      (b) => b.symbol == this.sendSymbol
    )?.ids;

    if (!idsNfts) return [];

    let list = [];
    for (let i = 0; i < idsNfts.length; ++i) {
      const key = this.sendSymbol + "@" + idsNfts[i];
      const val = this.state.nfts[key];
      if (val) list.push(val);
    }

    if (this.filterType !== "All") list = filterType(list);
    if (this.filterRarity !== "All") list = filterRarity(list);
    if (this.searchText != "") list = search(list);

    list = sort(list);

    return list;
  }

  get selectedNum() {
    console.log(this.filterRarity);
    return this.nftArray.filter((n) => n.isSelected).length;
  }

  get nfts() {
    return this.state.nfts;
  }

  get account() {
    return this.state.currentAccount;
  }

  get accountSendList() {
    return this.state.accounts
      .filter((a) => a.address !== this.account!.address)
      .map((a) => {
        const addr = a.address;
        return {
          text: a.data.name != "anonymous" ? a.data.name : a.address,
          name: a.data.name,
          value: a.data.name != "anonymous" ? a.data.name : a.address,
          address:
            addr.substring(0, 10) +
            "..." +
            addr.substring(addr.length - 8, addr.length),
        };
      });
  }

  get needsWif() {
    const account = state.currentAccount;
    if (!account) return true;

    return account.type != "encKey" && account.type != "wif";
  }

  get needsPass() {
    const account = state.currentAccount;
    return account && account.type == "encKey";
  }

  get shorterAddress(): string {
    this.messageNoWallet = this.$i18n.t("nfts.noWallet").toString();
    if (!this.account) return this.messageNoWallet;

    if (this.account.data.name && this.account.data.name != "")
      return this.account.data.name;

    const addr = this.account.address;
    return (
      addr.substring(0, 6) +
      "..." +
      addr.substring(addr.length - 4, addr.length)
    );
  }

  get shortAddress(): string {
    this.messageNoWallet = this.$i18n.t("nfts.noWallet").toString();
    if (!this.account) return this.messageNoWallet;

    let addr = this.account.address;
    return (
      addr.substring(0, 10) +
      "..." +
      addr.substring(addr.length - 8, addr.length)
    );
  }

  sort() {}

  toggle(item: any) {
    console.log("switching item", JSON.stringify(item, null, 2));
    this.$set(item, "isSelected", item.isSelected ? false : true);
    // this.state.nfts[item.id].isSelected = this.state.nfts[item.id].isSelected
    // this.state.accountNfts[item.id].isSelected = this.state.nfts[item.id].isSelected
    //   ? false
    //   : true;
    // this.state.nfts = Object.assign({}, this.state.nfts);
    console.log("switched item", JSON.stringify(item, null, 2));
  }

  getResource(image: any) {
    let resource = "";
    if (
      image.startsWith("placeholder-nft-img") ||
      image.startsWith("placeholder-nft-video")
    ) {
      resource = chrome.extension.getURL(image);
    } else {
      resource = image;
    }
    return resource;
  }

  getOverline(item: any) {
    let rarities = [
      "None",
      "Consumer",
      "Industrial",
      "Professional",
      "Custom",
      "Collector",
      "Unique",
    ];
    const rarity = item.rarity;
    if (rarity) return rarities[rarity];

    return this.sendSymbol + " NFT";
  }

  getInfusedItems(item: any) {
    return item.infusion
      ? item.infusion
          .map(
            (i: any) =>
              '<v-avatar><img src="assets/' +
              i.Key.toLowerCase() +
              '.png" style="height: 1.5rem;vertical-align: middle;margin-right: 0.25rem;"/></v-avatar>' +
              state.formatBalance(i.Key, i.Value)
          )
          .join("<br/>")
      : "";
  }

  askSendWhere() {
    this.nftsToSend = this.nftArray.filter((n) => n.isSelected);
    this.sendDialog = false;
    this.sendWhereDialog = true;
  }

  askSend() {
    this.sendWhereDialog = false;
    this.signTxDialog = true;
    this.signTxCallback = this.sendNFTs;
  }

  askBurnWhere() {
    this.nftsToBurn = this.nftArray.filter((n) => n.isSelected);
    this.burnDialog = false;
    this.burnWhereDialog = true;
  }

  askBurn() {
    this.burnWhereDialog = false;
    this.signTxDialog = true;
    this.signTxCallback = this.burnNFTs;
  }

  closeSignTx() {
    this.wif = "";
    this.password = "";
    this.signTxCallback = null;
    this.signTxDialog = false;
  }

  doSignTx() {
    if (this.signTxCallback) this.signTxCallback();
    this.signTxCallback = null;
  }

  async sendNFTs() {
    if (!this.account) return;

    if (typeof this.sendDestination == "object") {
      this.sendDestination = (this.sendDestination as any).value;
    }

    console.log(
      "sending",
      this.nftsToSend.length,
      this.sendSymbol,
      "to",
      this.sendDestination
    );

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100 * this.nftsToSend.length;

    let sb = new ScriptBuilder();

    sb.beginScript();
    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    this.nftsToSend.forEach((nft) => {
      sb.callInterop("Runtime.TransferToken", [
        address,
        this.sendDestination,
        this.sendSymbol,
        nft.id,
      ]);

      console.log(
        "nft to send",
        nft.id,
        "of",
        this.sendSymbol,
        "for",
        this.sendDestination
      );
    });
    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    try {
      this.isLoading = true;
      let tx = "";
      if (this.needsWif) {
        tx = await state.signTx(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxWithPassword(txdata, address, this.password);
      }
      console.log("tx successful: " + tx);
      this.$root.$emit("checkTx", tx);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2500);
  }

  async burnNFTs() {
    if (!this.account) return;

    console.log("burning", this.nftsToBurn.length, this.burnSymbol);

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 2100 * this.nftsToBurn.length;

    let sb = new ScriptBuilder();

    sb.beginScript();
    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    this.nftsToBurn.forEach((nft) => {
      sb.callInterop("Runtime.BurnToken", [address, this.sendSymbol, nft.id]);

      console.log("nft to burn", nft.id, "of", this.sendSymbol);
    });
    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: state.payload,
    };

    try {
      this.isLoading = true;
      let tx = "";
      if (this.needsWif) {
        tx = await state.signTx(txdata, this.wif);
      } else if (this.needsPass) {
        tx = await state.signTxWithPassword(txdata, address, this.password);
      }
      console.log("tx successful: " + tx);
      this.$root.$emit("checkTx", tx);
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;
    }

    // close dialog when it's done
    this.closeSignTx();

    // refresh balances in 2.5 secs
    setTimeout(async () => {
      await this.state.refreshCurrentAccount();
      this.isLoading = false;
    }, 2500);
  }
}
</script>

<style>
.placeholder {
  filter: invert(100%);
}
</style>
