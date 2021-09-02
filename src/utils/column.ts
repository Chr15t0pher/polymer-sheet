export function transNumToColumnIdx(num: number) {
  const charCodeA = 'A'.charCodeAt(0)
  const charCodeZ = 'Z'.charCodeAt(0)
  const scale = charCodeZ - charCodeA + 1

  let s = ''
  while(num >= 0) {
    s = String.fromCharCode(num % scale + charCodeA) + s
    num = Math.floor(num / scale) - 1
  }
  return s
}
