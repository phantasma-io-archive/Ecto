export function hexToByteArray(hexBytes: string) {
  const res = [hexBytes.length / 2];
  for (let i = 0; i < hexBytes.length; i += 2) {
    const hexdig = hexBytes.substr(i, 2);
    if (hexdig == "") {
      res.push(0);
    } else res.push(parseInt(hexdig, 16));
  }
  return res;
}

export function byteArrayToHex(arr: ArrayBuffer | ArrayLike<number>): string {
  if (typeof arr !== "object") {
    throw new Error(`ba2hex expects an array.Input was ${arr}`);
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

export function reverseHex(hex: string): string {
  let out = "";
  for (let i = hex.length - 2; i >= 0; i -= 2) {
    out += hex.substr(i, 2);
  }
  return out;
}
