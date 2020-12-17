import WIF from "wif";
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
  signData,
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
  private _nexus: string = "MainNet";
  private _simnetRpc = "http://localhost:7077/rpc";
  private _testnetRpc = "http://testnet.phantasma.io:7077/rpc";
  private _mainnetRpc = "Auto";

  accountNfts: any[] = [];
  nfts: any = {};

  payload = "4543542D302E31";

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

  async setNexus(value: string) {
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

  async setSimnetRpc(value: string) {
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

  async setTestnetRpc(value: string) {
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

  async setMainnetRpc(value: string) {
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

  get mainnetRpcList() {
    return this.api.availableHosts;
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
      }
    } catch {
      console.log("Error getting rates for " + symbol + " in " + curSym);
    }
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

        if (items.simnetRpc) this._simnetRpc = items.simnetRpc;
        if (items.testnetRpc) this._testnetRpc = items.testnetRpc;
        if (items.mainnetRpc) this._mainnetRpc = items.mainnetRpc;
        if (items.nexus) this._nexus = items.nexus;

        this.api.setRpcByName(this._mainnetRpc);
        this.api.setNexus(this._nexus);
        if (this._nexus == "SimNet") this.api.setRpcHost(this._simnetRpc);
        if (this._nexus == "TestNet") this.api.setRpcHost(this._testnetRpc);

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

  async fetchRates() {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=phantasma%2Cphantasma-energy%2Cneo%2Cgas%2Ctether%2Cethereum%2Cdai&vs_currencies=usd%2Ceur%2Cgbp%2Cjpy%2Ccad%2Caud%2Ccny"
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

  async addAccountWithHex(hex: string, password: string): Promise<Account> {
    let pk = Buffer.from(hex, "hex");
    const wif = WIF.encode(128, pk, true);
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

    console.log(
      "Refreshing account " + account.address + " on " + this.api.host
    );

    this._accounts[this._currentAccountIndex].data = await this.getAccountData(
      account.address
    );

    await this.fetchNftData(
      this._accounts[this._currentAccountIndex].data.balances.find(
        (b) => b.symbol == "TTRS"
      )!
    );

    await this.fetchNftData(
      this._accounts[this._currentAccountIndex].data.balances.find(
        (b) => b.symbol == "GHOST"
      )!
    );

    await this.fetchNftData(
      this._accounts[this._currentAccountIndex].data.balances.find(
        (b) => b.symbol == "CROWN"
      )!
    );

    console.log(
      "Refreshed account " +
        JSON.stringify(this._accounts[this._currentAccountIndex])
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

    if (!this.isWifValidForAccount(wif))
      throw new Error("Password does not match");

    return await this.signTx(txdata, wif);
  }

  async signTx(txdata: TxArgsData, wif: string): Promise<string> {
    const account = this.currentAccount;
    if (!account) throw new Error("Account not valid");

    if (!this.isWifValidForAccount(wif))
      throw new Error("Account does not match");

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

  signDataWithPassword(
    data: string,
    address: string,
    password: string
  ): string {
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

    if (!this.isWifValidForAccount(wif))
      throw new Error("Password does not match");

    return this.signData(data, wif);
  }

  signData(data: string, wif: string): string {
    const account = this.currentAccount;
    if (!account) throw new Error("Account not valid");

    if (!this.isWifValidForAccount(wif))
      throw new Error("Account does not match");

    const privateKey = getPrivateKeyFromWif(wif);

    return signData(data, privateKey);
  }

  formatBalance(symbol: string, amount: string): string {
    let decimals = 0;
    switch (symbol) {
      case "KCAL":
        decimals = 10;
        break;
      case "SOUL":
        decimals = 8;
        break;
      case "NEO":
        decimals = 0;
        break;
      case "GAS":
        decimals = 8;
        break;
      case "GOATI":
        decimals = 3;
        break;
      case "ETH":
        decimals = 18;
        break;
      default:
        decimals = 0;
    }

    switch (symbol) {
      case "TTRS":
        return symbol + " NFT";
      case "GHOST":
        return symbol + " NFT";
      case "CROWN":
        return symbol + " NFT";
      default:
        break;
    }

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
      if (!nft) {
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

        const imgUrl = nft.properties
          .find((kv) => kv.Key == "ImageURL")
          ?.Value.replace("ipfs://", "https://gateway.ipfs.io/ipfs/");

        console.log("ImageURL", imgUrl);

        let nftDef = {
          id: nftId,
          mint: nft.mint,
          img: imgUrl,
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
      chrome.storage.local.set({ nfts: this.nfts }, () => {});
  }
}

export const state = new PopupState();
