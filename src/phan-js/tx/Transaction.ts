import { eddsa } from "elliptic";
import { ScriptBuilder } from "../vm";
const curve = new eddsa("ed25519");

export class Transaction {
  nexusName: string;
  chainName: string;
  script: string;
  expiration: Date;
  payload: string;

  signatures: Array<string>;

  constructor(
    nexusName: string,
    chainName: string,
    script: string,
    expiration: Date,
    payload: string
  ) {
    this.nexusName = nexusName;
    this.chainName = chainName;
    this.script = script;
    this.expiration = expiration;
    this.payload = payload == null || payload == "" ? "5048572D30" : payload;

    this.signatures = [];
  }

  public sign(privateKey: string) {
    const signature = this.getSign(this.toString(false), privateKey);
    this.signatures.unshift(signature);
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

    let sb = new ScriptBuilder()
      .emitVarString(this.nexusName)
      .emitVarString(this.chainName)
      .emitVarInt(this.script.length / 2)
      .appendHexEncoded(this.script)
      .emitBytes(expirationBytes)
      .emitVarInt(this.payload.length / 2)
      .appendHexEncoded(this.payload);

    if (withSignature) {
      sb.emitVarInt(this.signatures.length);
      this.signatures.forEach((sig) => {
        sb.appendByte(1); // Signature Type
        sb.emitVarInt(sig.length / 2);
        sb.appendHexEncoded(sig);
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
}
