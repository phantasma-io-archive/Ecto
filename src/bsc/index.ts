import WIF from "wif";
import { Transaction as EthereumTx } from "ethereumjs-tx";
import EthWallet from "ethereumjs-wallet";
import { isMainThread } from "worker_threads";
import { state } from "@/popup/PopupState";

const contractsTestnet: any = {
  SOUL: "1EAfA88a165d361d49Ba8a40930EF0e59392e185",
  KCAL: "1Bc40B96260451372B34F9CD21d1779b93b60Fb5",
};

const contractsMainnet: any = {
  SOUL: "298Eff8af1ecEbbB2c034eaA3b9a5d0Cc56c59CD",
  KCAL: "855EA8048E1852996429A50aBdA60F583909d298",
  BUSD: "e9e7cea3dedca5984780bafc599bd69add087d56",
};

export function getBscContract(symbol: string, isMainnet: boolean) {
  let hash = state.getTokenHash(symbol, "bsc");
  if (hash) {
    return hash;
  }

  // to remove soon
  if (isMainnet) return contractsMainnet[symbol];
  else return contractsTestnet[symbol];
}

export async function JSONRPCBSC(
  host: string,
  method: string,
  params: Array<any>
): Promise<any> {
  let res = await fetch(host, {
    method: "POST",
    mode: "cors",
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: "1",
    }),
    headers: { "Content-Type": "application/json" },
  });
  let resJson = await res.json();
  console.log("method", method, resJson);
  if (resJson.error) {
    if (resJson.error.message) return { error: resJson.error.message };
    return { error: resJson.error };
  }
  return await resJson.result;
}

function ab2hexstring(arr: ArrayBuffer | ArrayLike<number>): string {
  if (typeof arr !== "object") {
    throw new Error(`ab2hexstring expects an array.Input was ${arr}`);
  }
  let result = "";
  const intArray = new Uint8Array(arr);
  for (const i of intArray) {
    let str = i.toString(16);
    str = str.length === 0 ? "00" : str.length === 1 ? "0" + str : str;
    result += str;
  }
  return result;
}

export function getBscAddressFromWif(wif: string): string {
  const pk = ab2hexstring(WIF.decode(wif, 128).privateKey);
  const bscWallet = EthWallet.fromPrivateKey(Buffer.from(pk, "hex"));
  return bscWallet.getAddressString();
}

export async function getBscBalances(bscAddress: string, isMainnet: boolean) {
  const balances: { symbol: string; amount: bigint }[] = [];

  const bep20Tokens = state
    .getAllSwapableTokens("bsc")
    .filter((t) => t.symbol != "BNB");

  console.log("bep20 tokens", bep20Tokens);

  const rpcUrl =
    "https://" +
    (isMainnet ? "bsc-dataseed.binance.org/" : "data-seed-prebsc-1-s1.binance.org:8545/")

  const bnbBalance = await JSONRPCBSC(rpcUrl, "eth_getBalance", [
    bscAddress,
    "latest",
  ]);

  const bnbVal = BigInt(bnbBalance === "0x" ? 0 : bnbBalance);
  console.log("bnbBalance", bnbVal);
  if (bnbVal != 0n) balances.push({ symbol: "BNB", amount: bnbVal });

  const bscDataAddr =
    "0x70a08231000000000000000000000000" + bscAddress.substring(2);

  bep20Tokens.map(async (t) => {
    const hash = t.external?.find((e) => e.platform == "bsc")?.hash;
    if (!hash) return;
    const bepBalance = await JSONRPCBSC(rpcUrl, "eth_call", [
      {
        to: "0x" + hash,
        data: bscDataAddr,
      },
      "latest",
    ]);

    const val = BigInt(bepBalance == "0x" ? 0 : bepBalance);
    if (val != 0n) balances.push({ symbol: t.symbol, amount: val });
    console.log(t.symbol, "balance", val);
  });

  return balances;
}
