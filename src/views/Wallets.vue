<template>
  <div>
    <v-app-bar app color="primary" dark style="font-size:16px">
      <v-icon>mdi-wallet</v-icon><v-spacer />

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>{{ $t("wallets.select") }}</v-list-item-title>
          <v-list-item-subtitle></v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-spacer />
    </v-app-bar>

    <v-main style="width:320px; max-height:500px">
      <v-list>
        <v-list-item
          v-for="acc in state.accounts"
          v-bind:key="acc.address"
          link
          @click="gotoAccount(acc)"
        >
          <v-list-item-avatar>
            <v-icon>mdi-wallet</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{
              getShorterAddress(acc.data)
            }}</v-list-item-title>
            <v-list-item-subtitle
              >{{ getShortAddress(acc.data) }}<br /><small>{{
                getTypeDesc(acc.type)
              }}</small></v-list-item-subtitle
            >
          </v-list-item-content>
          <v-list-item-action>
            <PopupMenu
              icon="mdi-dots-vertical"
              :actions="acc.type == 'encKey' ? popupActionsWif : popupActions"
              :item="acc"
            ></PopupMenu>
          </v-list-item-action>
        </v-list-item>
      </v-list>

      <div style="padding: 20px">
        <v-btn block @click="$router.push('/addwallet')">{{
          $t("wallets.add")
        }}</v-btn>
      </div>
    </v-main>

    <v-dialog v-model="requestPasswordDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{ "Enter password" }}</v-card-title>

        <v-card-text>
          <span>
            {{ "Enter your password to decrypt the private key" }}
          </span>
          <v-spacer class="ma-4" />

          <v-form @keyup.native.enter="exportPrivateKey" @submit.prevent>
            <v-text-field
              autofocus
              tabindex="1"
              type="password"
              :label="$t('home.labelPassword')"
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

          <v-btn
            color="gray darken-1"
            text
            @click="
              requestPasswordDialog = false;
              password = '';
            "
          >
            {{ $t("home.cancel") }}
          </v-btn>

          <v-btn color="blue darken-1" text @click="exportPrivateKey">
            {{ $t("home.continue") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showPrivateKeyDialog" max-width="290">
      <v-card>
        <v-card-title class="headline">{{ "Private key" }}</v-card-title>

        <v-card-text>
          <span>
            {{
              "The private key is the only thing required to allow access to your funds. Keep it safe."
            }}
          </span>
          <v-spacer class="ma-4" />

          <v-textarea
            v-model="wif"
            readonly
            label="Private key (WIF format)"
            rows="3"
          ></v-textarea>
          <v-textarea
            v-model="hexPk"
            readonly
            label="Private key (Hex format)"
            rows="3"
          ></v-textarea>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            color="blue darken-1"
            text
            @click="
              wif = '';
              hexPk = '';
              showPrivateKeyDialog = false;
            "
          >
            {{ $t("home.continue") }}
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
import { Account, getPrivateKeyFromWif } from "@/phan-js";
import ErrorDialog from "@/components/ErrorDialog.vue";

import { state, WalletAccount } from "@/popup/PopupState";
import PopupMenuComponent from "@/components/PopupMenu.vue";

@Component({
  components: {
    PopupMenu: PopupMenuComponent,
    ErrorDialog,
  },
})
export default class extends Vue {
  state = state;

  popupActions: any[] = [];
  popupActionsWif: any[] = [];
  desc: any = {};

  password = "";

  wif = "";
  hexPk = "";

  reqAccount: WalletAccount | null = null;

  requestPasswordDialog = false;
  showPrivateKeyDialog = false;

  errorDialog = false;
  errorMessage = "";

  async mounted() {
    await this.state.check(this.$parent.$i18n);
    this.onChangeLanguage();
    this.$root.$on("changeLanguage", this.onChangeLanguage);
  }

  beforeDestroy() {
    this.$root.$off("changeLanguage", this.onChangeLanguage);
  }

  onChangeLanguage() {
    console.log("onChangeLanguage");
    this.popupActions = [
      // { icon: 'mdi-pen', title: "Add password", subtitle: "Store WIF with password", action: this.addPassword },
      // { divider: true },
      {
        icon: "mdi-delete",
        title: this.$i18n.t("wallets.title").toString(),
        subtitle: this.$i18n.t("wallets.subtitle").toString(),
        action: this.deleteAccount,
      },
    ];
    this.popupActionsWif = [
      {
        icon: "mdi-home-export-outline",
        title: "Export private key",
        subtitle: "WIF and Hex format",
        action: this.askPasswordToExport,
      },
      { divider: true },
      {
        icon: "mdi-delete",
        title: this.$i18n.t("wallets.title").toString(),
        subtitle: this.$i18n.t("wallets.subtitle").toString(),
        action: this.deleteAccount,
      },
    ];
  }

  getShorterAddress(account: Account): string {
    if (!account) return "account error";
    if (account.name && account.name != "") return account.name;

    let addr = account.address;
    if (!addr || addr.length < 8) return "account error";

    return (
      addr.substring(0, 6) +
      "..." +
      addr.substring(addr.length - 4, addr.length)
    );
  }

  getShortAddress(account: Account): string {
    if (!account) return "account error";
    let addr = account.address;
    if (!addr || addr.length < 8) return "account error";
    return (
      addr.substring(0, 8) +
      "..." +
      addr.substring(addr.length - 6, addr.length)
    );
  }

  getTypeDesc(type: string): string {
    if (type == "encKey") return this.$i18n.t("wallets.encKey").toString();
    else if (type == "unverified")
      return this.$i18n.t("wallets.unverified").toString();
    else if (type == "verified")
      return this.$i18n.t("wallets.verified").toString();
    return "";
  }

  askPasswordToExport(account: WalletAccount) {
    this.reqAccount = account;
    this.requestPasswordDialog = true;
  }

  exportPrivateKey() {
    console.log("export private key", this.reqAccount, this.password);
    if (!this.reqAccount) return;

    try {
      this.requestPasswordDialog = false;
      this.wif = state.getWifFromPassword(this.password, this.reqAccount);
      this.hexPk = getPrivateKeyFromWif(this.wif);
      this.showPrivateKeyDialog = true;
    } catch (err) {
      this.errorMessage = err;
      this.errorDialog = true;
    }
    this.password = "";
  }

  async gotoAccount(account: WalletAccount) {
    await state.selectAccount(account);
    this.$router.push("/");
  }

  async deleteAccount(account: WalletAccount) {
    await state.deleteAccount(account);
  }
}
</script>

<style>
.v-expansion-panel-content__wrap {
  padding: 0;
}
</style>
