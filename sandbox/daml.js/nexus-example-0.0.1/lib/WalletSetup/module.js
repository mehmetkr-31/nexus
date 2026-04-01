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

var MultisigWallet = require("../MultisigWallet/module");

exports.CancelFactory = {
	decoder: damlTypes.lazyMemo(() => jtv.object({})),
	encode: (__typed__) => ({}),
};

exports.Finalize = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({ acceptors: damlTypes.List(damlTypes.Party).decoder }),
	),
	encode: (__typed__) => ({
		acceptors: damlTypes.List(damlTypes.Party).encode(__typed__.acceptors),
	}),
};

exports.WalletFactory = damlTypes.assembleTemplate({
	templateId: "#nexus-example:WalletSetup:WalletFactory",
	templateIdWithPackageId:
		"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e:WalletSetup:WalletFactory",
	keyDecoder: damlTypes.lazyMemo(() => jtv.constant(undefined)),
	keyEncode: () => {
		throw "EncodeError";
	},
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			initiator: damlTypes.Party.decoder,
			walletId: damlTypes.Text.decoder,
			allOwners: damlTypes.List(damlTypes.Party).decoder,
			threshold: damlTypes.Int.decoder,
			custodian: damlTypes.Party.decoder,
		}),
	),
	encode: (__typed__) => ({
		initiator: damlTypes.Party.encode(__typed__.initiator),
		walletId: damlTypes.Text.encode(__typed__.walletId),
		allOwners: damlTypes.List(damlTypes.Party).encode(__typed__.allOwners),
		threshold: damlTypes.Int.encode(__typed__.threshold),
		custodian: damlTypes.Party.encode(__typed__.custodian),
	}),
	Archive: {
		template: () => exports.WalletFactory,
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
	CancelFactory: {
		template: () => exports.WalletFactory,
		choiceName: "CancelFactory",
		argumentDecoder: damlTypes.lazyMemo(() => exports.CancelFactory.decoder),
		argumentEncode: (__typed__) => exports.CancelFactory.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.Unit.decoder),
		resultEncode: (__typed__) => damlTypes.Unit.encode(__typed__),
	},
	Finalize: {
		template: () => exports.WalletFactory,
		choiceName: "Finalize",
		argumentDecoder: damlTypes.lazyMemo(() => exports.Finalize.decoder),
		argumentEncode: (__typed__) => exports.Finalize.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(
			() => damlTypes.ContractId(MultisigWallet.MultisigWallet).decoder,
		),
		resultEncode: (__typed__) =>
			damlTypes.ContractId(MultisigWallet.MultisigWallet).encode(__typed__),
	},
});

damlTypes.registerTemplate(exports.WalletFactory, [
	"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e",
	"#nexus-example",
]);

exports.RetractAcceptance = {
	decoder: damlTypes.lazyMemo(() => jtv.object({})),
	encode: (__typed__) => ({}),
};

exports.WalletAcceptance = damlTypes.assembleTemplate({
	templateId: "#nexus-example:WalletSetup:WalletAcceptance",
	templateIdWithPackageId:
		"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e:WalletSetup:WalletAcceptance",
	keyDecoder: damlTypes.lazyMemo(() => jtv.constant(undefined)),
	keyEncode: () => {
		throw "EncodeError";
	},
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			walletId: damlTypes.Text.decoder,
			owner: damlTypes.Party.decoder,
			initiator: damlTypes.Party.decoder,
			allOwners: damlTypes.List(damlTypes.Party).decoder,
			threshold: damlTypes.Int.decoder,
			custodian: damlTypes.Party.decoder,
		}),
	),
	encode: (__typed__) => ({
		walletId: damlTypes.Text.encode(__typed__.walletId),
		owner: damlTypes.Party.encode(__typed__.owner),
		initiator: damlTypes.Party.encode(__typed__.initiator),
		allOwners: damlTypes.List(damlTypes.Party).encode(__typed__.allOwners),
		threshold: damlTypes.Int.encode(__typed__.threshold),
		custodian: damlTypes.Party.encode(__typed__.custodian),
	}),
	RetractAcceptance: {
		template: () => exports.WalletAcceptance,
		choiceName: "RetractAcceptance",
		argumentDecoder: damlTypes.lazyMemo(() => exports.RetractAcceptance.decoder),
		argumentEncode: (__typed__) => exports.RetractAcceptance.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.Unit.decoder),
		resultEncode: (__typed__) => damlTypes.Unit.encode(__typed__),
	},
	Archive: {
		template: () => exports.WalletAcceptance,
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

damlTypes.registerTemplate(exports.WalletAcceptance, [
	"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e",
	"#nexus-example",
]);

exports.RetractInvitation = {
	decoder: damlTypes.lazyMemo(() => jtv.object({})),
	encode: (__typed__) => ({}),
};

exports.DeclineInvitation = {
	decoder: damlTypes.lazyMemo(() => jtv.object({})),
	encode: (__typed__) => ({}),
};

exports.AcceptInvitation = {
	decoder: damlTypes.lazyMemo(() => jtv.object({})),
	encode: (__typed__) => ({}),
};

exports.WalletInvitation = damlTypes.assembleTemplate({
	templateId: "#nexus-example:WalletSetup:WalletInvitation",
	templateIdWithPackageId:
		"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e:WalletSetup:WalletInvitation",
	keyDecoder: damlTypes.lazyMemo(() => jtv.constant(undefined)),
	keyEncode: () => {
		throw "EncodeError";
	},
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			initiator: damlTypes.Party.decoder,
			invitee: damlTypes.Party.decoder,
			walletId: damlTypes.Text.decoder,
			allOwners: damlTypes.List(damlTypes.Party).decoder,
			threshold: damlTypes.Int.decoder,
			custodian: damlTypes.Party.decoder,
		}),
	),
	encode: (__typed__) => ({
		initiator: damlTypes.Party.encode(__typed__.initiator),
		invitee: damlTypes.Party.encode(__typed__.invitee),
		walletId: damlTypes.Text.encode(__typed__.walletId),
		allOwners: damlTypes.List(damlTypes.Party).encode(__typed__.allOwners),
		threshold: damlTypes.Int.encode(__typed__.threshold),
		custodian: damlTypes.Party.encode(__typed__.custodian),
	}),
	AcceptInvitation: {
		template: () => exports.WalletInvitation,
		choiceName: "AcceptInvitation",
		argumentDecoder: damlTypes.lazyMemo(() => exports.AcceptInvitation.decoder),
		argumentEncode: (__typed__) => exports.AcceptInvitation.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.ContractId(exports.WalletAcceptance).decoder),
		resultEncode: (__typed__) => damlTypes.ContractId(exports.WalletAcceptance).encode(__typed__),
	},
	DeclineInvitation: {
		template: () => exports.WalletInvitation,
		choiceName: "DeclineInvitation",
		argumentDecoder: damlTypes.lazyMemo(() => exports.DeclineInvitation.decoder),
		argumentEncode: (__typed__) => exports.DeclineInvitation.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.Unit.decoder),
		resultEncode: (__typed__) => damlTypes.Unit.encode(__typed__),
	},
	RetractInvitation: {
		template: () => exports.WalletInvitation,
		choiceName: "RetractInvitation",
		argumentDecoder: damlTypes.lazyMemo(() => exports.RetractInvitation.decoder),
		argumentEncode: (__typed__) => exports.RetractInvitation.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.Unit.decoder),
		resultEncode: (__typed__) => damlTypes.Unit.encode(__typed__),
	},
	Archive: {
		template: () => exports.WalletInvitation,
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

damlTypes.registerTemplate(exports.WalletInvitation, [
	"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e",
	"#nexus-example",
]);
