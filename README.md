# What is Flashdown?

Flashdown is an interactive NodeJS flashcard app with a CLI (command line interface) which uses a custom markup language to specify flashcards in human readable plain text files.

## WARNING: Alpha version

This is new software which hasn't been tested by anyone except for me on my macOS machine. Use at your own risk!

That said, I'd love for you to try it out and please [open an issue on GitHub](https://github.com/SteveRidout/flashdown/issues) if you come across any problems!

## Screenshots

![Home page screenshot](/docs/images/screenshotHome.png)

![In session screenshot](/docs/images/screenshotSession.png)

## How to use

You will need NodeJS (only tested on version 16.13.1 for now) installed on your system.

To install and run:

```sh
npm install flashdown
flashdown
```

## Visual Studio Code language support

Install language support to enable syntax highlighting of your Flashdown (.fd) files in Visual Studio Code, see instructions in this repo: https://github.com/SteveRidout/flashdown-language-support

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

One way in which some apps improve upon physical flashcards is in their use of a scheduling algorithm. Basically, after being shown the flip side of a card you are asked whether you remembered the answer. If you self-report having remembered the information, then this card will be scheduled for review some time X days in the future. If you report having _not remembered_ the information, then the card will be repeated within your current practice session, and then will be scheduled for a time _less than_ X days in the future (i.e. less than the time you'd wait had you remembered it correctly). Each time you remember a fact correctly, it will be scheduled at progressively longer and longer time intervals into the future. These intervals may start at 1 day and can end up being over a year after you've shown that you can remember it accurately a few times. This way, you won't waste too much time studying facts which you find very easy, and you can optimize your time by focussing more on the things which you are struggling with. (See also: [Forgetting curve](https://en.wikipedia.org/wiki/Forgetting_curve))

## Why use a plain text markup language (.fd) for flashcards?

.fd stands for Flashdown

Advantages:

- All your flashcards are specified in human readable plain text files which are very easy to review and edit using your favorite text editor
- You can combine flashcard specification with readable notes, allowing thorough explanation of topics to be combined with flashcards within the same file
- It's very easy to create your own scripts or apps which write or read to these files

Disadvantages:

- It may not be a good idea to encourage users to view the notes file in between study sessions since it messes with the intent of the SRS algorithm, which assumes the user hasn't encountered the data in between practices.
- Plain text is not so useful if you make heavy use of other media types such as images, video, and audio. (Right now none of these other media types are supported by Flashdown but they might be in future)

## Why use a plain text file format (.fdr) for recording your personal progress?

The .fdr file extension stands for Flashdown practice Record, and these files contain a chronological record of each card you have practiced along with the time and a score representing how well you remembered the information.

Advantages:

- The file format is SRS algorithm agnostic. Since it stores the entire historical record you could run any spaced repetition algorithm over it, as long as the algorithm takes for input a list of (time, score) pairs for each card. (You could imagine richer data, e.g. whether the practice was multiple choice / free text entry / or a self reported remembering score. For the sake of simplicity we just store a single integer score from 1 to 4 right now.)
- It can be used to pull out statistics which users may enjoy such as practice history.

Disadvantages:

- Repeating the whole front of each card within the practice record file seems redundant and not ideal from a disk space point of view
- If a user edits the front of a card within the .fd file but not the corresponding .fdr records, then Flashdown will not connect the two and will effectively lose the practice history for that card
- Processing the entire history is inefficient compared to storing the spaced repetition data within a SQL DB with indicies
- Potential for file conflicts if multiple programs/editors change the same file simultaneously

## Why create an interactive terminal app in 2022?

A few reasons:

- Keeps UI code complexity low, allowing for faster development and a simpler code base
- For now this is intended to appeal to other hackers who spend a lot of their time on the command line anyway
- Flashcard apps work just fine with keyboard input
- I liked the idea of working within a different set of constraints (compared to web development)
- I thought it would be fun to play with an anachronistic retro aesthetic

(That said, I wouldn't rule out creating a web version of this later if there's interest)

## Key missing features

Here are some features I'd like to see but which don't exist yet:

- Image support, including occlusion (e.g. show a diagram where certain labels are blanked out and you have to guess what they are). (This would be restricted only to terminal apps with the required image support)
- Multiple choice challenges as alternative to the current self-graded and typing challenges (perhaps only in the early stages of learning a card since it would be easier)
