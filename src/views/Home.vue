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
      <v-btn icon @click="goto('/qr')">
        <v-icon>mdi-qrcode</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main style="width:320px; max-height:500px">
      <v-progress-linear
        v-if="isLoading"
        color="#17b1e8"
        indeterminate
        style="z-index:7777"
      ></v-progress-linear>
      <v-tabs v-model="activeTab" background-color="white" color="#17b1e8" right>
        <v-tab>Assets</v-tab>
        <v-tab @change="onActivityTab">Activity</v-tab>

        <v-tab-item key="1">
          <v-container
            class="overflow-y-auto overflow-x-hidden pa-0"
            style="max-height:400px"
          >
            <v-expansion-panels
              v-if="account"
              v-model="panel"
              multiple
              accordion
              hover
            >
              <v-expansion-panel
                v-for="item in account.data.balances"
                :key="item.symbol"
              >
                <v-expansion-panel-header>
                  <v-img :src="getAssetIcon(item)" max-width="40px"></v-img>
                  <div
                    style="margin:10px 1px 10px 15px;width:160px;font-size:16px"
                  >
                    <span>{{ getAmount(item) }} </span>
                    <span>{{ item.symbol }}</span
                    ><br /><span
                      style="font-size:12px; color:gray;"
                      v-if="isSecondLineVisible(item)"
                      >{{ getSecondLine(item) }}</span
                    >
                  </div>
                  <div style="margin:10px 1px;width:80px;font-size:16px">
                    {{ getCurrencyValue(item) }}<br /><span
                      style="font-size:12px; color:gray;"
                      v-if="isSecondLineVisible(item)"
                      >{{ getSecondLineValue(item) }}</span
                    >
                  </div>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <div class="d-flex justify-end mt-1 mr-3 mb-3">
                    <v-btn
                      small
                      text
                      v-if="item.symbol == 'SOUL'"
                      @click.stop="unstakeDialog = true"
                      :disabled="account.data.stake == 0"
                      ><v-icon>mdi-bank-transfer-out</v-icon> Unstake</v-btn
                    >
                    <v-btn
                      small
                      text
                      v-if="item.symbol == 'SOUL'"
                      @click.stop="stakeDialog = true"
                      :disabled="getUnstackedSoul() == '0'"
                      ><v-icon>mdi-bank-transfer-in</v-icon> Stake</v-btn
                    >
                    <v-btn
                      small
                      text
                      v-if="item.symbol == 'KCAL'"
                      @click.stop="claimDialog = true"
                      :disabled="account.data.unclaimed == 0"
                      ><v-icon>mdi-piggy-bank</v-icon> Claim</v-btn
                    >
                    <v-btn
                      small
                      text
                      v-if="item.symbol == 'TTRS'"
                      @click="goto('/nfts/' + item.symbol + '/view')"
                      :disabled="item.amount == 0"
                      ><v-icon>mdi-eye</v-icon> view</v-btn
                    >
                    <v-btn
                      small
                      text
                      v-if="item.symbol == 'CROWN'"
                      @click="goto('/nfts/' + item.symbol + '/view')"
                      :disabled="item.amount == 0"
                      ><v-icon>mdi-eye</v-icon> view</v-btn
                    >
                    <v-btn
                      small
                      text
                      v-if="item.symbol == 'GHOST'"
                      @click="goto('/nfts/' + item.symbol + '/view')"
                      :disabled="item.amount == 0"
                      ><v-icon>mdi-eye</v-icon> view</v-btn
                    >
                    <v-btn
                      small
                      text
                      @click="transferAsset($event, item)"
                      :disabled="item.amount == 0"
                      ><v-icon>mdi-export</v-icon> Send</v-btn
                    >
                  </div>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-container>
        </v-tab-item>

        <v-tab-item key="2">
          <div style="overflow: auto; height: 450px">
            <v-simple-table>
              <template v-slot:default>
                <tbody>
                  <tr v-for="item in txs" :key="item.hash">
                    <td style="font-size:11px; padding:6px" class="pl-3">
                      {{ getTime(item.timestamp) }}<br /><strong>{{
                        getDate(item.timestamp)
                      }}</strong>
                    </td>
                    <td style="font-size:11px; padding: 6px">
                      <TransactionComponent
                        :tx="item"
                        :address="account.address"
                      />
                    </td>
                    <!-- <td style="font-size:11px">{{ formatHash(item.hash) }}</td> -->
                    <td style="font-size:11px; padding: 5px">
                      <a
                        :href="getExplorerLink(item.hash)"
                        target="_blank"
                        rel="noopener noreferrer"
                        >view</a
                      >
                    </td>
                  </tr>
                  <tr v-for="item in loadingTxs" :key="item">
                    <td class="pa-0" style="width:50px">
                      <v-skeleton-loader type="list-item"></v-skeleton-loader>
                    </td>
                    <td class="pa-0" style="width:110px">
                      <v-skeleton-loader type="list-item"></v-skeleton-loader>
                    </td>
                    <td class="pa-0" style="width:30px">
                      <v-skeleton-loader type="list-item"></v-skeleton-loader>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
            <div style="text-align:center">
              <v-btn
                v-if="loadingTxs.length === 0 && showLoadMore"
                dense
                text
                class="ma-1"
                color="blue darken-1"
                @click="loadMoreTxs"
                >Load more</v-btn
              >
            </div>
          </div>
          <div class="pa-3"></div>
        </v-tab-item>
      </v-tabs>
    </v-main>

    <v-dialog v-if="claimDialog" v-model="claimDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">Claim KCAL?</v-card-title>

        <v-card-text>
          You are going to claim
          {{ getKcalUnclaimed() }} KCAL. This claims KCAL in advance, so you
          won't be able to unstake during 24h.

          <v-spacer />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="claimDialog = false">
            Disagree
          </v-btn>

          <v-btn color="blue darken-1" text @click="askClaimKcal">
            Agree
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="stakeDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">Stake SOUL</v-card-title>

        <v-card-text class="pb-0">
          You have {{ getUnstackedSoul() }} unstaked SOUL. How many do you want
          to stake?

          <v-slider
            v-model="stakeSoulAmount"
            :min="1"
            :max="getUnstackedSoul()"
            :value="1"
            step="0.01"
            thumb-label="always"
            style="margin-top:40px"
          >
            <template v-slot:thumb-label="{ value }">
              {{ Math.round((100 * value) / parseFloat(getUnstackedSoul())) }}%
            </template></v-slider
          >
          <v-row style="margin-top:-25px">
            <v-col class="mt-3">
              Add to Stakes
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                v-model="stakeSoulAmount"
                :min="1"
                :max="getUnstackedSoul()"
                single-line
                type="number"
                suffix="SOUL"
                style="width:120px"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row style="margin-top:-18px">
            <v-col class="mt-3">
              Result Stakes
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                :value="
                  parseFloat(getStackedSoul()) + parseFloat(stakeSoulAmount)
                "
                single-line
                type="number"
                suffix="SOUL"
                style="width:120px"
                disabled
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="stakeDialog = false">
            Cancel
          </v-btn>

          <v-btn color="blue darken-1" text @click="askStakeSoul">
            Stake
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="unstakeDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">Unstake SOUL</v-card-title>

        <v-card-text class="pb-0">
          You have {{ getStackedSoul() }} staked SOUL. How many do you want to
          unstake?

          <v-slider
            v-model="unstakeSoulAmount"
            :min="1"
            :max="getStackedSoul()"
            :value="1"
            step="0.01"
            thumb-label="always"
            style="margin-top:40px"
          >
            <template v-slot:thumb-label="{ value }">
              {{ Math.round((100 * value) / parseFloat(getStackedSoul())) }}%
            </template></v-slider
          >
          <v-row class="mb-0" style="margin-top:-25px">
            <v-col class="mt-3">
              Remove from Stakes
            </v-col>
            <v-col>
              <v-text-field
                :min="1"
                :max="getStackedSoul()"
                class="mt-0 mr-2"
                v-model="unstakeSoulAmount"
                single-line
                type="number"
                suffix="SOUL"
                style="width:120px"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row style="margin-top:-20px">
            <v-col class="mt-3">
              Result Stakes
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                :value="
                  parseFloat(getStackedSoul()) - parseFloat(unstakeSoulAmount)
                "
                single-line
                type="number"
                suffix="SOUL"
                style="width:120px"
                disabled
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="unstakeDialog = false">
            Cancel
          </v-btn>

          <v-btn color="blue darken-1" text @click="askUnstakeSoul">
            Unstake
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="sendDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">Send {{ sendSymbol }}</v-card-title>

        <v-card-text class="pb-0">
          You have {{ sendMaxAmount }} {{ sendSymbol }}. How many do you want to
          send?

          <v-slider
            v-model="sendAmount"
            :min="1"
            :max="sendMaxAmount"
            :value="1"
            step="0.01"
            thumb-label="always"
            style="margin-top:40px"
          >
            <template v-slot:thumb-label="{ value }">
              {{ Math.round((100 * value) / sendMaxAmount) }}%
            </template></v-slider
          >
          <v-row style="margin-top:-25px">
            <v-col class="mt-3">
              Send Amount
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                v-model="sendAmount"
                :min="1"
                :max="sendMaxAmount"
                single-line
                type="number"
                :suffix="sendSymbol"
                style="width:120px"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row style="margin-top:-20px">
            <v-col class="mt-4">
              Remaining
            </v-col>
            <v-col>
              <v-text-field
                class="mt-0 mr-2"
                :value="sendMaxAmount - sendAmount"
                single-line
                type="number"
                :suffix="sendSymbol"
                style="width:120px"
                disabled
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="gray darken-1" text @click="sendDialog = false">
            Cancel
          </v-btn>

          <v-btn color="blue darken-1" text @click="askSendWhere">
            Next
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="sendWhereDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">Destination</v-card-title>

        <v-card-text>
          <span>
            Select where do you want to send {{ sendAmount }} {{ sendSymbol }}
          </span>
          <br />
          <v-spacer />

          <v-form class="mt-5" @submit.prevent>
            <v-combobox
              :items="accountSendList"
              label="Dest address or name"
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
            Cancel
          </v-btn>

          <v-btn color="blue darken-1" text @click="askSend">
            Next
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="signTxDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">Authorize TX</v-card-title>

        <v-card-text>
          <span v-if="needsWif">
            Insert your WIF to sign transaction.
          </span>
          <span v-if="needsPass">
            Insert your password to sign transaction.
          </span>
          <v-spacer />

          <v-form
            class="mt-3"
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
              label="Password"
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
            Cancel
          </v-btn>

          <v-btn color="blue darken-1" text @click="doSignTx">
            Sign TX
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
import TransactionComponent from "@/components/TransactionComponent.vue";
import { Watch } from "vue-property-decorator";

@Component({
  components: { ErrorDialog: ErrorDialogVue, TransactionComponent },
})
export default class extends Vue {
  requestInProcess = false;
  isLoading = true;
  panel = [];
  offsetTxPage = 0;
  txs: TransactionData[] = [];
  loadingTxs = [0, 1, 2, 3, 4, 5, 6, 7];
  showLoadMore = false;

  activeTab = 0;

  claimDialog = false;
  stakeDialog = false;
  unstakeDialog = false;
  sendDialog = false;
  sendWhereDialog = false;

  stakeSoulAmount = 0;
  unstakeSoulAmount = 0;
  sendAmount = 0;
  sendMaxAmount = 0;
  sendSymbol = "";
  sendDecimals = 0;
  sendDestination = "";

  errorDialog = false;
  errorMessage = "";

  signTxDialog = false;
  signTxCallback: (() => void) | null = null;

  state = state;

  wif = "";
  password = "";

  async mounted() {
    (window as any).state = state;
    await this.state.check();
    await Promise.all([
      this.state.refreshCurrentAccount(),
      this.state.fetchRates(),
    ]);
    this.isLoading = false;

    console.log("all loaded with " + JSON.stringify(this.account));

    this.$root.$on("loading", (value: boolean) => {
      this.isLoading = value;
    });
  }

  goto(route: string) {
    this.$router.push(route);
  }

  get nftArray() {
    return Object.keys(this.state.nfts).map((k) =>
      Object.assign({ id: k }, this.state.nfts[k])
    );
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
    if (!this.account) return "<no wallet>";

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
    if (!this.account) return "<no wallet>";

    let addr = this.account.address;
    return (
      addr.substring(0, 10) +
      "..." +
      addr.substring(addr.length - 8, addr.length)
    );
  }

  @Watch('state.nexus')
  onWatchNexus(oldValue: string, newValue: string) {
    if (this.activeTab == 1)
    {
      this.onActivityTab();   // refresh activity tab on nexus change
    }
  }

  getTime(timestamp: number) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  }

  getDate(timestamp: number) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  }

  formatHash(hash: string) {
    return (
      hash.substring(0, 8) +
      "..." +
      hash.substring(hash.length - 6, hash.length)
    );
  }

  getExplorerLink(hash: string) {
    return "https://explorer.phantasma.io/tx/" + hash;
  }

  getAssetIcon(item: Balance) {
    return `assets/${item.symbol}.png`;
  }

  getAmount(balance: Balance) {
    return this.formatBalance(balance.amount, balance.decimals);
  }

  getCurrencyValue(balance: Balance) {
    if (!balance) return "";

    const val = parseFloat(
      this.formatBalance(balance.amount, balance.decimals)
    );
    const rate = state.getRate(balance.symbol);
    if (rate >= 0) {
      return (val * rate).toFixed(1) + " " + state.currencySymbol;
    }
    return "";
  }

  isSecondLineVisible(item: Balance) {
    return item.symbol == "SOUL" || item.symbol == "KCAL";
  }

  getKcalUnclaimed() {
    return this.formatBalance(this.account!.data.unclaimed, 10);
  }

  getStackedSoul() {
    if (!this.account) return "0";
    return this.formatBalance(this.account.data.stake, 8);
  }

  getUnstackedSoul() {
    if (!this.account) return "0";
    const soulBalance = this.account.data.balances.find(
      (b) => b.symbol == "SOUL"
    );
    if (!soulBalance) return "0";
    return this.formatBalance(soulBalance!.amount, 8);
  }

  getSecondLine(item: Balance) {
    if (!this.account) return "";

    if (item.symbol == "SOUL")
      return (
        "Staked " + this.formatBalance(this.account.data.stake, 8) + " SOUL"
      );
    if (item.symbol == "KCAL")
      return (
        "Unclaimed " +
        this.formatBalance(this.account.data.unclaimed, 10) +
        " KCAL"
      );
  }

  getSecondLineValue(balance: Balance) {
    if (!this.account || !this.account.data || !balance) return "";

    const amount =
      balance.symbol == "SOUL"
        ? this.account.data.stake
        : this.account.data.unclaimed;
    const val = parseFloat(this.formatBalance(amount, balance.decimals));
    const rate = state.getRate(balance.symbol);
    if (rate >= 0) {
      return (val * rate).toFixed(1) + " " + state.currencySymbol;
    }
    return "";
  }

  formatBalance(amount: string, decimals: number): string {
    if (decimals == 0) return amount;
    while (amount.length < decimals + 1) amount = "0" + amount;

    const intPart = amount.substring(0, amount.length - decimals);
    const decimalPart = amount.substring(
      amount.length - decimals,
      amount.length
    );
    if (parseInt(decimalPart) == 0) return intPart;
    return (
      intPart +
      "." +
      (decimalPart.length >= 2 ? decimalPart.substring(0, 2) : decimalPart)
    );
  }

  askClaimKcal() {
    this.claimDialog = false;
    this.signTxDialog = true;
    this.signTxCallback = this.claimKcal;
  }

  askStakeSoul() {
    this.stakeDialog = false;
    this.signTxDialog = true;
    this.signTxCallback = this.stakeSoul;
  }

  askUnstakeSoul() {
    this.unstakeDialog = false;
    this.signTxDialog = true;
    this.signTxCallback = this.unstakeSoul;
  }

  askSendWhere() {
    this.sendDialog = false;
    this.sendWhereDialog = true;
  }

  askSend() {
    this.sendWhereDialog = false;
    this.signTxDialog = true;
    this.signTxCallback = this.sendFT;
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

  async claimKcal() {
    if (!this.account) return;

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 800;

    let sb = new ScriptBuilder();

    const kcalBalance = this.account.data.balances.find(
      (b) => b.symbol == "KCAL"
    );

    if (kcalBalance != null && kcalBalance.amount != "0") {
      sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
      sb.callContract("stake", "Claim", [address, address]);
    } else {
      console.log("no kcal");
      sb.callContract("stake", "Claim", [address, address]);
      sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    }

    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: "4543542D302E36",
    };

    console.log(script);

    try {
      this.isLoading = true;
      if (this.needsWif) {
        const tx = await state.signTx(txdata, this.wif);
        console.log("tx successful: " + tx);
      } else if (this.needsPass) {
        const tx = await state.signTxWithPassword(
          txdata,
          address,
          this.password
        );
        console.log("tx successful: " + tx);
      }
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

  async stakeSoul() {
    if (!this.account) return;

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 800;

    let sb = new ScriptBuilder();

    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    sb.callContract("stake", "Stake", [
      address,
      Math.floor(this.stakeSoulAmount * 10 ** 8),
    ]);

    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: "4543542D302E36",
    };

    try {
      this.isLoading = true;
      if (this.needsWif) {
        const tx = await state.signTx(txdata, this.wif);
        console.log("tx successful: " + tx);
      } else if (this.needsPass) {
        const tx = await state.signTxWithPassword(
          txdata,
          address,
          this.password
        );
        console.log("tx successful: " + tx);
      }
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

  async unstakeSoul() {
    if (!this.account) return;

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 800;

    let sb = new ScriptBuilder();

    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    sb.callContract("stake", "Unstake", [
      address,
      Math.floor(this.unstakeSoulAmount * 10 ** 8),
    ]);

    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: "4543542D302E36",
    };

    try {
      this.isLoading = true;
      if (this.needsWif) {
        const tx = await state.signTx(txdata, this.wif);
        console.log("tx successful: " + tx);
      } else if (this.needsPass) {
        const tx = await state.signTxWithPassword(
          txdata,
          address,
          this.password
        );
        console.log("tx successful: " + tx);
      }
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

  transferAsset(event: Event, item: Balance) {
    event.stopImmediatePropagation();
    console.log("Going to transfer: " + item.symbol);

    if (item.symbol == "TTRS" || item.symbol == "CROWN" || item.symbol == "GHOST") {
      this.goto("/nfts/" + item.symbol + "/send");
      return;
    }

    this.sendSymbol = item.symbol;
    this.sendDecimals = item.decimals;
    this.sendMaxAmount = parseFloat(
      this.formatBalance(item.amount, item.decimals)
    );
    this.sendDialog = true;
  }

  async sendFT() {
    if (!this.account) return;

    if (typeof this.sendDestination == "object") {
      this.sendDestination = (this.sendDestination as any).value;
    }

    console.log(
      "sending",
      Math.floor(this.sendAmount * 10 ** this.sendDecimals),
      "of",
      this.sendSymbol,
      "to",
      this.sendDestination
    );

    const address = this.account.address;
    const gasPrice = 100000;
    const minGasLimit = 800;

    let sb = new ScriptBuilder();

    sb.beginScript();
    sb.allowGas(address, sb.nullAddress, gasPrice, minGasLimit);
    sb.callInterop("Runtime.TransferTokens", [
      address,
      this.sendDestination,
      this.sendSymbol,
      Math.floor(this.sendAmount * 10 ** this.sendDecimals),
    ]);
    sb.spendGas(address);
    const script = sb.endScript();

    const txdata: TxArgsData = {
      nexus: state.nexus,
      chain: "main",
      script,
      payload: "4543542D302E36",
    };

    try {
      this.isLoading = true;
      if (this.needsWif) {
        const tx = await state.signTx(txdata, this.wif);
        console.log("tx successful: " + tx);
      } else if (this.needsPass) {
        const tx = await state.signTxWithPassword(
          txdata,
          address,
          this.password
        );
        console.log("tx successful: " + tx);
      }
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

  async onActivityTab() {
    if (!this.account) return;

    this.isLoading = true;
    const res = await state.getAccountTransactions(this.account.address);
    this.offsetTxPage = 0;
    this.showLoadMore = res.result.txs ? res.result.txs.length === 15 : false;
    this.txs = res.result.txs;
    this.loadingTxs = [];
    this.isLoading = false;
  }

  async loadMoreTxs() {
    if (!this.account) return;

    this.loadingTxs = [0, 1, 2, 3, 4];
    this.isLoading = true;
    ++this.offsetTxPage;
    const res = await state.getAccountTransactions(
      this.account.address,
      this.offsetTxPage
    );
    this.showLoadMore = res.result.txs ? res.result.txs.length === 15 : false;
    this.txs.push(...res.result.txs);
    this.loadingTxs = [];
    this.isLoading = false;
  }
}
</script>

<style></style>
