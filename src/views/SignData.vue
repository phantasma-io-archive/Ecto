<template>
  <div>
    <v-app-bar app color="primary" dark style="font-size:16px">
      <v-icon>mdi-wallet</v-icon><v-spacer />

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>PHANTASMA LINK</v-list-item-title>
          <v-list-item-subtitle>{{ $t('signData.request') }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-spacer />
    </v-app-bar>

    <v-main style="width:300px; max-height:500px">
      <v-overlay :value="isLoading">
        <v-progress-circular indeterminate size="64"></v-progress-circular>
      </v-overlay>

      <div style="padding: 20px">
        <v-row
          justify="space-around"
          style="background: url('connect.png'); background-position: center; height:140px"
        >
          <v-col style="text-align:center; width:124px; max-width:124px"
            ><v-avatar><img :src="faviconUrl" :title="url"/></v-avatar>
            <br /><strong>{{ dapp }}</strong
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

        <div style="padding-right: 30px">
          {{ $t('signData.description') }}
          <strong>{{ currentAccountDescription }}</strong
          >?
        </div>

        <v-spacer />

        <v-form
          v-if="needsWif"
          @keyup.native.enter="signtx"
          @submit.prevent
          style="margin: 0px 28px 10px 15px"
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
          @keyup.native.enter="signtx"
          @submit.prevent
          style="margin: 0px 28px 10px 15px"
        >
          <v-text-field
            tabindex="1"
            type="password"
            :label="$t('signData.password')"
            v-model="password"
            required
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            prepend-inner-icon="mdi-lock"
          />
        </v-form>

        <v-row style="margin-top:50px">
          <v-col>
            <v-btn secondary style="width: 85%" @click="refuse()">{{ $t('signData.refuse') }}</v-btn>
          </v-col>
          <v-col>
            <v-btn
              dark
              style="width: 85%; background-color:#17b1e7"
              @click="signData()"
              >{{ $t('signData.signData') }}</v-btn
            >
          </v-col>
        </v-row>
      </div>

      <v-dialog v-model="errorDialog" persistent max-width="290">
        <v-card>
          <v-card-title class="title">{{ $t('signData.error') }}</v-card-title>
          <v-card-text>{{ errorMessage }}</v-card-text>
          <v-card-actions>
            <v-btn color="blue darken-1" text @click="refuse()">{{ $t('signData.cancel') }}</v-btn>
            <v-spacer />
            <v-btn
              color="blue darken-1"
              text
              @click="
                isLoading = false;
                errorDialog = false;
              "
              >{{ $t('signData.retry') }}</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>
  </div>
</template>

<script lang="ts">
/// <reference types="chrome"/>
import Vue from "vue";
import Component from "vue-class-component";
import { state } from "@/popup/PopupState";

@Component({})
export default class extends Vue {
  isLoading = false;

  errorDialog = false;
  errorMessage: string | null = null;
  wif = "";
  password = "";

  dapp = "";
  url = "";
  hostname = "";
  domain = "";
  faviconUrl = "";

  messageRejected = "";

  state = state;

  async mounted() {
    console.log("authorize");

    await state.check();

    this.dapp = state.getDapp(this.$route.params.token);

    this.url = atob(this.$route.params.url);
    this.faviconUrl = atob(this.$route.params.favicon);
    this.hostname = new URL(this.url).hostname;
    this.domain = new URL(this.url).protocol + "//" + this.hostname;

    if (!state.hasAccount) {
      this.$router.push("/addwallet");
    }
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

    this.messageRejected = this.$i18n.t('signData.rejected').toString()

    chrome.runtime.sendMessage({
      uid: "plsres",
      tabid,
      sid,
      data: { id, success: false, message: this.messageRejected },
    });
    window.close();
  }

  async signData() {
    this.isLoading = true;

    const token = this.$route.params.token;
    const id = this.$route.params.id;
    const tabid = parseInt(this.$route.params.tabid);
    const sid = this.$route.params.sid;
    const hexdata = this.$route.params.hexdata;

    let signature = null;

    let bufRand = new Uint8Array(4);
    window.crypto.getRandomValues(bufRand);

    const random = Buffer.from(bufRand)
      .toString("hex")
      .toUpperCase();
    const allData = random + hexdata;

    this.messageRejected = this.$i18n.t('signData.rejected').toString()

    try {
      if (this.needsWif) {
        if (state.isWifValidForAccount(this.wif))
          signature = await state.signData(allData, this.wif);
        else {
          this.errorDialog = true;
          this.errorMessage =
            this.messageRejected + " " + state.currentAccount?.address;
        }
      } else
        signature = await state.signDataWithPassword(
          allData,
          state.currentAccount!.address,
          this.password
        );

      chrome.runtime.sendMessage({
        uid: "plsres",
        tabid,
        sid,
        data: { signature, random, id, success: true },
      });

      window.close();
    } catch (err) {
      this.errorDialog = true;
      this.errorMessage = err;

      // notify that something went bad ??
      chrome.runtime.sendMessage({
        uid: "plsres",
        tabid,
        sid,
        data: { id, success: false },
      });
    }
    return false;
  }
}
</script>

<style></style>
