import base58 from "bs58";
import { eddsa } from "elliptic";
import createHash from "create-hash";
import { ScriptBuilder } from "../vm";
const curve = new eddsa("ed25519");

interface ISignature {
  signature: string;
  kind: number;
}

export class TransactionNG {
  nexusName: string;
  chainName: string;  
  script: string;
  expiration: Date;
  payload: string;
  // new in ng
  sender: string = '';
  version: number;
  gasPayer: string;
  gasTarget: string;
  gasPrice: string;
  gasLimit: string;

  signatures: Array<ISignature>;

  constructor(
    nexusName: string,
    chainName: string,
    script: string,
    expiration: Date,
    payload: string,
    sender: string,
    gasPayer: string,
    gasTarget: string,
    gasPrice: string,
    gasLimit: string
  ) {
    this.nexusName = nexusName;
    this.chainName = chainName;
    this.script = script;
    this.expiration = expiration;
    this.payload = payload == null || payload == "" ? "454354" : payload;

    this.sender = sender
    this.gasPayer = gasPayer
    this.gasTarget = gasTarget
    this.gasLimit = gasLimit
    this.gasPrice = gasPrice
    this.version = 0
    
    this.signatures = [];    
  }

  public mine(targetDifficulty: number) {
    if (targetDifficulty <= 0) return
    let nonce = 0;
    while (nonce < Number.MAX_SAFE_INTEGER) {
      this.payload = ("0000000000" + (nonce).toString(16).toUpperCase()).slice(-2*4)
      if (this.getHashDifficulty() >= targetDifficulty) 
        return;
      ++nonce;
    }
  }

  public sign(privateKey: string) {
    const signature = this.getSign(this.toString(false), privateKey);
    this.signatures.unshift({ signature, kind: 1 });
  }

  public toString(withSignature: boolean): string {
    const utc = Date.UTC(
      this.expiration.getUTCFullYear(),
      this.expiration.getUTCMonth(),
      this.expiration.getUTCDate(),
      this.expiration.getUTCHours(),
      this.expiration.getUTCMinutes(),
      this.expiration.getUTCSeconds()
    );
    let num = utc / 1000;

    let a = (num & 0xff000000) >> 24;
    let b = (num & 0x00ff0000) >> 16;
    let c = (num & 0x0000ff00) >> 8;
    let d = num & 0x000000ff;

    let expirationBytes = [d, c, b, a];

    // const gasPayerBytes = [...base58.decode(this.gasPayer)]
    // const gasTargetBytes = [...base58.decode(this.gasTarget)]

    let sb = new ScriptBuilder()
      .emitVarString(this.nexusName)
      .emitVarString(this.chainName)
      .emitVarInt(this.version)  // ng      
      .emitVarInt(this.script.length / 2)
      .appendHexEncoded(this.script)
      .emitAddress(this.sender)
      .emitAddress(this.gasPayer)
      // .emitAddress(this.gasTarget)
      .emitByteArray(new Array(34).fill(0))
      .emitBigInteger(this.gasPrice)
      .emitBigInteger(this.gasLimit)
      .emitBytes(expirationBytes)
      .emitVarInt(this.payload.length / 2)
      .appendHexEncoded(this.payload);

    if (withSignature) {
      sb.emitVarInt(this.signatures.length);
      this.signatures.forEach((sig) => {
        console.log("adding signature ", sig);
        if (sig.kind == 1) {
          sb.appendByte(1); // Signature Type
          sb.emitVarInt(sig.signature.length / 2);
          sb.appendHexEncoded(sig.signature);
        } else if (sig.kind == 2) {
          sb.appendByte(2); // ECDSA Signature
          sb.appendByte(1); // Curve type secp256k1
          sb.emitVarInt(sig.signature.length / 2);
          sb.appendHexEncoded(sig.signature);
        }
      });
    }
    return sb.str;
  }

  private getSign(msgHex: string, privateKey: string): string {
    const msgHashHex = Buffer.from(msgHex, "hex");
    const privateKeyBuffer = Buffer.from(privateKey, "hex");

    const sig = curve.sign(msgHashHex, privateKeyBuffer);

    return sig.toHex();
  }

  private getHashDifficulty() {
    var hexStr = this.toString(false)
    const hash = createHash("sha256")
      .update(hexStr, "hex")
      .digest();


    let result = 0;
    for (let i=0; i<hash.length; i++)
    {
        let n = hash[i];

        for (let j=0; j<8; j++)
        {
            if ((n & (1 << j)) != 0)
            {
                result = 1 + (i << 3) + j;
            }
        }
    }

    return 256 - result;
  }
}
