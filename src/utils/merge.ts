export default function merge<T, U extends T>(json1: U, json2: T){
  const resultJson = Object.create(null)
  for (const attr1 in json1) {
    resultJson[attr1] = json1[attr1]
  }

  for (const attr2 in json2) {
    if (json2[attr2] === undefined) {
      continue
    }
    resultJson[attr2] = json2[attr2]
  }

  return resultJson
}
