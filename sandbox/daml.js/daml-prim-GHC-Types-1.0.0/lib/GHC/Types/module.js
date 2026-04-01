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

exports.Ordering = {
	LT: "LT",
	EQ: "EQ",
	GT: "GT",
	keys: ["LT", "EQ", "GT"],
	decoder: damlTypes.lazyMemo(() =>
		jtv.oneOf(
			jtv.constant(exports.Ordering.LT),
			jtv.constant(exports.Ordering.EQ),
			jtv.constant(exports.Ordering.GT),
		),
	),
	encode: (__typed__) => __typed__,
};
