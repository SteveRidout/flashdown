import * as chalk from "chalk";

// Testing interactive terminal app stuff, TTY (teletypewriter) stdin / stdout

let frameIndex = 0;

let frames = [
  `
.
  `,
  `
-
  `,
  `
'
  `,
];

/** Duration of showing each card side in ms */
const frameDuration = 1000 / 12;

const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));

const nextFrame = async () => {
  const frame = frames[frameIndex];
  console.clear();

  console.log(frame);

  await sleep(frameDuration);
  frameIndex = (frameIndex + 1) % frames.length;
  nextFrame();
};

// nextFrame();

const run = async () => {
  console.clear();
  console.log(`
3
  `);
  await sleep(2000);
  for (const frame of frames) {
    console.clear();
    console.log(frame);
    await sleep(frameDuration);
  }
  console.clear();
  console.log(`
4
  `);
  await sleep(2000);
  for (const frame of frames) {
    console.clear();
    console.log(frame);
    await sleep(frameDuration);
  }
  run();
};

run();
