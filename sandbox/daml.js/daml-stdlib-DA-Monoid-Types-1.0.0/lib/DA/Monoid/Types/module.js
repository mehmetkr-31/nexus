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

exports.All = {
	decoder: damlTypes.lazyMemo(() => jtv.object({ getAll: damlTypes.Bool.decoder })),
	encode: (__typed__) => ({
		getAll: damlTypes.Bool.encode(__typed__.getAll),
	}),
};

exports.Any = {
	decoder: damlTypes.lazyMemo(() => jtv.object({ getAny: damlTypes.Bool.decoder })),
	encode: (__typed__) => ({
		getAny: damlTypes.Bool.encode(__typed__.getAny),
	}),
};

exports.Sum = (a) => ({
	decoder: damlTypes.lazyMemo(() => jtv.object({ unpack: a.decoder })),
	encode: (__typed__) => ({
		unpack: a.encode(__typed__.unpack),
	}),
});

exports.Product = (a) => ({
	decoder: damlTypes.lazyMemo(() => jtv.object({ unpack: a.decoder })),
	encode: (__typed__) => ({
		unpack: a.encode(__typed__.unpack),
	}),
});
