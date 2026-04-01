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

exports.ArithmeticError = {
	decoder: damlTypes.lazyMemo(() => jtv.object({ message: damlTypes.Text.decoder })),
	encode: (__typed__) => ({
		message: damlTypes.Text.encode(__typed__.message),
	}),
};
