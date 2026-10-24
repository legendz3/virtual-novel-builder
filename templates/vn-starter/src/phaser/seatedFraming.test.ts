import { expect, it } from "vitest";
import { seatedFraming } from "./seatedFraming";
it("adds the approved small table calibration while preserving every earlier seated preset", () => {
  const {
    "cafe-night-dining": cafeDining,
    "cafe-night-table-standing": cafeStanding,
    "cafe-night-counter-standing": cafeCounter,
    "cafe-night-counter-working": cafeWorking,
    "cafe-night-door-standing": cafeDoor,
    "campus-night-path-standing": campusPath,
    "print-shop-counter-standing": counter,
    "small-table-seated": dinner,
    "great-wall-bench-seated": wall,
    "workroom-rain-standing": rain,
    "workroom-rain-floor-standing": floor,
    "advising-office-standing": office,
    "advising-office-departing": departing,
    "sound-room-leaning": leaning,
    "sound-room-standing": standing,
    "library-path-waiting": waiting,
    ...earlier
  } = seatedFraming;
  expect([cafeDining, cafeStanding, cafeCounter, cafeWorking, cafeDoor, campusPath]).toEqual([
    { x: 520, y: 115, height: 620, tableMask: 525 / 720 },
    { x: 720, y: 10, height: 800, tableMask: 525 / 720 },
    { x: 1000, y: 20, height: 760, tableMask: 546 / 720 },
    { x: 1000, y: 20, height: 620, tableMask: 546 / 720 },
    { x: 975, y: 70, height: 610, tableMask: 0 },
    { x: 860, y: 90, height: 590, tableMask: 0 },
  ]);
  expect([rain, office, departing, leaning, standing, waiting]).toEqual([
    { x: 850, y: 20, height: 840, tableMask: 718 / 941 },
    { x: 738, y: 72, height: 950, tableMask: 0 },
    { x: 860, y: 35, height: 1020, tableMask: 0 },
    { x: 765, y: 76, height: 880, tableMask: 0 },
    { x: 955, y: 20, height: 900, tableMask: 0 },
    { x: 1045, y: 280, height: 140, tableMask: 0 },
  ]);
  expect(counter).toEqual({ x: 850, y: 20, height: 840, tableMask: 548 / 941 });
  expect(floor).toEqual({ x: 1030, y: 100, height: 740, tableMask: 718 / 941 });
  expect(wall).toEqual({ x: 770, y: 270, height: 440, tableMask: 0 });
  expect(dinner).toEqual({ x: 640, y: 70, height: 1040, tableMask: 0.685 });
  expect(earlier).toEqual({
    "volunteer-meeting-seated": { x: 640, y: 70, height: 1040, tableMask: 0.71 },
    "volunteer-meeting-standing": { x: 850, y: 20, height: 840, tableMask: 0.71 },
    "library-table-seated": { x: 640, y: 0, height: 720, tableMask: 550 / 720 },
    "advising-desk-seated": { x: 640, y: 74, height: 1040, tableMask: 0.724 },
    "dining-table-seated": { x: 640, y: 70, height: 1040, tableMask: 0.74 },
    "hutong-table-across": { x: 812, y: 20, height: 740, tableMask: 0.775 },
    "courtyard-bench-seated": { x: 770, y: 57, height: 600, tableMask: 0 },
    "dorm-bed-seated": { x: 889.3333333333334, y: 29, height: 445, tableMask: 0 },
  });
});
