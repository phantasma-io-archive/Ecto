<template>
  <div>
    <v-app-bar key="appbar" app color="primary" dark style="font-size:16px">
      <v-icon>mdi-wallet-plus</v-icon><v-spacer />

      <v-list-item link @click="goto('/wallets')">
        <v-list-item-content>
          <v-list-item-title>ADD WALLET</v-list-item-title>
          <v-list-item-subtitle></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-spacer />
      <v-btn
        v-if="state.accounts.length != 0"
        icon
        @click="$router.push('/wallets')"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main style="width:320px; max-height:500px">
      <v-overlay :value="isLoading">
        <v-progress-circular indeterminate size="64"></v-progress-circular>
      </v-overlay>

      <v-tabs background-color="white" color="#17b1e8" right>
        <v-tab>Import</v-tab>
        <v-tab>Create</v-tab>

        <v-tab-item key="1">
          <v-container
            class="overflow-y-auto overflow-x-hidden pa-0"
            style="max-height:500px"
          >
            <div style="padding: 20px">
              Import a wallet with its address or name (read only), or its WIF (read write).
              When using WIF you must protect it using a password.
            </div>

            <v-form
              @keyup.native.enter="importWallet"
              style="margin: 0px 28px 10px 15px"
            >
              <v-text-field
                tabindex="1"
                label="Wallet address or name"
                v-model="addressOrName"
                required
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                prepend-icon="mdi-account"
              />

              <span style="padding:120px">OR</span>

              <v-text-field
                tabindex="2"
                type="password"
                label="WIF"
                v-model="wif"
                required
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                prepend-icon="mdi-key"
                counter="52"
              />

              <v-text-field
                tabindex="3"
                label="Password"
                v-model="password"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                hint="Use at least 6 characters"
                prepend-icon="mdi-lock"
                :type="showpass ? 'text' : 'password'"
                :append-icon="showpass ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showpass = !showpass"
              />
            </v-form>
            <div style="padding: 20px">
              <v-btn
                block
                @click="importWallet"
                :disabled="
                  addressOrName.length == 0 &&
                    (wif.length != 52 || password.length < 6)
                "
                >Import Wallet</v-btn
              >
            </div>
          </v-container>
        </v-tab-item>

        <v-tab-item key="2">
          <v-container v-if="createStep === 0">
            <div style="padding: 80px 20px">
              <!-- Text describing process -->
            </div>
            <v-btn block @click="generate">
              Generate new wallet
            </v-btn>
          </v-container>
          <v-container v-if="createStep === 1">
            <div style="padding: 20px 20px">
              Wallet created with the following address and private key (WIF
              format). Note: you need to click "import wallet" below to be able to use it.
            </div>
            <v-textarea
              v-model="newAddress"
              readonly
              class="mx-2"
              label="Address"
              rows="2"
            ></v-textarea>
            <v-textarea
              v-model="newWif"
              readonly
              class="mx-2"
              label="WIF"
              rows="2"
            ></v-textarea>
            <v-btn block class="mt-3" @click="generate">
              Generate new wallet
            </v-btn>
            <v-btn block primary class="mt-3" @click="copyWifDialog = true">
              Import wallet
            </v-btn>
          </v-container>
          <v-container v-if="createStep === 2">
            <v-textarea
              ref="refWif"
              v-if="newAddress.length > 0"
              v-model="newWif"
              readonly
              append-outer-icon="mdi-comment"
              @click:append-outer="copyWifToClipboard"
              class="mx-2"
              label="WIF"
              rows="3"
            ></v-textarea>
          </v-container>

          <v-dialog v-model="copyWifDialog" max-width="290">
            <v-card>
              <v-card-title class="headline">Backup your WIF</v-card-title>

              <v-card-text>
                <span>
                  You only need your WIF to recover your wallet. Make sure you
                  always have a secure backup.
                </span>
                <v-spacer class="ma-3" />

                <v-textarea
                  ref="refWif"
                  v-if="newAddress.length > 0"
                  v-model="newWif"
                  readonly
                  class="mx-2"
                  label="WIF"
                  rows="3"
                ></v-textarea>
                <v-btn block small @click="copyWifToClipboard">Copy to clipboard <v-icon right>mdi-content-copy</v-icon></v-btn>
              </v-card-text>

              <v-card-actions class="mt-4">
                <v-btn color="gray darken-1" text @click="copyWifDialog=false">
                  No
                </v-btn>

                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="copyWifDialog=false; setPassDialog=true">
                  Yes, I did a backup
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-dialog v-model="setPassDialog" max-width="290">
            <v-card>
              <v-card-title class="headline">Set password</v-card-title>

              <v-card-text>
                <span>
                  Insert a password to secure your wallet. You can always use WIF to recover it.
                </span>
                <v-spacer />

                <v-form
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
                <v-btn color="gray darken-1" text @click="password='';setPassDialog=false">
                  Cancel
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="wif=newWif;importWallet()">
                  Import wallet
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-tab-item>
      </v-tabs>
    </v-main>

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
  Account,
  Transaction,
  getPrivateKeyFromWif,
  Balance,
  getAddressFromWif,
} from "@/phan-js";

import { state } from "@/popup/PopupState";
import ErrorDialogVue from "@/components/ErrorDialog.vue";

import WIF from "wif";

@Component({
  components: {
    ErrorDialog: ErrorDialogVue,
  },
})
export default class extends Vue {
  addressOrName = "";
  wif = "";
  password = "";
  showpass = false;
  isLoading = false;
  errorDialog = false;
  errorMessage = "";

  createStep = 0;
  newWif = "";
  newAddress = "";
  copyWifDialog = false;

  state = state;

  async importWallet() {
    console.log("Going to import wallet");
    if (this.wif.length == 52 && this.password.length >= 6) {
      try {
        this.isLoading = true;
        let account = await state.addAccountWithWif(this.wif, this.password);
        this.$router.push("/");
      } catch (err) {
        this.errorMessage = "Error importing WIF wallet";
        this.errorDialog = true;
      }
    } else {
      try {
        this.isLoading = true;
        let account = await state.addAccount(this.addressOrName);
        this.$router.push("/");
      } catch (err) {
        this.errorMessage = "Error importing wallet";
        this.errorDialog = true;
      }
    }
    this.createStep = 0;
    this.wif = "";
    this.password = "";
    this.newWif = "";
    this.newAddress = "";
    this.isLoading = false;
  }

  generate() {
    let buf = new Uint8Array(32);
    let pk = new Buffer(32);
    window.crypto.getRandomValues(buf);
    for (let i = 0; i < 32; ++i) {
      pk.writeUInt8(buf[i], i);
    }
    const wif = WIF.encode(128, pk, true);
    this.newWif = wif;
    this.newAddress = getAddressFromWif(wif);
    this.createStep = 1;
  }

  copyWifToClipboard() {
    navigator.clipboard.writeText(this.newWif);
  }
}
</script>

<style></style>
