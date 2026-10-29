// UPC-A(12桁)は先頭に0を足して13桁(JAN形式)にそろえる
export function normalizeJan(raw) {
  const code = String(raw).replace(/\D/g, "");
  return code.length === 12 ? "0" + code : code;
}

// 8桁・13桁で、チェックデジットが正しいかを確認する
export function isValidJan(code) {
  if (!/^(\d{8}|\d{13})$/.test(code)) return false;

  const digits = code.split("").map(Number);
  const check = digits.pop();

  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const posFromRight = digits.length - 1 - i;
    sum += digits[i] * (posFromRight % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === check;
}
