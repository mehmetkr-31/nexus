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

exports.RelTime = {
	decoder: damlTypes.lazyMemo(() => jtv.object({ microseconds: damlTypes.Int.decoder })),
	encode: (__typed__) => ({
		microseconds: damlTypes.Int.encode(__typed__.microseconds),
	}),
};
