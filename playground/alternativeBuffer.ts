import * as ansiEscapes from "../src/ansiEscapes";

process.stdout.write(ansiEscapes.enableAlternativeBuffer);
console.log("hello, this is an alternative buffer");

setTimeout(() => {
  process.stdout.write(ansiEscapes.disableAlternativeBuffer);
  process.exit();
}, 3000);
