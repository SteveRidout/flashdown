## Flashdown: A markup language for spaced repetition flashcards

Advantages:

- A readable document containing all the notes you intend to study
- A portable format which contains all your notes, and your progress studying them, all in one plain text file
- SRS algorithm agnostic (it supports SM2, I think adding more)
- Text file makes it very frictionless for any hacker to write their own tools for manipulating the

Disadvantages / Doubts:

- Is it good to be able to see all your notes in between study sessions? Does this mess up the SRS algorithm?
- Is the SRS data too messy to include within the text document?
- Processing the entire history is more inefficient than a SQL DB with indices
- Potential for file conflicts if multiple programs/editors change the file simultaneously

# Thoughts on making it an open source CLI

Combines a bunch of challenges

- Text based markup file: interesting constraint and makes it very low friction for others to hack on
- Command line app:
  - much smaller in scope than a full stack web app. I can afford to take care to write polished code for this in a reasonable amount of time.
  - Interesting UX challenge to work within the constraints of a CLI
- Open source: an interesting challenge to start a project with the explicit goal of attracting contributors. I've open sourced stuff before but just tiny things which aren't particularly
- SRS is a recurring topic on HN. A bunch of hacker types either build their own or think about it. I think that providing a really simple to understand foundation could be attractive to others who might want to customize it for their purposes

# What commands could make sense?

flashdown practice
Options:

- max cards
- cards
- topic

flashdown topics list // show list of topics with stats

flashdown intervals // show num cards within different interval ranges + new cards

flashdown upcoming // show graph of upcoming cards schedule, num cards within ranges
// (1 day / week / month / year)

flashdown history // show streak and graph of previous usage

# Start with `flashdown practice`

Order of session:

- Start page, show:
  - Welcome to Flashdown!
  - The flashcard app
  - streak
  - number of new cards / ready to review / scheduled for future
  - Hit SPACE to start session
