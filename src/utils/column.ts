export function transNumToColumnIdx(num: number) {
  const char_A = 'A'.charCodeAt(0)
  const char_Z = 'Z'.charCodeAt(0)
  const scale = char_Z - char_A + 1

  let s = ''
  while(num >= 0) {
    s = String.fromCharCode(num % scale + char_A) + s
    num = Math.floor(num / scale) - 1
  }
  return s
}