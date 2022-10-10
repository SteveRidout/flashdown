**Still working on the V0.1 and not really ready to share yet. That said, if this project sounds interesting to you, feel free to star/watch the repo and check back in a couple of weeks.**

## Flashdown: A command line spaced repetition app using a plain text markup language

Advantages:

- A readable plain text file containing all your notes (.flashdown or .fd)
- A companion plain text file containing your history of studying flashcards based on the notes (.fdr)
- The file format is SRS algorithm agnostic (the Flashdown app uses a SM2-ish algorithm)
- The files are very transparent and easy to read, making it easy for others to manipulate them either manually or via their own scripts and apps

Disadvantages / Doubts:

- Is it good to encourage users to view the notes file in between study sessions? Does seeing the flashcards which are meant to be scheduled for the future mess up the intent of the SRS algorithm?
- Repeating the whole front of each card within the practice record file seems redundant and not ideal from a disk space point of view
- Processing the entire history is inefficient compared to storing the spaced repetition data within a SQL DB with indicies
- Potential for file conflicts if multiple programs/editors change the same file simultaneously

# Personal motivations

Combines a bunch of challenges:

- Text based markup file: interesting constraint and makes it very low friction for others to hack on
- Command line app:
  - much smaller in scope than a full stack web app. I can afford to take care to write polished code for this in a reasonable amount of time.
  - Interesting UX challenge to work within the constraints of a CLI
- Open source: an interesting challenge to start a project with the explicit goal of attracting contributors. I've open sourced stuff before but just tiny things which aren't particularly
- SRS is a recurring topic on HN. A bunch of hacker types either build their own or think about it. I think that providing a really simple to understand foundation could be attractive to others who might want to customize it for their purposes
