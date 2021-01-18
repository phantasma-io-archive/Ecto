<template>
  <div>
    <v-app-bar key="appbar" app color="primary" dark style="font-size:16px">
      <v-icon>mdi-wallet-plus</v-icon><v-spacer />

      <v-list-item link @click="goto('/wallets')">
        <v-list-item-content>
          <v-list-item-title>{{ $t('addWallet.add') }}</v-list-item-title>
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

    <v-main style="width:320px; max-height:540px">
      <v-overlay :value="isLoading">
        <v-progress-circular indeterminate size="64"></v-progress-circular>
      </v-overlay>

      <v-tabs v-model="tabIndex" background-color="white" color="#17b1e8" right>
        <v-tab>{{ $t('addWallet.import') }}</v-tab>
        <v-tab>{{ $t('addWallet.create') }}</v-tab>

        <v-tab-item key="1">
          <v-container
            class="overflow-y-auto overflow-x-hidden pa-0"
            style="max-height:500px"
          >
            <div style="padding: 15px">
              {{ $t('addWallet.description1') }}
            </div>

            <v-form
              @keyup.native.enter="importWallet"
              style="margin: 0px 28px 10px 15px"
            >
              <v-text-field
                tabindex="1"
                :label="$t('addWallet.labelAddress')"
                v-model="addressOrName"
                required
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                prepend-icon="mdi-account"
              />

              <span style="padding:120px">{{ $t('addWallet.or') }}</span>

              <v-text-field
                tabindex="2"
                type="password"
                :label="$t('addWallet.labelWIF')"
                v-model="wif"
                required
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                prepend-icon="mdi-key"
                counter
              />

              <v-text-field
                tabindex="3"
                :label="$t('addWallet.labelPassword')"
                v-model="password"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                :hint="$t('addWallet.hintPassword')"
                prepend-icon="mdi-lock"
                :type="showpass ? 'text' : 'password'"
                :append-icon="showpass ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showpass = !showpass"
              />
            </v-form>
            <div style="padding: 10px 20px">
              <v-btn
                block
                @click="importWallet"
                :disabled="
                  addressOrName.length == 0 &&
                    (!(wif.length == 52 || wif.length == 64) ||
                      password.length < 6)
                "
                >{{ $t('addWallet.importLong') }}</v-btn
              >
            </div>
            <div class="ma-3 mb-6">
              {{ $t('addWallet.description2') }}
              <a href="" @click.prevent="tabIndex = 1">
                {{ $t('addWallet.description3') }}
              </a>
            </div>
          </v-container>
        </v-tab-item>

        <v-tab-item key="2">
          <v-container v-if="createStep === 0">
            <div v-html="i18n.descriptionLong" style="padding: 80px 20px">
            </div>
            <v-btn block @click="generate">
              {{ $t('addWallet.generate') }}
            </v-btn>
          </v-container>
          <v-container v-if="createStep === 1">
            <div class="mb-5" style="padding: 20px 8px">
              {{ $t('addWallet.created') }}
            </div>
            <v-textarea
              v-model="newAddress"
              readonly
              class="mx-2"
              :label="$t('addWallet.labelAddressShort')"
              rows="2"
            ></v-textarea>
            <v-textarea
              v-model="newWif"
              readonly
              class="mx-2"
              label="WIF"
              rows="2"
            ></v-textarea>
            <v-btn block primary class="mt-3" @click="copyWifDialog = true">
              {{ $t('addWallet.importLong') }}
            </v-btn>
            <div class="ma-3 mt-6">
              {{ $t('addWallet.description4') }}
              <a href="" @click.prevent="generate">
                {{ $t('addWallet.description5') }}
              </a>
            </div>
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
              <v-card-title class="headline">{{ $t('addWallet.backup') }}</v-card-title>

              <v-card-text>
                <span v-html="i18n.recover"></span>
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
                <v-btn block small @click="copyWifToClipboard"
                  >{{ $t('addWallet.copy') }}
                  <v-icon right>mdi-content-copy</v-icon></v-btn
                >
              </v-card-text>

              <v-card-actions class="mt-4">
                <v-btn
                  color="gray darken-1"
                  text
                  @click="copyWifDialog = false"
                >
                  {{ $t('addWallet.no') }}
                </v-btn>

                <v-spacer></v-spacer>
                <v-btn
                  color="blue darken-1"
                  text
                  @click="
                    copyWifDialog = false;
                    setPassDialog = true;
                  "
                >
                  {{ $t('addWallet.backupConfirm') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-dialog v-model="setPassDialog" max-width="290">
            <v-card>
              <v-card-title class="headline">{{ $t('addWallet.setPassword') }}</v-card-title>

              <v-card-text>
                <span>
                  {{ $t('addWallet.secure') }}
                </span>
                <v-spacer />

                <v-form @keyup.native.enter="doSignTx" @submit.prevent>
                  <v-text-field
                    tabindex="1"
                    type="password"
                    :label="$t('addWallet.labelPassword')"
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
                <v-btn
                  color="gray darken-1"
                  text
                  @click="
                    password = '';
                    setPassDialog = false;
                  "
                >
                  {{ $t('addWallet.cancel') }}
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  color="blue darken-1"
                  text
                  @click="
                    wif = newWif;
                    importWallet();
                  "
                >
                  {{ $t('addWallet.importLong') }}
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
  setPassDialog = false;
  showpass = false;
  isLoading = false;
  errorDialog = false;
  errorMessage = "";

  tabIndex = 0;

  createStep = 0;
  newWif = "";
  newAddress = "";
  copyWifDialog = false;

  state = state;

  errorMessage1 = "";
  errorMessage2 = "";
  errorMessage3 = "";

  get i18n() {
    return {
      descriptionLong: this.$t('addWallet.descriptionLong'),
      recover: this.$t('addWallet.recover')
    };
  }

  async importWallet() {
    console.log("Going to import wallet");
    this.errorMessage1 = this.$i18n.t('addWallet.errorMessage1').toString();
    this.errorMessage2 = this.$i18n.t('addWallet.errorMessage2').toString();
    this.errorMessage3 = this.$i18n.t('addWallet.errorMessage3').toString();
    if (this.wif.length == 52 && this.password.length >= 6) {
      try {
        this.isLoading = true;
        let account = await state.addAccountWithWif(this.wif, this.password);
        this.$router.push("/");
      } catch (err) {
        this.errorMessage = this.errorMessage1;
        this.errorDialog = true;
      }
    } else if (this.wif.length == 64 && this.password.length >= 6) {
      try {
        this.isLoading = true;
        let account = await state.addAccountWithHex(this.wif, this.password);
        this.$router.push("/");
      } catch (err) {
        this.errorMessage = this.errorMessage2;
        this.errorDialog = true;
      }
    } else {
      try {
        this.isLoading = true;
        let account = await state.addAccount(this.addressOrName);
        this.$router.push("/");
      } catch (err) {
        this.errorMessage = this.errorMessage3;
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
