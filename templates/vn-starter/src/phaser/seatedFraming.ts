// Director-calibrated top-center placements on the existing 1280×720 artwork stage.
export const seatedFraming = {
  "cafe-night-dining": { x: 520, y: 115, height: 620, tableMask: 525 / 720 },
  "cafe-night-table-standing": { x: 720, y: 10, height: 800, tableMask: 525 / 720 },
  "cafe-night-counter-standing": { x: 1000, y: 20, height: 760, tableMask: 546 / 720 },
  "cafe-night-counter-working": { x: 1000, y: 20, height: 620, tableMask: 546 / 720 },
  "cafe-night-door-standing": { x: 975, y: 70, height: 610, tableMask: 0 },
  "campus-night-path-standing": { x: 860, y: 90, height: 590, tableMask: 0 },
  "print-shop-counter-standing": { x: 850, y: 20, height: 840, tableMask: 548 / 941 },
  "workroom-rain-floor-standing": { x: 1030, y: 100, height: 740, tableMask: 718 / 941 },
  "workroom-rain-standing": { x: 850, y: 20, height: 840, tableMask: 718 / 941 },
  "advising-office-standing": { x: 738, y: 72, height: 950, tableMask: 0 },
  "advising-office-departing": { x: 860, y: 35, height: 1020, tableMask: 0 },
  "sound-room-leaning": { x: 765, y: 76, height: 880, tableMask: 0 },
  "sound-room-standing": { x: 955, y: 20, height: 900, tableMask: 0 },
  "library-path-waiting": { x: 1045, y: 280, height: 140, tableMask: 0 },

  "great-wall-bench-seated": { x: 770, y: 270, height: 440, tableMask: 0 },
  "small-table-seated": { x: 640, y: 70, height: 1040, tableMask: 0.685 },
  "volunteer-meeting-seated": { x: 640, y: 70, height: 1040, tableMask: 0.71 },
  "volunteer-meeting-standing": { x: 850, y: 20, height: 840, tableMask: 0.71 },
  "library-table-seated": { x: 640, y: 0, height: 720, tableMask: 550 / 720 },
  "advising-desk-seated": { x: 640, y: 74, height: 1040, tableMask: 0.724 },
  "dining-table-seated": { x: 640, y: 70, height: 1040, tableMask: 0.74 },
  "hutong-table-across": { x: 812, y: 20, height: 740, tableMask: 0.775 },
  "courtyard-bench-seated": { x: 770, y: 57, height: 600, tableMask: 0 },
  "dorm-bed-seated": { x: 889.3333333333334, y: 29, height: 445, tableMask: 0 },
} as const;

// Trace only the near metal rail in the approved dorm image, in scene coordinates.
// The openings deliberately remain transparent; the mask never paints replacement rail pixels.
export const dormRailPath =
  "M 532 397 L 1069 430 Q 1120 432 1125 476 L 1125 541 L 1115 540 L 1115 477 Q 1113 444 1068 441 L 532 407 Z " +
  "M 622 410 L 632 411 L 632 476 L 622 475 Z " +
  "M 725 417 L 735 418 L 735 490 L 725 489 Z " +
  "M 840 424 L 851 425 L 851 506 L 840 505 Z " +
  "M 974 433 L 985 434 L 985 524 L 974 523 Z";
