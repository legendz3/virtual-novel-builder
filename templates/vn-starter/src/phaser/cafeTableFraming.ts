// Director-calibrated 1280×720 placements use top-center anchors; only the far seat is masked.
export const cafeTableFraming = {
  "cafe-table-across": { x: 640, y: -12, height: 1040, tableMask: 0.732 },
  "cafe-table-adjacent": { x: 940, y: -70, height: 1120, tableMask: 0 },
  "cafe-table-room": { x: 980, y: -54, height: 1000, tableMask: 0 },
} as const;
