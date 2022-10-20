# What is Flashdown?

Flashdown is an interactive Node.js flashcard app with a CLI (command line interface) which stores all its data in human readable and editable plain text files.

## WARNING: Alpha version

This is new software which hasn't been tested by many people yet. Use at your own risk!

That said, I'd love for you to try it out and please [open an issue on GitHub](https://github.com/SteveRidout/flashdown/issues) if you come across any problems!

## Screenshots

![Home page screenshot](https://github.com/SteveRidout/flashdown/blob/master/docs/images/screenshotHome.png)

![In session screenshot](https://github.com/SteveRidout/flashdown/blob/master/docs/images/screenshotSession.png)

## How to use

You will need Node.js (only tested on version 16.13.1 for now) installed on your system.

To install Flashdown:

```sh
npm install -g flashdown
```

To run Flashdown:

```sh
npx flashdown
```

## How to develop

In one terminal, run:

```sh
npm run dev
```

This will watch the source files and rebuild the app upon any changes.

In a second terminal, run the app:

```sh
node dist/flashdown.js
```

Optionally, in a third terminal, view updates to the `debugLog.txt` file. This is used to output debugging info while the app is running, which is not convenient to do using `console.log()` because Flashdown regularly clears the contents of the terminal it runs in.

```sh
tail -f debugLog.txt
```

## Flashdown is a spaced repetition flashcard app, what is that exactly?

It's a digital version of the physical flashcards you may have used to study a bunch of facts. The idea is to look at one side of the card, which may be a question like: "How old is the Earth?" and then try to guess the answer on the back, in this case "4.5 billion years". Within a Flashdown (.fd) file you'd represent simply in just a single line:

```fd
How old is the Earth?: 4.5 billion years
```

Another type of card may have a word on one side, for example "Epistemology", and on the back would be the definition "the study of knowledge acquisition", which again in Flashdown would look like this:

```fd
Epistemology: the study of knowledge acquisition
```

Yet another use is for language learning in which case you might put the same word in different languages on each side of the card, for example:

```fd
Hola: Hello
```

One way in which apps like Flashdown improve upon physical flashcards is in their use of a scheduling algorithm. Basically, after being shown the flip side of a card you are asked whether you remembered the answer. If you self-report having remembered the information, then this card will be scheduled for review some time X days in the future. If you report having _not remembered_ the information, then the card will be repeated within your current practice session, and then will be scheduled for a time _less than_ X days in the future (i.e. less than the time you'd wait had you remembered it correctly). Each time you remember a fact correctly, it will be scheduled at progressively longer and longer time intervals into the future. These intervals may start at 1 day and can end up being over a year after you've shown that you can remember it accurately a few times. This way, you won't waste too much time studying facts which you find very easy, and you can optimize your time by focussing more on the things which you are struggling with. (See also: [Forgetting curve](https://en.wikipedia.org/wiki/Forgetting_curve))

## The Flashdown (.fd) plain text file format

All your flashcards are specified in human readable plain text files which make them easy to review and edit using your favorite text editor. The use of a simple plain text file format also makes it simple to use the same files with your own scripts or apps.

See [/exampleFlashcards](/exampleFlashcards) for some example .fd files. The format is very simple and is illustrated below:

```fd
# Topic header

front of card A: back of card A
  note attached to card A which is indented by 2 spaces and will be shown after the flip side of the flashcard is revealed while practicing
```

In practice sessions you will study the card in both directions: front to back and back to front.

For flashcards containing definitions of terms, put the term to be defined on the front of the card, and the definition (typically longer) on the back of the card. The front of the card will be used as a reference key to link to your practice records. If it changes then the link to your practice records for that card will be broken, effectively resetting your progress. (I could look into ways to fix this problem in future releases)

You can install language support to enable syntax highlighting of your Flashdown (.fd) files in Visual Studio Code. See instructions in this repo: https://github.com/SteveRidout/flashdown-language-support

## The Flashdown practice record (.fdr) plain text file format

The .fdr file extension stands for Flashdown practice Record, and these files contain a chronological record of each practice session, with a list of card you have practiced along with the score representing how well you remembered the information (1 = didn't remember, 2 = just about remembered, 3 = remembered, 4 = remembered well). Here's an example:

```fd
# 2022-10-17 20:14

Godwin's law, b: 4
Linus's law, b: 4
Goodhart's law, f: 3

# 2022-10-17 20:16

Sunk Cost Fallacy (aka Escalation of Commitment), b: 4
Declinism, f: 4
Outgroup Homogeneity Bias, b: 4
Placebo Effect, f: 4
```

There are two types of lines (ignoring empty lines which are just for readability and have no other meaning):

- Lines starting with `#` contain the datetime when you started the practice session
- The following lines are formatted like this: `<front of card>, <direction>: <score>`, where a `direction` of `f` means that you are shown the front of the card and need to recall the back, and `b` is the reverse, meaning that you are shown the back of the card and need to recall the front.

The file format is SRS algorithm agnostic. Since it stores the entire historical record you could run any spaced repetition algorithm over it, as long as the algorithm takes for input a list of (time, score) pairs for each card.

## Why create an interactive terminal app in 2022?

- Keeps UI code complexity low, allowing for faster development and a simpler code base
- For now this is intended to appeal to other hackers who spend a lot of their time on the command line
- Flashcard apps work fine with keyboard input
- I liked the idea of working within a different set of constraints (compared to web development)
- There's something about the CLI aesthetic which appeals in a retro way

(That said, I wouldn't rule out creating a web version of this later)

## Notable missing features

Here are some features I'd like to see but which Flashdown doesn't do (yet?):

- Image support, including occlusion (e.g. show a diagram where certain labels are blanked out and you have to guess what they are). (This would be restricted only to terminal apps with the required image support)
- Multiple choice challenges as alternative to the current self-graded and typing challenges (perhaps only in the early stages of learning a card since it would be easier)
