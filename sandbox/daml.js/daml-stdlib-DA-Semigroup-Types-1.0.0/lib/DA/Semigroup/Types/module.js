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

exports.Min = (a) => ({
	decoder: damlTypes.lazyMemo(() => jtv.object({ unpack: a.decoder })),
	encode: (__typed__) => ({
		unpack: a.encode(__typed__.unpack),
	}),
});

exports.Max = (a) => ({
	decoder: damlTypes.lazyMemo(() => jtv.object({ unpack: a.decoder })),
	encode: (__typed__) => ({
		unpack: a.encode(__typed__.unpack),
	}),
});
