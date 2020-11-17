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
              Import a wallet with its address or name (read only), or its WIF.
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
          <div style="padding: 80px 20px">
            Wallet creation is not implemented yet. Use Poltergeist or Phantom
            Wallet.
          </div>
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
import { Account, Transaction, getPrivateKeyFromWif, Balance } from "@/phan-js";

import { state } from "@/popup/PopupState";
import ErrorDialogVue from "@/components/ErrorDialog.vue";

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
    this.isLoading = false;
  }
}
</script>

<style></style>
