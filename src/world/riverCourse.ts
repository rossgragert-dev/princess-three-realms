// v0.4c: the Shimmering River's shape and race course (tile units), shared by the map builder, the race and the tests.
import type { Ring } from './race';

/** Centre line of the river, headwaters (west) to lagoon (east). Water is painted within ~3 tiles of it. */
const centre: [number, number][] = [[4, 13], [12, 13], [16, 9], [22, 8], [28, 12], [32, 17], [38, 18], [44, 13]];

/** Eight checkpoint rings following the current. The friendly race uses the first six. */
const rings: Ring[] = [
  { x: 11.5, y: 13.5 }, { x: 14.5, y: 11.5 }, { x: 19.5, y: 9 }, { x: 25.5, y: 10 }, { x: 30.5, y: 14.5 }, { x: 35.5, y: 17.5 }, { x: 41.5, y: 15.5 }, { x: 44.5, y: 13.5 }
];

export const RIVER_COURSE = { centre, rings };
