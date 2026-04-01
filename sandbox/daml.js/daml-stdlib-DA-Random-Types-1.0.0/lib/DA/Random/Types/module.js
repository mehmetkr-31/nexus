/* eslint-disable-next-line no-unused-vars */
function __export(m) {
	/* eslint-disable-next-line no-prototype-builtins */
	for (var p in m) if (!Object.hasOwn(exports, p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable-next-line no-unused-vars */
var jtv = require("@mojotech/json-type-validation");
/* eslint-disable-next-line no-unused-vars */
var damlTypes = require("@daml/types");

exports.Minstd = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.oneOf(jtv.object({ tag: jtv.constant("Minstd"), value: damlTypes.Int.decoder })),
	),
	encode: (__typed__) => {
		switch (__typed__.tag) {
			case "Minstd":
				return { tag: __typed__.tag, value: damlTypes.Int.encode(__typed__.value) };
			default:
				throw (
					"unrecognized type tag: " + __typed__.tag + " while serializing a value of type Minstd"
				);
		}
	},
};
