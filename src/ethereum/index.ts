import WIF from "wif";
import { Transaction as EthereumTx } from "ethereumjs-tx";
import EthWallet from "ethereumjs-wallet";
import { isMainThread } from "worker_threads";

const contractsRopsten: any = {
  SOUL: "19861B13425d8aCFB70eB91Ac50EC3cF721d0C8a",
  KCAL: "8218c82446bb74fB525fECC8844B03C34f987efe",
  DYT: "e7018acad667012d50edb363effa4f2f56c6a0b0",
  MUU: "25836ce76065A3DfCeF069fD4964C240C4F2523F", // to update
  DANK: "9ea1ae46c15a4164b74463bc26f8aa3b0eea2e6e", // to update
};

const contractsMainnet: any = {
  SOUL: "79C75E2e8720B39e258F41c37cC4f309E0b0fF80",
  KCAL: "14EB60F5f270B059B0c788De0Ddc51Da86f8a06d",
  DYT: "740623d2c797b7D8D1EcB98e9b4Afcf99Ec31E14",
  MUU: "25836ce76065A3DfCeF069fD4964C240C4F2523F",
  DANK: "9ea1ae46c15a4164b74463bc26f8aa3b0eea2e6e",
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

export async function getEthBalances(ethAddress: string, isMainnet: boolean) {
  const balances = [];

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

  const ethDataAddr =
    "0x70a08231000000000000000000000000" + ethAddress.substring(2);

  const soulErcBalance = await JSONRPC(rpcUrl, "eth_call", [
    {
      to: "0x" + (isMainnet ? contractsMainnet.SOUL : contractsRopsten.SOUL),
      data: ethDataAddr,
    },
    "latest",
  ]);

  const soulVal = BigInt(soulErcBalance == "0x" ? 0 : soulErcBalance);
  console.log("soul balance", soulVal);

  const kcalBalance = await JSONRPC(rpcUrl, "eth_call", [
    {
      to: "0x" + (isMainnet ? contractsMainnet.KCAL : contractsRopsten.KCAL),
      data: ethDataAddr,
    },
    "latest",
  ]);

  const kcalVal = BigInt(kcalBalance == "0x" ? 0 : kcalBalance);
  console.log("kcal balance", kcalVal);

  const dytBalance = await JSONRPC(rpcUrl, "eth_call", [
    {
      to: "0x" + (isMainnet ? contractsMainnet.DYT : contractsRopsten.DYT),
      data: ethDataAddr,
    },
    "latest",
  ]);

  const dytVal = BigInt(dytBalance === "0x" ? 0 : dytBalance);
  console.log("dyt balance", dytVal);

  const muuBalance = await JSONRPC(rpcUrl, "eth_call", [
    {
      to: "0x" + (isMainnet ? contractsMainnet.MUU : contractsRopsten.MUU),
      data: ethDataAddr,
    },
    "latest",
  ]);

  const muuVal = BigInt(muuBalance === "0x" ? 0 : muuBalance);
  console.log("muu balance", muuVal);

  const dankBalance = await JSONRPC(rpcUrl, "eth_call", [
    {
      to: "0x" + (isMainnet ? contractsMainnet.DANK : contractsRopsten.DANK),
      data: ethDataAddr,
    },
    "latest",
  ]);

  const dankVal = BigInt(dankBalance === "0x" ? 0 : dankBalance);
  console.log("dank balance", dankVal);

  if (ethVal !== 0n) balances.push({ symbol: "ETH", amount: ethVal });
  if (soulVal !== 0n) balances.push({ symbol: "SOUL", amount: soulVal });
  if (kcalVal !== 0n) balances.push({ symbol: "KCAL", amount: kcalVal });
  if (dytVal !== 0n) balances.push({ symbol: "DYT", amount: dytVal });
  if (muuVal !== 0n) balances.push({ symbol: "MUU", amount: muuVal });
  if (dankVal !== 0n) balances.push({ symbol: "DANK", amount: dankVal });

  return balances;
}
