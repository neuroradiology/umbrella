import { assert, Fn, Keys } from "@thi.ng/api";
import { juxt } from "@thi.ng/compose";
import {
    center,
    padLeft,
    padRight,
    repeat,
    Stringer,
    wrap,
} from "@thi.ng/strings";
import {
    comp,
    last,
    map,
    max,
    multiplex,
    repeat as $repeat,
    repeatedly,
    scan,
    transduce,
    Transducer,
} from "@thi.ng/transducers";
import type { Align, Column, Row, TableOpts } from "./api";

const PADS: Record<Align, Fn<number, Stringer<string>>> = {
    c: center,
    l: padRight,
    r: padLeft,
};

const SEPS: Record<Align, Stringer<number>> = {
    c: (x) => `:${repeat("-", x)}:`,
    l: (x) => `:${repeat("-", x + 1)}`,
    r: (x) => `${repeat("-", x + 1)}:`,
};

/**
 * Takes an array of column titles, an iterable of `rows` and (optional) table
 * options (e.g. column alignments). Returns string of formatted Markdown table.
 *
 * @remarks
 * Each `row` is a string array. Nullish cells/columns are allowed. Rows
 * can also be empty. By default all columns are left-aligned.
 *
 * @example
 * ```ts
 * markdownTable(
 *   ["ID", "Actor", "Comment"],
 *   [
 *     [1, "Alice"],
 *     [201, "Bob", "(foe)"],
 *     [3003, "Charlie", null],
 *     [44, "Dora", "(recipient)"],
 *   ],
 *   { bold: true, align: ["r", "c", "l"] }
 * );
 *
 * // | **ID** | **Actor** | **Comment** |
 * // |-------:|:---------:|:------------|
 * // |      1 |   Alice   |             |
 * // |    201 |    Bob    | (foe)       |
 * // |   3003 |  Charlie  |             |
 * // |     44 |   Dora    | (recipient) |
 * ```
 *
 * @param header
 * @param rows
 * @param opts
 */
export const table = (
    header: string[],
    rows: Iterable<Row>,
    opts: Partial<TableOpts> = {}
) => {
    const numColumns = header.length;
    const align = opts.align || [...$repeat<Align>("l", numColumns)];
    assert(align.length === numColumns, `invalid/missing column alignments`);
    opts.bold && (header = header.map(wrap("**")));
    const body = [header, ...rows];
    const widths = transduce(
        multiplex(
            ...(<[Transducer<Row, number>]>[
                ...repeatedly(
                    (i) =>
                        comp(
                            map((row: Row) =>
                                row[i] != null ? String(row[i]).length : 0
                            ),
                            scan(max())
                        ),
                    numColumns
                ),
            ])
        ),
        last<number[]>(),
        body
    );
    const pads = widths.map((w, i) => PADS[align![i]](w));
    const colIDs = [...repeatedly((x) => x, numColumns)];
    const result = body.map(
        (row) => colIDs.map((i) => `| ${pads[i](str(row[i]))} `).join("") + "|"
    );
    result.splice(
        1,
        0,
        widths.map((w, i) => `|${SEPS[align![i]](w)}`).join("") + "|"
    );
    return result.join("\n");
};

/**
 * Similar to {@link table}, however accepts rows as objects and looks up column
 * values using given `keys` array.
 *
 * @example
 * ```ts
 * tableKeys(
 *   ["ID", "Actor", "Comment"],
 *   ["id", "name", "hint"],
 *   [
 *       { id: 1, name: "Alice" },
 *       { id: 201, name: "Bob", hint: "(foe)" },
 *       { id: 3003, name: "Charlie" },
 *       { id: 44, name: "Dora", hint: "(recipient)" },
 *   ],
 *   { bold: true, align: ["r", "c", "l"] }
 * )
 *
 * // | **ID** | **Actor** | **Comment** |
 * // |-------:|:---------:|:------------|
 * // |      1 |   Alice   |             |
 * // |    201 |    Bob    | (foe)       |
 * // |   3003 |  Charlie  |             |
 * // |     44 |   Dora    | (recipient) |
 * ```
 *
 * @param headers
 * @param keys
 * @param items
 * @param opts
 */
export const tableKeys = <T>(
    headers: string[],
    keys: Keys<T>[],
    items: Iterable<T>,
    opts?: Partial<TableOpts>
) =>
    table(
        headers,
        map<T, Row>(
            juxt(
                // @ts-ignore
                ...keys.map((k) => (x) => str(x[k]))
            ),
            items
        ),
        opts
    );

const str = (x: Column) => (x != null ? String(x) : "");