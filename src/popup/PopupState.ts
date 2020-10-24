import fetch from "cross-fetch";
import * as CryptoJS from "crypto-js";

import {
  PhantasmaAPI,
  Account,
  Transaction,
  getPrivateKeyFromWif,
  getAddressFromWif,
  Paginated,
  AccountTransactions,
  Balance,
} from "@/phan-js";

interface IAuthorization {
  dapp: string;
  hostname: string;
  token: string;
  address: string;
  expireDate: number;
}

export interface WalletAccount {
  address: string;
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

export class PopupState {
  api = new PhantasmaAPI(
    "https://seed.ghostdevs.com:7077/rpc",
    "https://ghostdevs.com/getpeers.json"
  );

  private _currentAccountIndex = 0;
  private _accounts: WalletAccount[] = [];
  private _authorizations: IAuthorization[] = [];
  private _currency: string = "USD";

  private _currenciesRate: any;

  accountNfts: any[] = [];
  nfts: any = {};

  constructor() {}

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

  getRate(symbol: string) : number {
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
      }
    } catch { console.log('Error getting rates for '+symbol+' in '+curSym)  }
    return -1;
  }

  async check(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get((items) => {
        console.log("[PopupState] Get local storage");
        this._currentAccountIndex = items.currentAccountIndex
          ? items.currentAccountIndex
          : 0;
        this._accounts = items.accounts
          ? items.accounts.filter((a: WalletAccount) => a.type !== "wif")
          : [];
        this._authorizations = items.authorizations ? items.authorizations : [];
        this._currency = items.currency ? items.currency : "USD";
        this.nfts = items.nfts ? items.nfts : {};

        this._accounts = items.accounts
          ? items.accounts.filter((a: WalletAccount) => a.type !== "wif")
          : [];

        const numAccounts = items.accounts ? items.accounts.length : 0;

        if (this._accounts.length !== numAccounts)
          chrome.storage.local.set({ accounts: this._accounts });

        resolve();
      });
    });
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

  async fetchRates() {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=phantasma%2Cphantasma-energy%2Cneo%2Cgas%2Ctether%2Cethereum%2Cdai&vs_currencies=usd%2Ceur%2Cgbp%2Cjpy%2Ccad%2Caud%2Ccny')
    const resJson = await res.json();
    this._currenciesRate = resJson;
    console.log("%c"+JSON.stringify(this._currenciesRate, null, 2), "font-size:18px")
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

  async addAccount(addressOrName: string): Promise<Account> {
    let address = addressOrName;

    if (!address.startsWith("P") || address.length != 47) {
      address = await this.api.lookUpName(address);
    }

    const accountData = await this.getAccountData(address);
    const len = this._accounts.push({
      address: accountData.address,
      type: "unverified",
      data: accountData,
    });

    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        { currentAccountIndex: len - 1, accounts: this._accounts },
        () => resolve()
      );
    });
  }

  isWifValidForAccount(wif: string): boolean {
    try {
      return this.currentAccount?.address === getAddressFromWif(wif);
    } catch {
      return false;
    }
  }

  async addAccountWithWif(wif: string, password: string): Promise<Account> {
    let address = getAddressFromWif(wif);
    const accountData = await this.getAccountData(address);
    const hasPass = password != null && password != "";

    if (hasPass) {
      const encKey = CryptoJS.AES.encrypt(wif, password).toString();
      this._accounts.push({
        address: accountData.address,
        type: "encKey",
        encKey,
        data: accountData,
      });
    } else {
      this._accounts.push({
        address: accountData.address,
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

    console.log("Refreshing account " + account.address);
    account.data = await this.getAccountData(account.address);

    await this.fetchNftData(
      account.data.balances.find((b) => b.symbol == "TTRS")!
    );

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ accounts: this._accounts }, () => resolve());
    });
  }

  async authorizeDapp(
    dapp: string,
    hostname: string,
    token: string,
    expireDate: Date
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
      });

      chrome.storage.local.set({ authorizations: this._authorizations }, () =>
        resolve()
      );
    });
  }

  getDapp(token: string): string {
    return this._authorizations.find((a) => a.token == token)!.dapp;
  }

  async signTxWithPassword(
    txdata: TxArgsData,
    address: string,
    password: string
  ) {
    const account = this.accounts.find((a) => a.address == address);
    if (!account) throw new Error("Cannot find account");

    let wif = "";
    if (password == "") {
      if (account.wif) wif = account.wif;
    } else {
      if (!account.encKey) throw new Error("Cannot find encrypted key");

      const hex = CryptoJS.AES.decrypt(account.encKey, password).toString();
      for (var i = 0; i < hex.length && hex.substr(i, 2) !== "00"; i += 2)
        wif += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }

    return await this.signTx(txdata, wif);
  }

  async signTx(txdata: TxArgsData, wif: string): Promise<string> {
    const account = this.currentAccount;
    if (!account) {
      throw new Error("Account not valid");
    }
    const address = account.address;

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

    const privateKey = getPrivateKeyFromWif(wif);

    tx.sign(privateKey);

    const hash = await this.api.sendRawTransaction(tx.toString(true));
    console.log("Returned from sendRawTransaction with res: ", hash);

    return hash;
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

    if (token != "TTRS" && !ids) return;

    const host = "https://www.22series.com/api/store/nft";

    if (!ids) return;

    const allNftsToQuery = [];
    this.accountNfts = [];

    for (let k = 0; k < ids.length; ++k) {
      const id = ids[k];
      const nft = this.nfts[id];
      if (nft) {
        // add to array
        this.accountNfts.push(Object.assign({ id }, nft));
      } else {
        // search for it
        allNftsToQuery.push(id);
      }
    }

    for (let i = 0; i < allNftsToQuery.length; i += 100) {
      const nftsToQuery = allNftsToQuery.slice(i, i + 100);

      console.log("querying", nftsToQuery);

      const res = await fetch(host, {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({ ids: nftsToQuery }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      let nftDict = await res.json();
      Object.assign(this.nfts, nftDict);

      const nftKeys = Object.keys(nftDict);
      for (let k = 0; k < nftKeys.length; ++k)
        this.accountNfts.push(nftDict[nftKeys[k]]);
    }

    if (allNftsToQuery.length > 0)
      chrome.storage.local.set({ nfts: this.nfts }, () => {});
  }

  async queryNft(ids: string[], token: string) {
    const host = "https://www.22series.com/api/store/nft";

    const allNftsToQuery = [];

    for (let k = 0; k < ids.length; ++k) {
      const id = ids[k];
      const nft = this.nfts[id];
      if (!nft) {
        // search for it
        allNftsToQuery.push(id);
      }
    }

    for (let i = 0; i < allNftsToQuery.length; i += 100) {
      const nftsToQuery = allNftsToQuery.slice(i, i + 100);

      console.log("querying", nftsToQuery);

      const res = await fetch(host, {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({ ids: nftsToQuery }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      console.log("Result of queryNft", nftsToQuery, res);
      let nftDict = await res.json();
      Object.assign(this.nfts, nftDict);
    }

    this.nfts = Object.assign({}, this.nfts);

    if (allNftsToQuery.length > 0)
      chrome.storage.local.set({ nfts: this.nfts }, () => {});
  }
}

export const state = new PopupState();
