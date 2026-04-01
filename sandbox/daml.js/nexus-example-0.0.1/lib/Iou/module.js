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

var pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4 = require("@daml.js/daml-prim-DA-Types-1.0.0");
var pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 = require("@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0");

exports.Merge = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({ otherCid: damlTypes.ContractId(exports.Iou).decoder }),
	),
	encode: (__typed__) => ({
		otherCid: damlTypes.ContractId(exports.Iou).encode(__typed__.otherCid),
	}),
};

exports.Split = {
	decoder: damlTypes.lazyMemo(() => jtv.object({ splitAmount: damlTypes.Numeric(10).decoder })),
	encode: (__typed__) => ({
		splitAmount: damlTypes.Numeric(10).encode(__typed__.splitAmount),
	}),
};

exports.Transfer = {
	decoder: damlTypes.lazyMemo(() => jtv.object({ newOwner: damlTypes.Party.decoder })),
	encode: (__typed__) => ({
		newOwner: damlTypes.Party.encode(__typed__.newOwner),
	}),
};

exports.Iou = damlTypes.assembleTemplate({
	templateId: "#nexus-example:Iou:Iou",
	templateIdWithPackageId:
		"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e:Iou:Iou",
	keyDecoder: damlTypes.lazyMemo(() => jtv.constant(undefined)),
	keyEncode: () => {
		throw "EncodeError";
	},
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			issuer: damlTypes.Party.decoder,
			owner: damlTypes.Party.decoder,
			amount: damlTypes.Numeric(10).decoder,
			currency: damlTypes.Text.decoder,
			observers: damlTypes.List(damlTypes.Party).decoder,
		}),
	),
	encode: (__typed__) => ({
		issuer: damlTypes.Party.encode(__typed__.issuer),
		owner: damlTypes.Party.encode(__typed__.owner),
		amount: damlTypes.Numeric(10).encode(__typed__.amount),
		currency: damlTypes.Text.encode(__typed__.currency),
		observers: damlTypes.List(damlTypes.Party).encode(__typed__.observers),
	}),
	Transfer: {
		template: () => exports.Iou,
		choiceName: "Transfer",
		argumentDecoder: damlTypes.lazyMemo(() => exports.Transfer.decoder),
		argumentEncode: (__typed__) => exports.Transfer.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.ContractId(exports.Iou).decoder),
		resultEncode: (__typed__) => damlTypes.ContractId(exports.Iou).encode(__typed__),
	},
	Split: {
		template: () => exports.Iou,
		choiceName: "Split",
		argumentDecoder: damlTypes.lazyMemo(() => exports.Split.decoder),
		argumentEncode: (__typed__) => exports.Split.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(
			() =>
				pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Tuple2(
					damlTypes.ContractId(exports.Iou),
					damlTypes.ContractId(exports.Iou),
				).decoder,
		),
		resultEncode: (__typed__) =>
			pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Tuple2(
				damlTypes.ContractId(exports.Iou),
				damlTypes.ContractId(exports.Iou),
			).encode(__typed__),
	},
	Archive: {
		template: () => exports.Iou,
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
	Merge: {
		template: () => exports.Iou,
		choiceName: "Merge",
		argumentDecoder: damlTypes.lazyMemo(() => exports.Merge.decoder),
		argumentEncode: (__typed__) => exports.Merge.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.ContractId(exports.Iou).decoder),
		resultEncode: (__typed__) => damlTypes.ContractId(exports.Iou).encode(__typed__),
	},
});

damlTypes.registerTemplate(exports.Iou, [
	"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e",
	"#nexus-example",
]);
