import * as chalk from "chalk";

// Testing interactive terminal app stuff, TTY (teletypewriter) stdin / stdout

let frameIndex = 0;

const imagesOld = {
  front: `
                ** NEW CARD **
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ Topic: Word definitions                  ┃
  ┃                                          ┃
  ┃                                          ┃
  ┃ Epistemology: _________________________  ┃
  ┃ _______________________________________  ┃
  ┃ _______________________________________  ┃
  ┃ _______________________________________  ┃
  ┃                                          ┃
  ┃                                          ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  `,
  frontTilted: `
            _/┃
          _/  ┃
         ┃#   ┃
         ┃    ┃
         ┃    ┃
         ┃### ┃
         ┃##  ┃
         ┃    ┃
         ┃    ┃
         ┃    ┃
         ┃_   ┃
           \\_ ┃
             \\┃
  `,
  backTilted: `
         ┃\\_
         ┃# \\_
         ┃    ┃
         ┃    ┃
         ┃    ┃
         ┃### ┃
         ┃##  ┃
         ┃    ┃
         ┃    ┃
         ┃    ┃
         ┃   _┃
         ┃ _/
         ┃/ 
  `,
  back: `

  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ Topic: Word definitions                  ┃
  ┃                                          ┃
  ┃                                          ┃
  ┃ Epistemology: The study of knowledge     ┃
  ┃ acquisition (philosophy)                 ┃
  ┃                                          ┃
  ┃                                          ┃
  ┃                                          ┃
  ┃                                          ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  `,
};

const images = {
  front: `

  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ Topic: Word definitions                  ┃
  ┃                                          ┃
  ┃                                          ┃
  ┃ ____________: The study of knowledge     ┃
  ┃ acquisition (philosophy)                 ┃
  ┃                                          ┃
  ┃                                          ┃
  ┃                                          ┃
  ┃                                          ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  `,
  // frontTilted: `

  //        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  //        ┃ Tpi: or dfiiton            ┃
  //        ┃                            ┃
  //        ┃                            ┃
  //        ┃ ________:Th sud o kowede   ┃
  //        ┃ aqusiio (hiosph)           ┃
  //        ┃                            ┃
  //        ┃                            ┃
  //        ┃                            ┃
  //        ┃                            ┃
  //        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  // `,
  // backTilted: `

  //          ┏━━━━━━━━━━━━━━━━━━━━━━━┓
  //          ┃ Tpc oddfntos          ┃
  //          ┃                       ┃
  //          ┃                       ┃
  //          ┃ Eitmlg:Tesuyo kolde   ┃
  //          ┃ aqiiin(hlspy          ┃
  //          ┃                       ┃
  //          ┃                       ┃
  //          ┃                       ┃
  //          ┃                       ┃
  //          ┗━━━━━━━━━━━━━━━━━━━━━━━┛
  // `,
  frontTilted: `

                   ┏━━━━┓
                   ┃= ==┃
                   ┃=   ┃
                   ┃=   ┃
                   ┃= __┃
                   ┃= ==┃
                   ┃=   ┃
                   ┃=   ┃
                   ┃=   ┃
                   ┃=   ┃
                   ┗━━━━┛
  `,
  backTilted: `

                ┏━━━━━━━━━━━┓
                ┃ = ====    ┃
                ┃           ┃
                ┃           ┃
                ┃ ====== == ┃
                ┃ ======    ┃
                ┃           ┃
                ┃           ┃
                ┃           ┃
                ┃           ┃
                ┗━━━━━━━━━━━┛
  `,
  back: `

  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ Topic: Word definitions                  ┃
  ┃                                          ┃
  ┃                                          ┃
  ┃ Epistemology: The study of knowledge     ┃
  ┃ acquisition (philosophy)                 ┃
  ┃                                          ┃
  ┃                                          ┃
  ┃                                          ┃
  ┃                                          ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  `,
};

/** Duration of each animation frame in ms */
const transitionDuration = 1000 / 14;

/** Duration of showing each card side in ms */
const sideDuration = 3 * 1000;

interface Frame {
  image: keyof typeof images;
  duration: number;
  color: "blue" | "red";
}

const frames: Frame[] = [
  {
    image: "front",
    duration: sideDuration,
    color: "blue",
  },
  {
    image: "frontTilted",
    duration: transitionDuration,
    color: "blue",
  },
  {
    image: "backTilted",
    duration: transitionDuration,
    color: "red",
  },
  {
    image: "back",
    duration: sideDuration,
    color: "red",
  },
  {
    image: "backTilted",
    duration: transitionDuration,
    color: "red",
  },
  {
    image: "frontTilted",
    duration: transitionDuration,
    color: "blue",
  },
];

const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));

const nextFrame = async () => {
  const frame = frames[frameIndex];
  console.clear();

  switch (frame.color) {
    case "blue":
      console.log(chalk.blue(images[frame.image]));
      break;
    case "red":
      console.log(chalk.red(images[frame.image]));
      break;
  }

  frameIndex = (frameIndex + 1) % frames.length;

  await sleep(frame.duration);
  nextFrame();
};

nextFrame();
