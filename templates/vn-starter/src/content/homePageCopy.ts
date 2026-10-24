export const homePageCopy = {
  title: "Beijing Heartbeat",
  description: "A romantic visual novel for learning Mandarin Chinese.",
  introduction:
    "Live Emma’s story in Beijing. Make choices, build relationships, and learn Chinese through everyday conversations.",
  enterStory: "Enter the story",
  chooseChapter: "Choose a chapter",
  seasonTitle: "Season One",
  chapterAvailability: "Season One · Chapters 1–13 available",
  guestProgress: "Play as a guest · Progress saves on this device",
  localProgress: "Progress saves on this device",
  checkingSession: "Checking session…",
} as const;

// Explicit replay destinations stay independent of the saved chapter used by Enter the story.
export const homeChapters = [
  { id: "chapter-one", label: "Start Chapter 1" },
  { id: "chapter-two", label: "Start Chapter 2" },
  { id: "chapter-three", label: "Start Chapter 3" },
  { id: "chapter-four", label: "Start Chapter 4" },
  { id: "chapter-five", label: "Start Chapter 5" },
  { id: "chapter-six", label: "Start Chapter 6" },
  { id: "chapter-seven", label: "Start Chapter 7" },
  { id: "chapter-eight", label: "Start Chapter 8" },
  { id: "chapter-nine", label: "Start Chapter 9" },
  { id: "chapter-ten", label: "Start Chapter 10" },
  { id: "chapter-eleven", label: "Start Chapter 11" },
  { id: "chapter-twelve", label: "Start Chapter 12" },
  { id: "chapter-thirteen", label: "Start Chapter 13" },
] as const;
