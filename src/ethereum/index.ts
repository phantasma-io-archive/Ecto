import WIF from "wif";
import { Transaction as EthereumTx } from "ethereumjs-tx";
import EthWallet from "ethereumjs-wallet";
import { isMainThread } from "worker_threads";

const contractsRopsten: any = {
  SOUL: "19861B13425d8aCFB70eB91Ac50EC3cF721d0C8a",
  KCAL: "8218c82446bb74fB525fECC8844B03C34f987efe",
};

const contractsMainnet: any = {
  SOUL: "79C75E2e8720B39e258F41c37cC4f309E0b0fF80",
  KCAL: "14EB60F5f270B059B0c788De0Ddc51Da86f8a06d",
};

export function getEthContract(symbol: string, isMainnet: boolean) {
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
  return ethWallet.getAddressString();
}

export async function getEthBalances(ethAddress: string) {
  const balances = [];

  const ethBalance = await JSONRPC(
    "https://ropsten.infura.io/v3/aad54c5b39ad4aefa496246bcbf817f8",
    "eth_getBalance",
    [ethAddress, "latest"]
  );

  const ethVal = parseInt(ethBalance.slice(2), 16);
  console.log("ethBalance", ethVal);

  const ethDataAddr =
    "0x70a08231000000000000000000000000" + ethAddress.substring(2);

  const soulErcBalance = await JSONRPC(
    "https://ropsten.infura.io/v3/aad54c5b39ad4aefa496246bcbf817f8",
    "eth_call",
    [{ to: "0x" + contractsRopsten.SOUL, data: ethDataAddr }, "latest"]
  );

  const soulVal = parseInt(soulErcBalance.slice(2), 16);
  console.log("soul balance", soulVal);

  const kcalBalance = await JSONRPC(
    "https://ropsten.infura.io/v3/aad54c5b39ad4aefa496246bcbf817f8",
    "eth_call",
    [{ to: "0x" + contractsRopsten.KCAL, data: ethDataAddr }, "latest"]
  );

  const kcalVal = parseInt(kcalBalance.slice(2), 16);
  console.log("kcal balance", kcalVal);

  if (ethVal !== 0) balances.push({ symbol: "ETH", amount: ethVal });
  if (soulVal !== 0) balances.push({ symbol: "SOUL", amount: soulVal });
  if (kcalVal !== 0) balances.push({ symbol: "KCAL", amount: kcalVal });

  return balances;
}
