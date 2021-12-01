import WIF from "wif";
import Neon, {
  api,
  nep5,
  rpc,
  sc,
  tx,
  u,
  wallet,
} from "@cityofzion/neon-js";
import { state } from "@/popup/PopupState";

const tokens = {
  SOUL: "ed07cffad18f1308db51920d99a2af60ac66a7b3",
  NEO: "0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b",
  GAS: "0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7",
};

let currentNeoRPCIndex = 0;

let neoRpcs = [ 
    "http://seed8.ngd.network:10332",
    "http://seed9.ngd.network:10332",
    "http://seed7.ngd.network:10332",
    "http://jpc.phantasma.io:10332",
    "http://seed.neoeconomy.io:10332",
]

function getNeoRpc(isMainnet: boolean) {
  if (!isMainnet) return "http://mankinighost.phantasma.io:30333";
  return neoRpcs[currentNeoRPCIndex % neoRpcs.length]
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

export function getNeoAddressFromWif(wif: string): string {
  const pk = ab2hexstring(WIF.decode(wif, 128).privateKey);
  const sh = wallet.getScriptHashFromPublicKey(
    wallet.getPublicKeyFromPrivateKey(pk)
  );
  return wallet.getAddressFromScriptHash(sh);
}

export function getScriptHashFromAddress(address: string): string {
  return wallet.getScriptHashFromAddress(address);
}

export async function getNeoBalances(
  neoAddress: string,
  isMainnet: boolean
): Promise<any[]> {
  let neoRpc = getNeoRpc(isMainnet);

  let account = null;
  try {
    account = await rpc.Query.getAccountState(neoAddress).execute(neoRpc);
  } catch {
    ++currentNeoRPCIndex;
    console.log("primary neo rpc", neoRpc, "is not working");
    neoRpc = getNeoRpc(isMainnet);
    console.log("trying another neo rpc", neoRpc);
    try {
      account = await rpc.Query.getAccountState(neoAddress).execute(neoRpc);
    } catch {
      ++currentNeoRPCIndex;
      console.log("secondary neo rpc", neoRpc, "is not working");
      neoRpc = getNeoRpc(isMainnet);
      console.log("trying another neo rpc", neoRpc);
      try {
        account = await rpc.Query.getAccountState(neoAddress).execute(neoRpc);
      } catch {
        console.log("neo rpc", neoRpc, "is not working");
        ++currentNeoRPCIndex;
      }
    }
  }

  console.log("neo account", account);

  const balances: any[] = [];

  const nep5Tokens = state
    .getAllSwapableTokens("neo")
    .filter((t) => t.symbol != "GAS" && t.symbol != "NEO");

  nep5Tokens.map(async (t) => {
    const hash = t.external?.find((e) => e.platform == "neo")?.hash;
    if (!hash) return;
    const valFixed = await nep5.getTokenBalance(neoRpc, hash, neoAddress);
    const amount = valFixed.toString();
    console.log(t.symbol, "amount", amount);
    if (amount !== "0")
      balances.push({
        symbol: t.symbol,
        amount: (parseFloat(amount) * 10 ** t.decimals).toFixed(0),
      });
  });

  if (account.result && account.result.balances) {
    const bals = account.result.balances;
    bals.forEach((el: any) => {
      if (el.asset == tokens.NEO && el.value !== 0)
        balances.push({ symbol: "NEO", amount: el.value });
      if (el.asset == tokens.GAS && el.value !== 0)
        balances.push({
          symbol: "GAS",
          amount: (parseFloat(el.value) * 10 ** 8).toFixed(0),
        });
    });
  }

  return balances;
}

async function sendNep5(
  wif: string,
  amount: number,
  symbol: string,
  dest: string,
  desc: string,
  gasFee: number,
  isMainnet: boolean
) {
  const contractScriptHash = state.getNeoContract(symbol).toLowerCase(); // "ed07cffad18f1308db51920d99a2af60ac66a7b3";
  const myAccount = new wallet.Account(wif);

  // We must change the data type of contract parameters
  const param_sending_address = sc.ContractParam.byteArray(
    myAccount.address,
    "address"
  );
  const param_receiving_address = sc.ContractParam.byteArray(dest, "address");
  const param_amount = Neon.create.contractParam("Integer", amount * 1e8);

  // Build contract script
  const props = {
    scriptHash: contractScriptHash,
    operation: "transfer",
    args: [param_sending_address, param_receiving_address, param_amount],
  };

  const script = Neon.create.script(props);

  // Create transaction object
  let rawTransaction = new tx.InvocationTransaction({
    script: script,
    gas: 0,
  });

  // Build input objects and output objects.
  rawTransaction.addAttribute(
    tx.TxAttrUsage.Script,
    u.reverseHex(wallet.getScriptHashFromAddress(myAccount.address))
  );

  // add date remark to simulate nonce
  const date = new Date();
  rawTransaction.addRemark("Sent on " + date);

  // query neoscan balance
  const neoApi = isMainnet
    ? "https://api.neoscan.io/api/main_net"
    : "http://mankinighost.phantasma.io:4000/api/main_net";
  const apiProvider = new api.neoscan.instance(neoApi);
  async function queryBalanceNeoScan() {
    let balance = await apiProvider.getBalance(myAccount.address);
    return balance;
  }

  // attach netwok fees
  const balance = await queryBalanceNeoScan();
  rawTransaction.calculate(balance, undefined, gasFee);

  rawTransaction.addAttribute(
    tx.TxAttrUsage.Description,
    u.str2hexstring(desc)
  );

  // Sign transaction with sender's private key
  const signature = wallet.sign(
    rawTransaction.serialize(false),
    myAccount.privateKey
  );

  // Add witness
  rawTransaction.addWitness(
    tx.Witness.fromSignature(signature, myAccount.publicKey)
  );

  // Send raw transaction
  const neoRpc = getNeoRpc(isMainnet);
  const client = new rpc.RPCClient(neoRpc);
  const res = await client.sendRawTransaction(rawTransaction);
  console.log("sendNep5 Raw Tx", res, rawTransaction);
  return rawTransaction.hash;
}

async function sendNative(
  wif: string,
  amount: number,
  symbol: string,
  dest: string,
  desc: string,
  gasFee: number,
  isMainnet: boolean
) {
  const myAccount = new wallet.Account(wif);

  const neoApi = isMainnet
    ? "https://api.neoscan.io/api/main_net"
    : "http://mankinighost.phantasma.io:4000/api/main_net";
  const apiProvider = new api.neoscan.instance(neoApi);

  // Create contract transaction using Neoscan API
  async function createTxWithNeoScan() {
    let balance = await apiProvider.getBalance(myAccount.address);
    let transaction = Neon.create.contractTx();
    transaction
      .addIntent(symbol, amount, dest)
      .addAttribute(tx.TxAttrUsage.Description, u.str2hexstring(desc))
      .calculate(balance, undefined, gasFee)
      .sign(myAccount.privateKey);

    return transaction;
  }

  // Send raw transaction
  const neoRpc = getNeoRpc(isMainnet);
  const client = new rpc.RPCClient(neoRpc);

  const transaction = await createTxWithNeoScan();
  console.log(transaction);
  const res = await client.sendRawTransaction(transaction);
  console.log("sendNative Raw Tx", res, transaction);

  return transaction.hash;
}

export async function sendNeo(
  wif: string,
  amount: number,
  symbol: string,
  dest: string,
  desc: string,
  gasFee: number,
  isMainnet: boolean
) {
  let hash = "";
  if (symbol != "NEO" && symbol != "GAS") {
    hash = await sendNep5(wif, amount, symbol, dest, desc, gasFee, isMainnet);
  } else {
    hash = await sendNative(wif, amount, symbol, dest, desc, gasFee, isMainnet);
  }
  return hash;
}
