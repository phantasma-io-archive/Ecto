import WIF from "wif";
import fetch from "cross-fetch";
import * as CryptoJS from "crypto-js";
import createHash from "create-hash";
import * as Secp256k1 from "@enumatech/secp256k1-js";

import {
  PhantasmaAPI,
  Account,
  Transaction,
  getPrivateKeyFromWif,
  getAddressFromWif,
  Paginated,
  AccountTransactions,
  Balance,
  signData,
  Swap,
  Token,
} from "@/phan-js";

import { getNeoAddressFromWif, getNeoBalances } from "@/neo";
import {
  getChecksumAddress,
  getEthAddressFromWif,
  getEthBalances,
  getEthContract,
} from "@/ethereum";
import { getBscAddressFromWif, getBscBalances, getBscContract } from "@/bsc";
import base58 from "bs58";
import { byteArrayToHex } from "@/phan-js/utils";

export interface ISymbolAmount {
  symbol: string;
  amount: string | number | BigInt;
}

export interface IPendingSwap {
  chainTo: string;
  addressTo: string;
  hash: string;
  swap: Swap | null;
  date: number;
}

interface IAuthorization {
  dapp: string;
  hostname: string;
  token: string;
  address: string;
  expireDate: number;
  version: string;
}

export interface WalletAccount {
  address: string;
  ethAddress?: string;
  neoAddress?: string;
  bscAddress?: string;
  type: string;
  data: Account;
  wif?: string;
  encKey?: string;
}

export interface TxArgsData {
  nexus: string;
  chain: string;
  script: string;
  payload: string;
}

export interface NexusData<T> {
  mainnet: T | undefined;
  testnet: T | undefined;
  simnet: T | undefined;
  mainnetLastUpdate: number;
  testnetLastUpdate: number;
  simnetLastUpdate: number;
}

export class PopupState {
  api = new PhantasmaAPI(
    "https://seed.ghostdevs.com:7077/rpc",
    "https://ghostdevs.com/getpeers.json"
  );

  private _currentAccountIndex = 0;
  private _accounts: WalletAccount[] = [];
  private _authorizations: IAuthorization[] = [];
  private _pendingSwaps: IPendingSwap[] = [];
  private _currency: string = "USD";
  private _language: string = "English";
  private _balanceShown: boolean = true;
  private _currenciesRate: any;
  private _nexus: string = "MainNet";
  private _simnetRpc = "http://localhost:7077/rpc";
  private _testnetRpc = "http://testnet.phantasma.io:7077/rpc";
  private _mainnetRpc = "Auto";
  private _tokens: NexusData<Token[]> = {
    mainnet: [],
    testnet: [],
    simnet: [],
    mainnetLastUpdate: 0,
    testnetLastUpdate: 0,
    simnetLastUpdate: 0,
  };

  accountNfts: any[] = [];
  nfts: any = {};

  ethBalances: ISymbolAmount[] = [];
  neoBalances: ISymbolAmount[] = [];
  bscBalances: ISymbolAmount[] = [];

  allSwaps: Swap[] = [];

  payload = "4543542d312e332e35";

  $i18n: any = {
    t: (s: string) => s,
  };

  constructor() { }

  get accounts() {
    return this._accounts;
  }

  get currentAccount() {
    return this._currentAccountIndex < this._accounts.length
      ? this._accounts[this._currentAccountIndex]
      : null;
  }

  get hasAccount() {
    return this._accounts.length != 0;
  }

  get currency() {
    return this._currency;
  }

  get balanceShown() {
    return this._balanceShown;
  }

  get language() {
    return this._language;
  }

  get locale() {
    return this.getLocaleFromLanguage(this._language);
  }

  get nexus() {
    return this._nexus.toLowerCase();
  }

  get simnetRpc() {
    return this._simnetRpc;
  }

  get testnetRpc() {
    return this._testnetRpc;
  }

  get mainnetRpc() {
    return this._mainnetRpc;
  }

  getLocaleFromLanguage(language: string) {
    if (language) {
      switch (language) {
        default:
        case "English":
          return "en";
        case "Français":
          return "fr";
        case "Italiano":
          return "it";
        case "Spanish":
          return "es";
        case "Русский":
          return "ru";
        case "中文":
          return "cn";
        case "Nederlands":
          return "nl";
        case "Deutsch":
          return "de";
        case "Türkçe":
          return "tr";
        case "Tiếng Việt":
          return "vn";
        case "Norwegian":
          return "nb";
        case "Português":
          return "pt";
      }
    }
    return "en";
  }

  async setNexus(value: string): Promise<void> {
    this._nexus = value;
    this.api.setNexus(value);
    if (this._nexus == "MainNet") this.api.setRpcByName(this._mainnetRpc);
    if (this._nexus == "SimNet") this.api.setRpcHost(this._simnetRpc);
    if (this._nexus == "TestNet") this.api.setRpcHost(this._testnetRpc);

    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          nexus: this._nexus,
        },
        () => resolve()
      );
    });
  }

  async setSimnetRpc(value: string): Promise<void> {
    this._simnetRpc = value;
    if (this._nexus == "SimNet") this.api.setRpcHost(this._simnetRpc);
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          simnetRpc: this._simnetRpc,
        },
        () => resolve()
      );
    });
  }

  async setTestnetRpc(value: string): Promise<void> {
    this._testnetRpc = value;
    if (this._nexus == "TestNet") this.api.setRpcHost(this._testnetRpc);
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          testnetRpc: this._testnetRpc,
        },
        () => resolve()
      );
    });
  }

  async setMainnetRpc(value: string): Promise<void> {
    console.log("Saving to storage mainnet rpc", this._mainnetRpc);
    this._mainnetRpc = value;
    this.api.setRpcByName(this._mainnetRpc);
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          mainnetRpc: this._mainnetRpc,
        },
        () => resolve()
      );
    });
  }

  get nexusName() {
    return this._nexus;
  }

  get isMainnet() {
    return this.nexus == "mainnet";
  }

  get mainnetRpcList() {
    return this.api.availableHosts;
  }

  get pendingSwaps() {
    return this._pendingSwaps;
  }

  get claimablePendingSwaps() {
    return this._pendingSwaps.filter((ps) => ps.swap != null);
  }

  get currencySymbol() {
    switch (this._currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "JPY":
        return "¥";
      case "CAD":
        return "C$";
      case "AUD":
        return "A$";
      case "CNY":
        return "¥";
      case "RUB":
        return "₽";
      default:
        return "?";
    }
  }

  getRate(symbol: string): number {
    var curSym = this._currency.toLowerCase();
    try {
      switch (symbol.toLowerCase()) {
        case "soul":
          return this._currenciesRate["phantasma"][curSym];
        case "kcal":
          return this._currenciesRate["phantasma-energy"][curSym];
        case "neo":
          return this._currenciesRate["neo"][curSym];
        case "gas":
          return this._currenciesRate["gas"][curSym];
        case "usdt":
          return this._currenciesRate["tether"][curSym];
        case "dai":
          return this._currenciesRate["dai"][curSym];
        case "eth":
          return this._currenciesRate["ethereum"][curSym];
        case "dyt":
          return this._currenciesRate["dynamite"][curSym];
        case "dank":
          return this._currenciesRate["mu-dank"][curSym];
        case "goati":
          return 0.1;
        case "usdc":
          return this._currenciesRate["usd-coin"][curSym];
        case "bnb":
          return this._currenciesRate["binancecoin"][curSym];
        case "busd":
          return this._currenciesRate["binance-usd"][curSym];
      }
    } catch {
      console.log("Error getting rates for " + symbol + " in " + curSym);
    }
    return -1;
  }

  async check($i18n: any): Promise<void> {
    if ($i18n) this.$i18n = $i18n; // save translate method from Vue i18n
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(async (items) => {
        console.log("[PopupState] Get local storage");
        this._currentAccountIndex = items.currentAccountIndex
          ? items.currentAccountIndex
          : 0;
        this._accounts = items.accounts
          ? items.accounts.filter((a: WalletAccount) => a.type !== "wif")
          : [];
        this._authorizations = items.authorizations ? items.authorizations : [];
        // this._pendingSwaps = items.pendingSwaps ? items.pendingSwaps : [];
        this._currency = items.currency ? items.currency : "USD";
        this._language = items.language ? items.language : "English";
        this._balanceShown =
          items.balanceShown === undefined || items.balanceShown;
        this.nfts = items.nfts ? items.nfts : {};

        if ($i18n) $i18n.locale = this.locale;

        this._accounts = items.accounts
          ? items.accounts.filter((a: WalletAccount) => a.type !== "wif")
          : [];

        if (items.tokens) this._tokens = items.tokens;

        console.log("Current tokens", JSON.stringify(this._tokens, null, 2));

        const numAccounts = items.accounts ? items.accounts.length : 0;

        if (items.simnetRpc) this._simnetRpc = items.simnetRpc;
        if (items.testnetRpc) this._testnetRpc = items.testnetRpc;
        if (items.mainnetRpc) this._mainnetRpc = items.mainnetRpc;
        if (items.nexus) this._nexus = items.nexus;

        this.api.setRpcByName(this._mainnetRpc);
        this.api.setNexus(this._nexus);
        if (this._nexus == "SimNet") this.api.setRpcHost(this._simnetRpc);
        if (this._nexus == "TestNet") this.api.setRpcHost(this._testnetRpc);

        try {
          // query tokens info if needed for current nexus
          const now = new Date().valueOf();
          const nexus = this.nexus;
          var lastUpdate = (this._tokens as any)[nexus + "LastUpdate"];
          const secsSinceLastUpdate = (now - lastUpdate) / 1000;
          console.log("Last update was ", secsSinceLastUpdate, "secs ago");
          if (secsSinceLastUpdate > 60 * 60 * 2) {
            let tokens = await this.api.getTokens();
            // remove script, we don't need it
            tokens.forEach((t: any) => {
              if (t.script != undefined) delete t.script;
            });
            console.log("tokens for", nexus, tokens);
            (this._tokens as any)[nexus] = tokens;
            (this._tokens as any)[nexus + "LastUpdate"] = now;
            chrome.storage.local.set({ tokens: this._tokens });
          }
        } catch (err) {
          console.error("Could not get tokens", err);
        }

        if (this._accounts.length !== numAccounts)
          chrome.storage.local.set({ accounts: this._accounts });

        resolve();
      });
    });
  }

  async checkTxError(tx: string): Promise<string | null> {
    const txdata = await this.api.getTransaction(tx);
    console.log("checkTx", txdata);
    if (!txdata) return null;
    return (txdata as any).error;
  }

  clearAll() {
    chrome.storage.local.clear();

    this._currentAccountIndex = 0;
    this._accounts = [];
    this._authorizations = [];
  }

  async setCurrency(currency: string): Promise<void> {
    this._currency = currency;
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          currency: this._currency,
        },
        () => resolve()
      );
    });
  }

  async setLanguage(language: string): Promise<void> {
    this._language = language;

    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          language: this._language,
        },
        () => resolve()
      );
    });
  }

  async toggleBalance(balanceShown: boolean): Promise<void> {
    this._balanceShown = balanceShown;
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          balanceShown: this._balanceShown,
        },
        () => resolve()
      );
    });
  }

  async fetchRates() {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=phantasma%2Cphantasma-energy%2Cneo%2Cgas%2Ctether%2Cethereum%2Cdai%2Cdynamite%2Cmu-dank%2Cusd-coin%2Cdai%2Ctether%2Cbinancecoin%2Cbinance-usd&vs_currencies=usd%2Ceur%2Cgbp%2Cjpy%2Ccad%2Caud%2Ccny%2Crub"
    );
    const resJson = await res.json();
    this._currenciesRate = resJson;
  }

  async getAccountData(address: string): Promise<Account> {
    const data = await this.api.getAccount(address);

    if (!data.balances) {
      data.balances = [];
    }

    if (!data.balances.find((b) => b.symbol == "SOUL"))
      data.balances.unshift({
        chain: "main",
        symbol: "SOUL",
        amount: "0",
        decimals: 8,
      });

    console.log("Account data", data);

    return data;
  }

  async addAccount(addressOrName: string): Promise<void> {
    let address = addressOrName;

    if (
      !(address.startsWith("P") || address.startsWith("S")) ||
      address.length != 47
    ) {
      address = await this.api.lookUpName(address);
      if ((address as any).error) throw new Error("Wallet name not found");
    }

    const accountData = await this.getAccountData(address);
    const matchAccount = this.accounts.filter(
      (a) => a.address == accountData.address
    );
    const alreadyExisting = matchAccount.length > 0 ? true : false;
    let len = 0;
    if (!alreadyExisting) {
      len = this._accounts.push({
        address: accountData.address,
        type: "unverified",
        data: accountData,
      });
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        { currentAccountIndex: len - 1, accounts: this._accounts },
        () => resolve()
      );
    });
  }

  isWifValidForAccount(
    wif: string,
    account: WalletAccount | undefined = undefined
  ): boolean {
    try {
      return (
        (account && account.address && account.address.startsWith("S")) ||
        (account !== undefined
          ? account.address
          : this.currentAccount?.address) === getAddressFromWif(wif)
      );
    } catch {
      return false;
    }
  }

  async addAccountWithWif(wif: string, password: string): Promise<void> {
    let address = getAddressFromWif(wif);
    let ethAddress = getEthAddressFromWif(wif);
    let neoAddress = getNeoAddressFromWif(wif);
    let bscAddress = getBscAddressFromWif(wif);
    const accountData = await this.getAccountData(address);
    const hasPass = password != null && password != "";
    const matchAccount = this.accounts.filter(
      (a) => a.address == accountData.address
    );
    const alreadyExisting = matchAccount.length > 0 ? true : false;

    if (hasPass && !alreadyExisting) {
      const encKey = CryptoJS.AES.encrypt(wif, password).toString();
      this._accounts.push({
        address: accountData.address,
        ethAddress,
        neoAddress,
        bscAddress,
        type: "encKey",
        encKey,
        data: accountData,
      });
    } else if (!alreadyExisting) {
      this._accounts.push({
        address: accountData.address,
        ethAddress,
        neoAddress,
        bscAddress,
        type: "wif",
        wif,
        data: accountData,
      });
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          currentAccountIndex: this._accounts.length - 1,
          accounts: this._accounts,
        },
        () => resolve()
      );
    });
  }

  async addAccountWithHex(hex: string, password: string): Promise<void> {
    let pk = Buffer.from(hex, "hex");
    const wif = WIF.encode(128, pk, true);
    let address = getAddressFromWif(wif);
    let ethAddress = getEthAddressFromWif(wif);
    let neoAddress = getNeoAddressFromWif(wif);
    let bscAddress = getBscAddressFromWif(wif);
    const accountData = await this.getAccountData(address);
    const matchAccount = this.accounts.filter(
      (a) => a.address == accountData.address
    );
    const alreadyExisting = matchAccount.length > 0 ? true : false;

    const hasPass = password != null && password != "";
    if (hasPass && !alreadyExisting) {
      const encKey = CryptoJS.AES.encrypt(wif, password).toString();
      this._accounts.push({
        address: accountData.address,
        ethAddress,
        neoAddress,
        bscAddress,
        type: "encKey",
        encKey,
        data: accountData,
      });
    } else if (!alreadyExisting) {
      this._accounts.push({
        address: accountData.address,
        ethAddress,
        neoAddress,
        bscAddress,
        type: "wif",
        wif,
        data: accountData,
      });
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          currentAccountIndex: this._accounts.length - 1,
          accounts: this._accounts,
        },
        () => resolve()
      );
    });
  }

  async selectAccount(account: WalletAccount): Promise<void> {
    const idx = this.accounts.findIndex((a) => a.address == account.address);

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ currentAccountIndex: idx }, () => resolve());
    });
  }

  async deleteAccount(account: WalletAccount): Promise<void> {
    const currentAccount = this.currentAccount;
    this._accounts = this.accounts.filter((a) => a.address != account.address);
    let idx = this.accounts.findIndex(
      (a) => a.address == currentAccount?.address
    );
    if (idx == -1) idx = 0;

    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        { currentAccountIndex: idx, accounts: this._accounts },
        () => resolve()
      );
    });
  }

  async refreshCurrentAccount(): Promise<void> {
    const account = this.currentAccount;
    if (!account) return;

    console.log(
      "Refreshing account " + account.address + " on " + this.api.host
    );

    this._accounts[this._currentAccountIndex].data = await this.getAccountData(
      account.address
    );

    // fix non-checksum ethereum addresses
    if (
      account.ethAddress &&
      account.ethAddress.toLocaleLowerCase() == account.ethAddress
    ) {
      account.ethAddress = getChecksumAddress(account.ethAddress);
    }

    // copy ETH address to BSC
    if (account.ethAddress && !account.bscAddress) {
      account.bscAddress = account.ethAddress;
    }

    const allNfts = this.getAllTokens().filter(
      (t) => t.flags && !t.flags.includes("Fungible")
    );

    // fetch all nfts data available
    for (var i = 0; i < allNfts.length; ++i) {
      try {
        const symbol = allNfts[i].symbol;
        await this.fetchNftData(
          this._accounts[this._currentAccountIndex].data.balances.find(
            (b) => b.symbol == symbol
          )!
        );
      } catch (err) {
        console.error("Error fetching NFTs", err);
      }
    }

    await this.refreshSwapInfo();

    console.log(
      "Refreshed account " +
      JSON.stringify(this._accounts[this._currentAccountIndex])
    );

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ accounts: this._accounts }, () => resolve());
    });
  }

  async refreshSwapInfo() {
    const neoAddress = this.currentAccount!.neoAddress;
    const ethAddress = this.currentAccount!.ethAddress;
    const bscAddress = this.currentAccount!.bscAddress;
    const isMainnet = this.isMainnet;

    this.allSwaps = [];
    if (neoAddress) {
      try {
        this.neoBalances = await getNeoBalances(neoAddress, isMainnet);
        console.log("neoBals", this.neoBalances);
        let neoSwaps = await this.api.getSwapsForAddress(neoAddress, 'neo');
        console.log("neoSwaps", neoSwaps);
        neoSwaps = neoSwaps.filter((s) => s.destinationHash === "pending");
        console.log("neoSwaps", neoSwaps);
        if (!(neoSwaps as any).error) this.allSwaps = neoSwaps;
      } catch (err) {
        console.log("error in neo balances and swaps", err);
      }
    }

    if (ethAddress) {
      try {
        this.ethBalances = await getEthBalances(ethAddress, isMainnet);
        console.log("ethBals", this.ethBalances);
        let ethSwaps = await this.api.getSwapsForAddress(ethAddress, 'ethereum');
        console.log("ethSwaps", ethSwaps);
        ethSwaps = ethSwaps.filter(
          (s) =>
            s.destinationHash === "pending" &&
            (s.sourcePlatform === "ethereum" ||
              s.destinationPlatform === "ethereum")
        );
        console.log("ethSwaps", ethSwaps);
        if (!(ethSwaps as any).error)
          this.allSwaps = this.allSwaps.concat(ethSwaps);
      } catch (err) {
        console.log("error in eth balances and swaps, trying old method...", err);
      }
    }

    if (bscAddress) {
      try {
        this.bscBalances = await getBscBalances(bscAddress, isMainnet);
        console.log("bscBals", this.bscBalances);
        let bscSwaps = await this.api.getSwapsForAddress(bscAddress, 'bsc');
        console.log("bscSwaps", bscSwaps);
        bscSwaps = bscSwaps.filter(
          (s) =>
            s.destinationHash === "pending" &&
            (s.sourcePlatform === "bsc" || s.destinationPlatform === "bsc")
        );
        console.log("bscSwaps", bscSwaps);
        if (!(bscSwaps as any).error)
          this.allSwaps = this.allSwaps.concat(bscSwaps);
      } catch (err) {
        console.log("error in bsc balances and swaps, trying old method...", err);
      }
    }

    try {
      let phaSwaps = await this.api.getSwapsForAddress(this.currentAccount!.address, 'phantasma');
      console.log("phaSwaps", phaSwaps);
      phaSwaps = phaSwaps.filter(
        (s) =>
          s.destinationHash === "pending" &&
          this.allSwaps.findIndex(
            (p) => p.sourceHash == s.sourceHash && p.symbol == s.symbol
          ) < 0
      );
      console.log("allSwaps", this.allSwaps);
    } catch (err) {
      console.log("error in getting pending pha swaps, trying old method...", err);
    }

    // check external pending swaps, if there are
    /* const curTime = new Date().getTime();
    const toRemove: IPendingSwap[] = [];
    this._pendingSwaps.forEach(async (ps) => {
      let swaps = await this.api.getSwapsForAddress(ps.addressTo);
      var swap = swaps.find((s) => s.sourceHash == ps.hash);
      if (swap && swap.destinationHash === "pending") {
        ps.swap = swap;
      } else if (curTime - ps.date > 10000) {
        // only remove if 10 seconds elapsed
        toRemove.push(ps);
      }
    });

    // remove the ones already processed
    if (toRemove.length > 0) {
      this._pendingSwaps.filter((p) => !toRemove.includes(p));
      chrome.storage.local.set({ pendingSwaps: this._pendingSwaps }, () => {});
    } */
  }

  async authorizeDapp(
    dapp: string,
    hostname: string,
    token: string,
    expireDate: Date,
    version: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const account = this.currentAccount;
      if (!account) {
        reject();
        return;
      }

      const address = account.address;
      this._authorizations.push({
        dapp,
        hostname,
        token,
        address,
        expireDate: expireDate.getTime(),
        version
      });

      chrome.storage.local.set({ authorizations: this._authorizations }, () =>
        resolve()
      );
    });
  }

  getDapp(token: string): string {
    return this._authorizations.find((a) => a.token == token)!.dapp;
  }

  async addPendingSwap(chainTo: string, addressTo: string, hash: string) {
    await this.check(this.$i18n); // make sure we don't overwrite any other pending swap
    this._pendingSwaps.push({
      chainTo,
      addressTo,
      hash,
      swap: null,
      date: new Date().getTime(),
    });
    console.log("pending swaps", JSON.stringify(this._pendingSwaps, null, 2));
    chrome.storage.local.set({ pendingSwaps: this._pendingSwaps }, () => { });
  }

  addSwapAddressWithPassword(password: string) {
    const account = this.currentAccount;
    if (!account) throw new Error(this.$i18n.t("error.noAccount").toString());

    let wif = "";
    if (password == "") {
      if (account.wif) wif = account.wif;
    } else {
      if (!account.encKey)
        throw new Error(this.$i18n.t("error.noEncrypted").toString());

      const hex = CryptoJS.AES.decrypt(account.encKey, password).toString();
      for (var i = 0; i < hex.length && hex.substr(i, 2) !== "00"; i += 2)
        wif += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }

    if (!this.isWifValidForAccount(wif))
      throw new Error(this.$i18n.t("error.noPasswordMatch").toString());

    this.addSwapAddress(wif);
  }

  addSwapAddress(wif: string) {
    const ethAddress = getEthAddressFromWif(wif);
    const neoAddress = getNeoAddressFromWif(wif);
    const bscAddress = getBscAddressFromWif(wif);

    this._accounts[this._currentAccountIndex].ethAddress = ethAddress;
    this._accounts[this._currentAccountIndex].neoAddress = neoAddress;
    this._accounts[this._currentAccountIndex].bscAddress = bscAddress;

    chrome.storage.local.set({ accounts: this._accounts });
  }

  async signTxWithPassword(
    txdata: TxArgsData,
    address: string,
    password: string
  ) {
    const account = this.accounts.find((a) => a.address == address);
    if (!account) throw new Error(this.$i18n.t("error.noAccount").toString());

    let wif = "";
    if (password == "") {
      if (account.wif) wif = account.wif;
    } else {
      if (!account.encKey)
        throw new Error(this.$i18n.t("error.noEncrypted").toString());

      const hex = CryptoJS.AES.decrypt(account.encKey, password).toString();
      for (var i = 0; i < hex.length && hex.substr(i, 2) !== "00"; i += 2)
        wif += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }

    if (!this.isWifValidForAccount(wif))
      throw new Error(this.$i18n.t("error.noPasswordMatch").toString());

    return await this.signTx(txdata, wif);
  }

  async signTx(txdata: TxArgsData, wif: string): Promise<string> {
    const account = this.currentAccount;
    if (!account) throw new Error(this.$i18n.t("error.notValid").toString());

    if (!this.isWifValidForAccount(wif))
      throw new Error(this.$i18n.t("error.noAccountMatch").toString());

    const address = account.address;

    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 5);
    console.log(dt);
    const tx = new Transaction(
      txdata.nexus && txdata.nexus != '' ?  txdata.nexus : this.nexus,
      txdata.chain,
      txdata.script,
      dt,
      txdata.payload
    );

    const privateKey = getPrivateKeyFromWif(wif);

    tx.sign(privateKey);

    const hash = await this.api.sendRawTransaction(tx.toString(true));
    console.log("Returned from sendRawTransaction with res: ", hash);

    return hash;
  }

  signDataWithPassword(
    data: string,
    address: string,
    password: string
  ): string {
    const account = this.accounts.find((a) => a.address == address);
    if (!account) throw new Error(this.$i18n.t("error.noAccount").toString());

    let wif = "";
    if (password == "") {
      if (account.wif) wif = account.wif;
    } else {
      if (!account.encKey)
        throw new Error(this.$i18n.t("error.noEncrypted").toString());

      const hex = CryptoJS.AES.decrypt(account.encKey, password).toString();
      for (var i = 0; i < hex.length && hex.substr(i, 2) !== "00"; i += 2)
        wif += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }

    if (!this.isWifValidForAccount(wif))
      throw new Error(this.$i18n.t("error.noPasswordMatch").toString());

    return this.signData(data, wif);
  }

  signData(data: string, wif: string): string {
    const account = this.currentAccount;
    if (!account) throw new Error(this.$i18n.t("error.notValid").toString());

    if (!this.isWifValidForAccount(wif))
      throw new Error(this.$i18n.t("error.noAccountMatch").toString());

    const privateKey = getPrivateKeyFromWif(wif);

    return signData(data, privateKey);
  }

  async signTxEth(
    txdata: TxArgsData,
    wif: string,
    alsoSignWithPha: boolean = false
  ): Promise<string> {
    const account = this.currentAccount;
    if (!account) throw new Error("Account not valid");

    const address = account.address;

    const pkHex = getPrivateKeyFromWif(wif);

    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 5);
    console.log(dt);
    const tx = new Transaction(
      txdata.nexus,
      txdata.chain,
      txdata.script,
      dt,
      txdata.payload
    );

    // Do custom signature
    const msgHex = tx.toString(false);
    const sha256Msg = createHash("sha256")
      .update(msgHex, "hex")
      .digest();

    console.log("msgToSign", msgHex);

    const privateKey = Secp256k1.uint256(pkHex, 16);
    const digest = Secp256k1.uint256(byteArrayToHex(sha256Msg), 16);

    const publicKey = Secp256k1.generatePublicKeyFromPrivateKeyData(privateKey);
    console.log("public", publicKey);

    const sig = Secp256k1.ecsign(privateKey, digest);
    console.log(sig);

    const signature = sig.r + sig.s;
    console.log("signature", signature);

    tx.signatures.unshift({ signature, kind: 2 });

    if (alsoSignWithPha) {
      tx.sign(getPrivateKeyFromWif(wif));
    }

    const rawTx = tx.toString(true);

    console.log("%c" + rawTx, "color:red");

    const hash = await this.api.sendRawTransaction(rawTx);
    console.log("Returned from sendRawTransaction with res: ", hash);

    return hash;
  }

  async signTxEthWithPassword(
    txdata: TxArgsData,
    password: string,
    alsoSignWithPha: boolean = false
  ) {
    const hash = await this.signTxEth(
      txdata,
      this.getWifFromPassword(password),
      alsoSignWithPha
    );
    return hash;
  }

  getBscContract(symbol: string) {
    return getBscContract(symbol, this.isMainnet);
  }

  getEthContract(symbol: string) {
    return getEthContract(symbol, this.isMainnet);
  }

  getNeoContract(symbol: string) {
    const hash = this.getTokenHash(symbol, "neo");
    if (hash) return hash;
    return "ed07cffad18f1308db51920d99a2af60ac66a7b3"; // harcoded SOUL NEP5 contract
  }

  getTranscodeAddress(wif: string) {
    const pkHex = getPrivateKeyFromWif(wif);
    const privateKey = Secp256k1.uint256(pkHex, 16);
    const publicKey = Secp256k1.generatePublicKeyFromPrivateKeyData(privateKey);
    console.log("public", publicKey);
    var lastBit = parseInt(publicKey.y[63], 16) & 1;
    var addressHex = Buffer.from(
      (lastBit == 1 ? "0103" : "0102") + publicKey.x,
      "hex"
    );
    return "P" + base58.encode(addressHex);
  }

  getTranscodeAddressWithPassword(password: string) {
    return this.getTranscodeAddress(this.getWifFromPassword(password));
  }

  getWifFromPassword(
    password: string,
    acc: WalletAccount | undefined = undefined
  ) {
    const account = acc !== undefined ? acc : this.currentAccount;
    if (!account) throw new Error(this.$i18n.t("error.noAccount").toString());

    let wif = "";
    if (password == "") {
      if (account.wif) wif = account.wif;
    } else {
      if (!account.encKey)
        throw new Error(this.$i18n.t("error.noEncrypted").toString());

      const hex = CryptoJS.AES.decrypt(account.encKey, password).toString();
      for (var i = 0; i < hex.length && hex.substr(i, 2) !== "00"; i += 2)
        wif += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }

    if (!this.isWifValidForAccount(wif, account))
      throw new Error(this.$i18n.t("error.noPasswordMatch").toString());

    return wif;
  }

  getAllTokens(): Token[] {
    return (this._tokens as any)[this.nexus] as Token[];
  }

  getAllSwapableTokens(platform: string) {
    return this.getAllTokens().filter(
      (t) =>
        t.external && t.external.findIndex((e) => e.platform == platform) >= 0
    );
  }

  getToken(symbol: string) {
    return this.getAllTokens().find((t) => t.symbol == symbol);
  }

  getTokenHash(symbol: string, chain: string) {
    const ch = chain == "eth" ? "ethereum" : chain;
    const token = this.getToken(symbol);
    if (token && token.external) {
      let ext = token.external.find((e) => e.platform == ch);
      if (ext) return ext.hash;
    }
    return undefined;
  }

  isSwappable(symbol: string, swapToChain: string) {
    const hash = this.getTokenHash(symbol, swapToChain);
    return hash != null;
  }

  decimals(symbol: string): number {
    const token = this.getToken(symbol);
    if (token) return token.decimals;

    switch (symbol) {
      case "KCAL":
        return 10;
      case "SOUL":
        return 8;
      case "NEO":
        return 0;
      case "GAS":
        return 8;
      case "GOATI":
        return 3;
      case "ETH":
        return 18;
      case "MKNI":
        return 0;
      case "DYT":
        return 18;
      case "MUU":
        return 18;
      case "DANK":
        return 18;
      case "USDC":
        return 6;
      case "BNB":
        return 18;
      case "BUSD":
        return 18;
      default:
        return 0;
    }
  }

  isNFT(symbol: string) {
    const token = this.getToken(symbol);
    return token && token.flags && !token.flags.includes("Fungible");
  }

  isBurnable(symbol: string) {
    const token = this.getToken(symbol);
    return token && token.flags && token.flags.includes("Burnable");
  }

  formatBalance(symbol: string, amount: string): string {
    const decimals = this.decimals(symbol);
    if (this.isNFT(symbol)) return symbol + " NFT";

    if (decimals == 0) return amount + " " + symbol;
    while (amount.length < decimals + 1) amount = "0" + amount;

    const intPart = amount.substring(0, amount.length - decimals);
    const decimalPart = amount.substring(
      amount.length - decimals,
      amount.length
    );
    if (parseInt(decimalPart) == 0) return intPart + " " + symbol;
    return (
      intPart +
      "." +
      (decimalPart.length >= 2 ? decimalPart.substring(0, 2) : decimalPart) +
      " " +
      symbol
    );
  }

  async getAccountTransactions(
    address: string,
    offsetPage: number = 0
  ): Promise<Paginated<AccountTransactions>> {
    return await this.api.getAddressTransactions(address, offsetPage + 1, 15);
  }

  async fetchNftData(balance: Balance) {
    if (!balance) return;
    const token = balance.symbol;
    const ids = balance.ids;
    if (!ids) return;

    await this.queryNfts(ids, token);
  }

  async queryNfts(ids: string[], token: string) {
    const allNftsToQuery = [];

    for (let k = 0; k < ids.length; ++k) {
      const id = ids[k];
      const lookupId = token + "@" + id;
      const nft = this.nfts[lookupId];
      if (!nft || nft.img.startsWith("placeholder-")) {
        // search for it
        allNftsToQuery.push(id);
      }
    }

    if (token == "TTRS") {
      const host = "https://www.22series.com/api/store/nft";

      // batch query TTRS tokens
      for (let i = 0; i < allNftsToQuery.length; i += 100) {
        const nftsToQuery = allNftsToQuery.slice(i, i + 100);

        console.log("querying", nftsToQuery);

        const res = await fetch(host, {
          method: "POST",
          mode: "cors",
          body: JSON.stringify({ ids: nftsToQuery }),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        let nftsTtrs = await res.json();
        console.log("Result of queryNft", nftsToQuery, nftsTtrs);
        let nftDict: any = {};

        Object.keys(nftsTtrs).forEach((key) => {
          const ttrs = nftsTtrs[key];
          let nftDef = {
            id: key,
            mint: ttrs.mint,
            img: ttrs.img + "?width=128",
            type: ttrs.type,
            name: ttrs.item_info.name_english,
            rarity: ttrs.item_info.rarity,
          };
          nftDict[token + "@" + key] = nftDef;
        });
        Object.assign(this.nfts, nftDict);
      }
    } else {
      // query nfts individually
      let nftDict: any = {};

      for (let i = 0; i < allNftsToQuery.length; ++i) {
        const nftId = allNftsToQuery[i];
        console.log("getNFT of " + token + " " + nftId);
        const nft = await this.api.getNFT(token, nftId);
        console.log("Got nft", nft);

        const imgUrlUnformated = nft.properties.find(
          (kv) => kv.Key == "ImageURL"
        )?.Value;

        let nftDef = {
          id: nftId,
          mint: nft.mint,
          img: imgUrlUnformated,
          type: nft.properties.find((kv) => kv.Key == "Type")?.Value,
          name: nft.properties.find((kv) => kv.Key == "Name")?.Value,
          infusion: nft.infusion,
        };
        nftDict[token + "@" + nftId] = nftDef;
      }
      Object.assign(this.nfts, nftDict);
    }

    this.nfts = Object.assign({}, this.nfts);

    if (allNftsToQuery.length > 0)
      chrome.storage.local.set({ nfts: this.nfts }, () => { });
  }
}

export const state = new PopupState();
