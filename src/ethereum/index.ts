import WIF from "wif";
import * as ethUtil from "ethereumjs-util";
import { Transaction as EthereumTx } from "ethereumjs-tx";
import EthWallet from "ethereumjs-wallet";
import { isMainThread } from "worker_threads";
import { state } from "@/popup/PopupState";

const contractsRopsten: any = {
  SOUL: "19861B13425d8aCFB70eB91Ac50EC3cF721d0C8a",
  KCAL: "8218c82446bb74fB525fECC8844B03C34f987efe",
  DYT: "e7018acad667012d50edb363effa4f2f56c6a0b0",
  MUU: "25836ce76065A3DfCeF069fD4964C240C4F2523F", // to update
  DANK: "9ea1ae46c15a4164b74463bc26f8aa3b0eea2e6e", // to update
};

const contractsMainnet: any = {
  SOUL: "75858677e27C930FB622759FeafFeE2b754Af07F",
  KCAL: "47C1178F49140ECdBfbdF0aE2935cDB640D579F9",
  DYT: "740623d2c797b7D8D1EcB98e9b4Afcf99Ec31E14",
  MUU: "25836ce76065A3DfCeF069fD4964C240C4F2523F",
  DANK: "9ea1ae46c15a4164b74463bc26f8aa3b0eea2e6e",
};

export function getEthContract(symbol: string, isMainnet: boolean) {
  let hash = state.getTokenHash(symbol, "ethereum");
  if (hash) {
    return hash;
  }

  // to remove soon
  if (isMainnet) return contractsMainnet[symbol];
  else return contractsRopsten[symbol];
}

export async function JSONRPC(
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
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

export function getEthAddressFromWif(wif: string): string {
  const pk = ab2hexstring(WIF.decode(wif, 128).privateKey);
  const ethWallet = EthWallet.fromPrivateKey(Buffer.from(pk, "hex"));
  return ethWallet.getChecksumAddressString();
}

export function getChecksumAddress(address: string) {
  return ethUtil.toChecksumAddress(address);
}

export async function getEthBalances(ethAddress: string, isMainnet: boolean) {
  const balances: { symbol: string; amount: bigint }[] = [];

  const erc20Tokens = state
    .getAllSwapableTokens("ethereum")
    .filter((t) => t.symbol != "ETH");

  console.log("erc20 tokens", erc20Tokens);

  const rpcUrl =
    "https://" +
    (isMainnet ? "mainnet" : "ropsten") +
    ".infura.io/v3/aad54c5b39ad4aefa496246bcbf817f8";

  const ethBalance = await JSONRPC(rpcUrl, "eth_getBalance", [
    ethAddress,
    "latest",
  ]);

  const ethVal = BigInt(ethBalance === "0x" ? 0 : ethBalance);
  console.log("ethBalance", ethVal);
  if (ethVal != 0n) balances.push({ symbol: "ETH", amount: ethVal });

  const ethDataAddr =
    "0x70a08231000000000000000000000000" + ethAddress.substring(2);

  erc20Tokens.map(async (t) => {
    const hash = t.external?.find((e) => e.platform == "ethereum")?.hash;
    if (!hash) return;
    const ercBalance = await JSONRPC(rpcUrl, "eth_call", [
      {
        to: "0x" + hash,
        data: ethDataAddr,
      },
      "latest",
    ]);

    const val = BigInt(ercBalance == "0x" ? 0 : ercBalance);
    if (val != 0n) balances.push({ symbol: t.symbol, amount: val });
    console.log(t.symbol, "balance", val);
  });

  return balances;
}
