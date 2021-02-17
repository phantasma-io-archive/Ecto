/// <reference types="chrome"/>
import Vue from "vue";
import { PhantasmaAPI } from "@/phan-js";
import { state } from "@/popup/PopupState";
import VueI18n from "vue-i18n";
import { messages, defaultLocale } from "@/i18n";

Vue.use(VueI18n);

const i18n = new VueI18n({
  messages,
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
});

interface IAuthorization {
  dapp: string;
  hostname: string;
  token: string;
  address: string;
  expireDate: number;
  version: string | undefined;
}

interface IWalletLinkResponse {
  id: number;
  success: boolean;
}

interface IBalance {
  symbol: string;
  value: string;
  decimals: number;
}

interface IAuthorizeResponse extends IWalletLinkResponse {
  wallet: string;
  dapp: string;
  token: string;
}

interface IGetAccountResponse extends IWalletLinkResponse {
  address: string;
  name: string;
  avatar: string;
  balances: IBalance[];
  platform: string | undefined;
  external: string | undefined;
}

interface ISignTxResponse extends IWalletLinkResponse {
  hash: string;
}

let authorizations: IAuthorization[] = [];

chrome.tabs.onUpdated.addListener(function(activeInfo) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const tab = tabs[0];
    const tabURL = tab.url;

    if (!tabURL) return;

    if (tab.id)
      chrome.tabs.sendMessage(
        tab.id,
        { uid: "init", tabid: tab.id },
        function() {
          console.log(tab.id);
        }
      );
  });
});

function genHexString(len: number) {
  let output = "";
  for (let i = 0; i < len; ++i) {
    output += Math.floor(Math.random() * 16).toString(16);
  }
  return output;
}

function getAuthorizationToken(
  dapp: string,
  hostname: string,
  version: string
): string | undefined {
  // remove first all authorizations that are expired
  const now = new Date();
  const validAuths = authorizations.filter((a) => new Date(a.expireDate) > now);

  if (validAuths.length != authorizations.length) {
    chrome.storage.local.set({ authorizations: validAuths }, () => {});
  }

  const auth = validAuths.find((a) => {
    if (version == "2")
      return a.dapp == dapp && a.hostname == hostname && a.version == "2";
    else return a.dapp == dapp && a.hostname == hostname;
  });
  if (!auth) return undefined;

  return auth.token;
}

function isValidRequest(args: string[]): boolean {
  if (args.length >= 3) {
    // const dapp = args[args.length - 2];
    const token = args[args.length - 1];

    const auth = authorizations.find((a) => a.token == token);
    return auth != undefined;
  }
  return false;
}

function getRequestAddress(
  args: string[]
): { address: string; version: string } | undefined {
  if (args.length >= 3) {
    const dapp = args[args.length - 2];
    const token = args[args.length - 1];
    const auth = authorizations.find((a) => a.token == token);
    return auth
      ? { address: auth.address, version: auth.version ? auth.version : "1" }
      : undefined;
  }
}

chrome.storage.local.get((items) => {
  authorizations = items.authorizations ? items.authorizations : [];
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area == "local") {
    if (changes.authorizations) {
      authorizations = changes.authorizations.newValue;
    }
  }
});

chrome.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
  i18n.locale = state.locale;

  if (msg.uid == "plsres") {
    console.log(JSON.stringify(msg));
    chrome.tabs.sendMessage(msg.tabid, msg);
  }

  if (msg.uid == "pls") {
    let args: string[] = msg.data.split(",");

    const id = parseInt(args[0]);
    if (args.length != 2) {
      throw Error(i18n.t("error.malformed").toString());
    }

    let cmd = args[1];
    args = cmd.split("/");

    const requestType = args[0];
    console.log(
      "[background] Received " + requestType + " with tabid " + msg.tabid
    );

    switch (requestType) {
      case "authorize":
        {
          const token = genHexString(64);
          const dapp = args[1];

          const version = args.length > 2 ? args[2] : "1";

          chrome.tabs.get(msg.tabid, (tab) => {
            const url = tab.url || "http://unknown";
            const favicon = tab.favIconUrl || "unknown";

            const authToken = getAuthorizationToken(
              dapp,
              new URL(url).hostname,
              version
            );

            if (authToken) {
              console.log("Valid authorization token: " + authToken);

              chrome.tabs.sendMessage(msg.tabid, {
                uid: "plsres",
                tabid: msg.tabid,
                sid: msg.sid,
                data: {
                  wallet: "Ecto",
                  dapp,
                  token: authToken,
                  // new in v2
                  nexus: state.nexus,
                  version: "1",
                  id,
                  success: true,
                },
              });

              return;
            } else
              chrome.windows.create(
                {
                  type: "popup",
                  url:
                    "popup.html?/#/Authorize/" +
                    dapp +
                    "/" +
                    token +
                    "/" +
                    id +
                    "/" +
                    msg.tabid +
                    "/" +
                    msg.sid +
                    "/" +
                    btoa(url) +
                    "/" +
                    btoa(favicon),
                  width: 320,
                  height: 600,
                },
                (wnd) => {
                  console.log("created popup wnd");
                }
              );
          });
        }
        break;

      case "getAccount":
        if (isValidRequest(args)) {
          const req = getRequestAddress(args);
          if (req == null) return;
          const address = req.address;
          const version = req.version;

          let platform = "phantasma";
          if (args.length > 3) {
            platform = args[1];
            /// check that this is ok
          }

          await state.check(undefined);
          console.log("nexus", state.nexus);
          console.log("getting account " + address);
          let account = await state.api.getAccount(address);

          if (!account.balances) {
            account.balances = [];
          }

          if (!account.balances.find((b) => b.symbol == "SOUL"))
            account.balances.unshift({
              chain: "main",
              symbol: "SOUL",
              amount: "0",
              decimals: 8,
            });

          let external = ""; // external address (neo or eth) if platform is not phantasma

          console.log("got account: " + JSON.stringify(account));
          let response: IGetAccountResponse = {
            name: account.name,
            address: account.address,
            avatar: "",
            platform,
            external,
            balances: account.balances.map((x) => {
              return {
                value: x.amount,
                decimals: x.decimals,
                symbol: x.symbol,
              };
            }),
            id,
            success: true,
          };
          console.log("sending account response" + JSON.stringify(response));
          chrome.tabs.sendMessage(msg.tabid, {
            uid: "plsres",
            sid: msg.sid,
            data: response,
          });
        }
        break;

      case "signTx":
        if (isValidRequest(args)) {
          const req = getRequestAddress(args);
          if (req == null) return;
          const address = req.address;
          const version = req.version;
          const token = args[args.length - 1];

          const nexus = args[1];
          const chain = args[2];
          const script = args[3];
          let payload = args[4];
          payload = payload == null || payload == "" ? state.payload : payload;

          let txdata = JSON.stringify({ nexus, chain, script, payload });
          let b64txdata = btoa(txdata);

          chrome.tabs.get(msg.tabid, (tab) => {
            const url = tab.url || "http://unknown";
            const favicon = tab.favIconUrl || "unknown";

            console.log("[background] Creating sign popup with " + txdata);
            chrome.windows.create(
              {
                type: "popup",
                url:
                  "popup.html?/#/Sign/" +
                  token +
                  "/" +
                  id +
                  "/" +
                  msg.tabid +
                  "/" +
                  msg.sid +
                  "/" +
                  btoa(url) +
                  "/" +
                  btoa(favicon) +
                  "/" +
                  b64txdata,
                width: 320,
                height: 600,
              },
              (wnd) => {}
            );
          });
        }

        break;

      case "signData":
        if (isValidRequest(args)) {
          const req = getRequestAddress(args);
          if (req == null) return;
          const address = req.address;
          const version = req.version;
          const token = args[args.length - 1];

          const hexdata = args[1];
          const signKind = args[2];

          chrome.tabs.get(msg.tabid, (tab) => {
            const url = tab.url || "http://unknown";
            const favicon = tab.favIconUrl || "unknown";

            console.log("[background] Creating signData popup with " + hexdata);
            chrome.windows.create(
              {
                type: "popup",
                url:
                  "popup.html?/#/SignData/" +
                  token +
                  "/" +
                  id +
                  "/" +
                  msg.tabid +
                  "/" +
                  msg.sid +
                  "/" +
                  btoa(url) +
                  "/" +
                  btoa(favicon) +
                  "/" +
                  hexdata,
                width: 320,
                height: 600,
              },
              (wnd) => {}
            );
          });
        }

        break;

      case "invokeScript":
        if (isValidRequest(args)) {
          let script = args[1];

          // not supported atm
        }
        break;
    }
  }
  return Promise.resolve("Dummy response to keep the console quiet");
});
