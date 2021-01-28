import type { Vec } from "@thi.ng/vectors";
import type { Color, ColorFactory, ColorType, ReadonlyColor } from "../api";
import { defColor } from "../defcolor";
import { rgbHcy } from "../rgb/rgb-hcy";

export declare class HCY implements ColorType<HCY> {
    buf: Vec;
    offset: number;
    stride: number;
    h: number;
    c: number;
    y: number;
    alpha: number;
    [id: number]: number;
    readonly mode: "hcy";
    readonly length: 4;
    [Symbol.iterator](): Iterator<number, any, undefined>;
    copy(): HCY;
    copyView(): HCY;
    deref(): Color;
    empty(): HCY;
    eqDelta(o: HCY, eps?: number): boolean;
    set(src: ReadonlyColor): this;
    toJSON(): number[];
}

export const hcy = <ColorFactory<HCY>>defColor({
    mode: "hcy",
    channels: {
        h: {},
        c: {},
        y: {},
        alpha: { default: 1 },
    },
    order: <const>["h", "c", "y", "alpha"],
    from: { rgb: rgbHcy },
});
