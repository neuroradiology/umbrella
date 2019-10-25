import { map, range2d } from "@thi.ng/transducers";

/**
 * Yields 2D grid coordinates in the order of interleaved columns with
 * configurable `step` size (default: 2). I.e. returns columns in this
 * order:
 *
 * - 0, step, 2 * step, 3 * step...
 * - 1, 2 * step + 1, 3 * step + 1...
 * - etc.
 *
 * @see interleaveRows2d
 *
 * @param cols
 * @param rows
 * @param step
 */
export function* interleaveColumns2d(cols: number, rows = cols, step = 2) {
    for (let j = 0; j < step; j++) {
        yield* map((p) => [p[1], p[0]], range2d(0, rows, j, cols, 1, step));
    }
}

/**
 * Similar to `interleaveColumns2d`, but yields 2D grid coordinates in
 * the order of interleaved rows with configurable `step` size (default:
 * 2). I.e. returns rows in this order:
 *
 * - 0, step, 2 * step, 3 * step...
 * - 1, 2 * step + 1, 3 * step + 1...
 * - etc.
 *
 * @see interleaveColumns2d
 *
 * @param cols
 * @param rows
 * @param step
 */
export function* interleaveRows2d(cols: number, rows = cols, step = 2) {
    for (let j = 0; j < step; j++) {
        yield* range2d(0, cols, j, rows, 1, step);
    }
}
