import readline from "readline";

const rl = readline.createInterface(process.stdin, process.stdout);

rl.question("Type!", (answer) => {
  console.log("Got answer: ", answer);
});
