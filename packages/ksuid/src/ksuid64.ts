import { AKSUID } from "./aksuid";
import type { KSUIDOpts } from "./api";

export class KSUID64 extends AKSUID {
    constructor(opts?: Partial<KSUIDOpts>) {
        super(8, {
            epoch: 1_600_000_000_000,
            bytes: 12,
            ...opts,
        });
    }

    timeOnlyBinary(epoch = Date.now()) {
        const buf = new Uint8Array(this.size);
        const t = this.ensureTime(epoch - this.epoch);
        const h = (t / 0x1_0000_0000) >>> 0;
        const l = (t & 0xffff_ffff) >>> 0;
        buf.set([
            h >>> 24,
            (h >> 16) & 0xff,
            (h >> 8) & 0xff,
            h & 0xff,
            l >>> 24,
            (l >> 16) & 0xff,
            (l >> 8) & 0xff,
            l & 0xff,
        ]);
        return buf;
    }

    parse(id: string) {
        const buf = new Uint8Array(this.size);
        this.base.decodeBytes(id, buf);
        const h =
            ((buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3]) >>> 0;
        const l =
            ((buf[4] << 24) | (buf[5] << 16) | (buf[6] << 8) | buf[7]) >>> 0;
        const t = h * 0x1_0000_0000 + l;
        return {
            epoch: t + this.epoch,
            id: buf.slice(8),
        };
    }
}

/**
 * Creates and returns a new 64bit epoch KSUID instance (w/ millisecond time
 * precision).
 *
 * @param opts
 */
export const defKSUID64 = (opts?: Partial<KSUIDOpts>): KSUID64 =>
    new KSUID64(opts);