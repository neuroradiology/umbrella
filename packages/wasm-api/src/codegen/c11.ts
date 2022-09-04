import { isString } from "@thi.ng/checks/is-string";
import type { ICodeGen, WasmPrim } from "../api.js";
import {
	isPadding,
	isStringSlice,
	prefixLines,
	withIndentation,
} from "./utils.js";

const PRIM_ALIASES = {
	i8: "int8_t",
	u8: "uint8_t",
	i16: "int16_t",
	u16: "uint16_t",
	i32: "int32_t",
	u32: "uint32_t",
	i64: "int64_t",
	u64: "uint64_t",
	f32: "float",
	f64: "double",
};

/**
 * Zig code generator options.
 */
export interface C11Opts {
	/**
	 * Optional prelude
	 */
	pre: string;
	/**
	 * Optional postfix (inserted after the generated code)
	 */
	post: string;
}

/**
 * Zig code generator. Call with options and then pass to {@link generateTypes}
 * (see its docs for further usage).
 *
 * @remarks
 * This codegen generates struct and enum definitions for a {@link TypeColl}
 * given to {@link generateTypes}.
 *
 * @param opts
 */
export const C11 = (opts: Partial<C11Opts> = {}) => {
	const INDENT = "    ";
	const SCOPES: [RegExp, RegExp] = [/\{$/, /\}\)?[;,]?$/];

	const gen: ICodeGen = {
		pre: (opts) => `#pragma once
${opts.debug ? "\n#include <stdalign.h>" : ""}
#include <stddef.h>
#include <stdint.h>${opts.pre ? `\n${opts.pre}` : ""}`,

		post: () => opts.post || "",

		doc: (doc, acc) => {
			acc.push(prefixLines("// ", doc));
		},

		enum: (e, _, acc) => {
			const lines: string[] = [];
			lines.push(`enum {`);
			for (let v of e.values) {
				let line: string;
				if (!isString(v)) {
					v.doc && gen.doc(v.doc, lines);
					line = `${e.name}_${v.name}`;
					if (v.value != null) line += ` = ${v.value}`;
				} else {
					line = v;
				}
				lines.push(line + ",");
			}
			lines.push("};", "");
			acc.push(...withIndentation(lines, INDENT, ...SCOPES));
		},

		struct: (struct, _, acc, opts) => {
			const name = struct.name;
			const res: string[] = [];
			res.push(`typedef struct ${name} ${name};`, `struct ${name} {`);
			const ftypes: Record<string, string> = {};
			let padID = 0;
			for (let f of struct.fields) {
				// autolabel explicit padding fields
				if (isPadding(f)) {
					res.push(`uint8_t __pad${padID++}[${f.pad}];`);
					continue;
				}
				f.doc && gen.doc(f.doc, res);
				const fconst = f.const ? "const " : "";
				let ftype =
					f.type === "string"
						? isStringSlice(opts.stringType)
							? __slice("char", fconst)
							: `${f.const !== false ? "const " : ""}char*`
						: PRIM_ALIASES[<WasmPrim>f.type] || f.type;
				switch (f.tag) {
					case "array":
					case "vec":
						res.push(`${fconst}${ftype} ${f.name}[${f.len}];`);
						ftype = `${ftype}[${f.len}]`;
						break;
					case "slice":
						ftype = __slice(ftype, fconst);
						res.push(`${ftype} ${f.name};`);
						break;
					case "ptr":
						ftype = `${fconst}${ftype}*`;
						res.push(`${ftype} ${f.name};`);
						break;
					case "scalar":
					default:
						res.push(`${ftype} ${f.name};`);
				}
				ftypes[f.name] = ftype;
			}
			res.push("};");

			if (opts.debug) {
				res.push("");
				const fn = (fname: string, body: string) =>
					res.push(
						`size_t __attribute__((used)) ${name}_${fname}() {`,
						`return ${body};`,
						`}`
					);

				fn("align", `alignof(${name})`);
				fn("size", `sizeof(${name})`);

				for (let f of struct.fields) {
					if (isPadding(f)) continue;
					fn(f.name + "_align", `alignof(${ftypes[f.name]})`);
					fn(f.name + "_offset", `offsetof(${name}, ${f.name})`);
					fn(f.name + "_size", `sizeof(${ftypes[f.name]})`);
				}
			}
			res.push("");
			acc.push(...withIndentation(res, INDENT, ...SCOPES));
		},
	};
	return gen;
};

const __slice = (type: string, $const: string) =>
	`struct { ${$const}${type} *ptr; size_t len; }`;