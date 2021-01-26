import WIF from "wif";
import base58 from "bs58";
import Neon, {
  api,
  CONST,
  nep5,
  rpc,
  sc,
  tx,
  u,
  wallet,
} from "@cityofzion/neon-js";

const tokens = {
  SOUL: "ed07cffad18f1308db51920d99a2af60ac66a7b3",
  NEO: "0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b",
  GAS: "0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7",
};

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

export async function getNeoBalances(neoAddress: string): Promise<any> {
  const account = await rpc.Query.getAccountState(neoAddress).execute(
    "https://m2.neo.nash.io"
  );

  console.log("neo account", account);

  const balances = [];
  const soulFixed = await nep5.getTokenBalance(
    "https://m2.neo.nash.io",
    tokens.SOUL,
    neoAddress
  );
  console.log("soulfixed", soulFixed);
  const soulAmount = soulFixed.toString();
  console.log("soulamount", soulAmount);
  if (soulAmount !== "0") balances.push({ symbol: "SOUL", amount: soulAmount });

  if (account.result && account.result.balances) {
    const bals = account.result.balances;
    bals.forEach((el: any) => {
      if (el.asset == tokens.NEO && el.value !== 0)
        balances.push({ symbol: "NEO", amount: el.value });
      if (el.asset == tokens.GAS && el.value !== 0)
        balances.push({ symbol: "GAS", amount: el.value });
    });
  }

  return balances;
}
