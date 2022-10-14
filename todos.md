# TODOs

- Change TextWithCursor to TerminalViewModel (or something) and make it {lines: string[], cursorPosition: {x,y}}
- Change how ~/.flashdown works - look for ALL \*.fd files there, if 1 use that, if > 1 allow user to choose upon starting app OR... instead use ~/.flashdown config file which can point to whichever .fd files you like, which could be on Dropbox for example
- If user has no topics to study, point them to where they can download some online and tell them to copy them to their home directory ~/.flashdown
- Figure out how to package to make it an NPM module
  https://www.tsmean.com/articles/how-to-write-a-typescript-library/
- Strict tsconfig settings
- Allow edit distance of 1
- Allow formatting within card - use bold text
- Reflow text in "file doesn't exist" error message
- Add command line option to show SRS stats
- Animation flare:
  - slide cards to reveal
  - animate progress bar
  - Add animation when number of cards increases in session
