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

var pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 = require("@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0");

exports.Placeholder = damlTypes.assembleTemplate({
	templateId: "#nexus-example:Main:Placeholder",
	templateIdWithPackageId:
		"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e:Main:Placeholder",
	keyDecoder: damlTypes.lazyMemo(() => jtv.constant(undefined)),
	keyEncode: () => {
		throw "EncodeError";
	},
	decoder: damlTypes.lazyMemo(() => jtv.object({ owner: damlTypes.Party.decoder })),
	encode: (__typed__) => ({
		owner: damlTypes.Party.encode(__typed__.owner),
	}),
	Archive: {
		template: () => exports.Placeholder,
		choiceName: "Archive",
		argumentDecoder: damlTypes.lazyMemo(
			() =>
				pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template
					.Archive.decoder,
		),
		argumentEncode: (__typed__) =>
			pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(
				__typed__,
			),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.Unit.decoder),
		resultEncode: (__typed__) => damlTypes.Unit.encode(__typed__),
	},
});

damlTypes.registerTemplate(exports.Placeholder, [
	"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e",
	"#nexus-example",
]);
