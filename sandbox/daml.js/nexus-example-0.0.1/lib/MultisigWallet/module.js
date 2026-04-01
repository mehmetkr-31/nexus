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

var Iou = require("../Iou/module");

exports.CancelUpdate = {
	decoder: damlTypes.lazyMemo(() => jtv.object({})),
	encode: (__typed__) => ({}),
};

exports.AcceptMembership = {
	decoder: damlTypes.lazyMemo(() => jtv.object({})),
	encode: (__typed__) => ({}),
};

exports.PendingWalletUpdate = damlTypes.assembleTemplate({
	templateId: "#nexus-example:MultisigWallet:PendingWalletUpdate",
	templateIdWithPackageId:
		"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e:MultisigWallet:PendingWalletUpdate",
	keyDecoder: damlTypes.lazyMemo(() => jtv.constant(undefined)),
	keyEncode: () => {
		throw "EncodeError";
	},
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			walletId: damlTypes.Text.decoder,
			existingMembers: damlTypes.List(damlTypes.Party).decoder,
			newOwners: damlTypes.List(damlTypes.Party).decoder,
			newThreshold: damlTypes.Int.decoder,
			custodian: damlTypes.Party.decoder,
			newMember: damlTypes.Party.decoder,
		}),
	),
	encode: (__typed__) => ({
		walletId: damlTypes.Text.encode(__typed__.walletId),
		existingMembers: damlTypes.List(damlTypes.Party).encode(__typed__.existingMembers),
		newOwners: damlTypes.List(damlTypes.Party).encode(__typed__.newOwners),
		newThreshold: damlTypes.Int.encode(__typed__.newThreshold),
		custodian: damlTypes.Party.encode(__typed__.custodian),
		newMember: damlTypes.Party.encode(__typed__.newMember),
	}),
	Archive: {
		template: () => exports.PendingWalletUpdate,
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
	CancelUpdate: {
		template: () => exports.PendingWalletUpdate,
		choiceName: "CancelUpdate",
		argumentDecoder: damlTypes.lazyMemo(() => exports.CancelUpdate.decoder),
		argumentEncode: (__typed__) => exports.CancelUpdate.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.Unit.decoder),
		resultEncode: (__typed__) => damlTypes.Unit.encode(__typed__),
	},
	AcceptMembership: {
		template: () => exports.PendingWalletUpdate,
		choiceName: "AcceptMembership",
		argumentDecoder: damlTypes.lazyMemo(() => exports.AcceptMembership.decoder),
		argumentEncode: (__typed__) => exports.AcceptMembership.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.ContractId(exports.MultisigWallet).decoder),
		resultEncode: (__typed__) => damlTypes.ContractId(exports.MultisigWallet).encode(__typed__),
	},
});

damlTypes.registerTemplate(exports.PendingWalletUpdate, [
	"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e",
	"#nexus-example",
]);

exports.RejectGovernance = {
	decoder: damlTypes.lazyMemo(() => jtv.object({ rejector: damlTypes.Party.decoder })),
	encode: (__typed__) => ({
		rejector: damlTypes.Party.encode(__typed__.rejector),
	}),
};

exports.ExecuteGovernance = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			executor: damlTypes.Party.decoder,
			walletCid: damlTypes.ContractId(exports.MultisigWallet).decoder,
		}),
	),
	encode: (__typed__) => ({
		executor: damlTypes.Party.encode(__typed__.executor),
		walletCid: damlTypes.ContractId(exports.MultisigWallet).encode(__typed__.walletCid),
	}),
};

exports.ApproveGovernance = {
	decoder: damlTypes.lazyMemo(() => jtv.object({ approver: damlTypes.Party.decoder })),
	encode: (__typed__) => ({
		approver: damlTypes.Party.encode(__typed__.approver),
	}),
};

exports.GovernanceProposal = damlTypes.assembleTemplate({
	templateId: "#nexus-example:MultisigWallet:GovernanceProposal",
	templateIdWithPackageId:
		"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e:MultisigWallet:GovernanceProposal",
	keyDecoder: damlTypes.lazyMemo(() => jtv.constant(undefined)),
	keyEncode: () => {
		throw "EncodeError";
	},
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			walletId: damlTypes.Text.decoder,
			walletOwners: damlTypes.List(damlTypes.Party).decoder,
			threshold: damlTypes.Int.decoder,
			custodian: damlTypes.Party.decoder,
			proposer: damlTypes.Party.decoder,
			approvers: damlTypes.List(damlTypes.Party).decoder,
			action: exports.GovernanceAction.decoder,
		}),
	),
	encode: (__typed__) => ({
		walletId: damlTypes.Text.encode(__typed__.walletId),
		walletOwners: damlTypes.List(damlTypes.Party).encode(__typed__.walletOwners),
		threshold: damlTypes.Int.encode(__typed__.threshold),
		custodian: damlTypes.Party.encode(__typed__.custodian),
		proposer: damlTypes.Party.encode(__typed__.proposer),
		approvers: damlTypes.List(damlTypes.Party).encode(__typed__.approvers),
		action: exports.GovernanceAction.encode(__typed__.action),
	}),
	Archive: {
		template: () => exports.GovernanceProposal,
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
	ExecuteGovernance: {
		template: () => exports.GovernanceProposal,
		choiceName: "ExecuteGovernance",
		argumentDecoder: damlTypes.lazyMemo(() => exports.ExecuteGovernance.decoder),
		argumentEncode: (__typed__) => exports.ExecuteGovernance.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(
			() =>
				pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Either(
					damlTypes.ContractId(exports.PendingWalletUpdate),
					damlTypes.ContractId(exports.MultisigWallet),
				).decoder,
		),
		resultEncode: (__typed__) =>
			pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Either(
				damlTypes.ContractId(exports.PendingWalletUpdate),
				damlTypes.ContractId(exports.MultisigWallet),
			).encode(__typed__),
	},
	RejectGovernance: {
		template: () => exports.GovernanceProposal,
		choiceName: "RejectGovernance",
		argumentDecoder: damlTypes.lazyMemo(() => exports.RejectGovernance.decoder),
		argumentEncode: (__typed__) => exports.RejectGovernance.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.Unit.decoder),
		resultEncode: (__typed__) => damlTypes.Unit.encode(__typed__),
	},
	ApproveGovernance: {
		template: () => exports.GovernanceProposal,
		choiceName: "ApproveGovernance",
		argumentDecoder: damlTypes.lazyMemo(() => exports.ApproveGovernance.decoder),
		argumentEncode: (__typed__) => exports.ApproveGovernance.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(
			() => damlTypes.ContractId(exports.GovernanceProposal).decoder,
		),
		resultEncode: (__typed__) => damlTypes.ContractId(exports.GovernanceProposal).encode(__typed__),
	},
});

damlTypes.registerTemplate(exports.GovernanceProposal, [
	"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e",
	"#nexus-example",
]);

exports.Reject = {
	decoder: damlTypes.lazyMemo(() => jtv.object({ rejector: damlTypes.Party.decoder })),
	encode: (__typed__) => ({
		rejector: damlTypes.Party.encode(__typed__.rejector),
	}),
};

exports.Execute = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			executor: damlTypes.Party.decoder,
			walletCid: damlTypes.ContractId(exports.MultisigWallet).decoder,
			iouCid: damlTypes.ContractId(Iou.Iou).decoder,
		}),
	),
	encode: (__typed__) => ({
		executor: damlTypes.Party.encode(__typed__.executor),
		walletCid: damlTypes.ContractId(exports.MultisigWallet).encode(__typed__.walletCid),
		iouCid: damlTypes.ContractId(Iou.Iou).encode(__typed__.iouCid),
	}),
};

exports.Approve = {
	decoder: damlTypes.lazyMemo(() => jtv.object({ approver: damlTypes.Party.decoder })),
	encode: (__typed__) => ({
		approver: damlTypes.Party.encode(__typed__.approver),
	}),
};

exports.TransactionProposal = damlTypes.assembleTemplate({
	templateId: "#nexus-example:MultisigWallet:TransactionProposal",
	templateIdWithPackageId:
		"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e:MultisigWallet:TransactionProposal",
	keyDecoder: damlTypes.lazyMemo(() => jtv.constant(undefined)),
	keyEncode: () => {
		throw "EncodeError";
	},
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			walletId: damlTypes.Text.decoder,
			walletOwners: damlTypes.List(damlTypes.Party).decoder,
			walletThreshold: damlTypes.Int.decoder,
			custodian: damlTypes.Party.decoder,
			proposer: damlTypes.Party.decoder,
			recipient: damlTypes.Party.decoder,
			amount: damlTypes.Numeric(10).decoder,
			currency: damlTypes.Text.decoder,
			description: damlTypes.Text.decoder,
			approvers: damlTypes.List(damlTypes.Party).decoder,
		}),
	),
	encode: (__typed__) => ({
		walletId: damlTypes.Text.encode(__typed__.walletId),
		walletOwners: damlTypes.List(damlTypes.Party).encode(__typed__.walletOwners),
		walletThreshold: damlTypes.Int.encode(__typed__.walletThreshold),
		custodian: damlTypes.Party.encode(__typed__.custodian),
		proposer: damlTypes.Party.encode(__typed__.proposer),
		recipient: damlTypes.Party.encode(__typed__.recipient),
		amount: damlTypes.Numeric(10).encode(__typed__.amount),
		currency: damlTypes.Text.encode(__typed__.currency),
		description: damlTypes.Text.encode(__typed__.description),
		approvers: damlTypes.List(damlTypes.Party).encode(__typed__.approvers),
	}),
	Archive: {
		template: () => exports.TransactionProposal,
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
	Reject: {
		template: () => exports.TransactionProposal,
		choiceName: "Reject",
		argumentDecoder: damlTypes.lazyMemo(() => exports.Reject.decoder),
		argumentEncode: (__typed__) => exports.Reject.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.Unit.decoder),
		resultEncode: (__typed__) => damlTypes.Unit.encode(__typed__),
	},
	Approve: {
		template: () => exports.TransactionProposal,
		choiceName: "Approve",
		argumentDecoder: damlTypes.lazyMemo(() => exports.Approve.decoder),
		argumentEncode: (__typed__) => exports.Approve.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(
			() => damlTypes.ContractId(exports.TransactionProposal).decoder,
		),
		resultEncode: (__typed__) =>
			damlTypes.ContractId(exports.TransactionProposal).encode(__typed__),
	},
	Execute: {
		template: () => exports.TransactionProposal,
		choiceName: "Execute",
		argumentDecoder: damlTypes.lazyMemo(() => exports.Execute.decoder),
		argumentEncode: (__typed__) => exports.Execute.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.ContractId(Iou.Iou).decoder),
		resultEncode: (__typed__) => damlTypes.ContractId(Iou.Iou).encode(__typed__),
	},
});

damlTypes.registerTemplate(exports.TransactionProposal, [
	"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e",
	"#nexus-example",
]);

exports.ExecuteGovernanceDirect = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			executor: damlTypes.Party.decoder,
			action: exports.GovernanceAction.decoder,
			newApproversCount: damlTypes.Int.decoder,
		}),
	),
	encode: (__typed__) => ({
		executor: damlTypes.Party.encode(__typed__.executor),
		action: exports.GovernanceAction.encode(__typed__.action),
		newApproversCount: damlTypes.Int.encode(__typed__.newApproversCount),
	}),
};

exports.ProposeChangeThreshold = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({ proposer: damlTypes.Party.decoder, newThreshold: damlTypes.Int.decoder }),
	),
	encode: (__typed__) => ({
		proposer: damlTypes.Party.encode(__typed__.proposer),
		newThreshold: damlTypes.Int.encode(__typed__.newThreshold),
	}),
};

exports.ProposeRemoveOwner = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({ proposer: damlTypes.Party.decoder, ownerToRemove: damlTypes.Party.decoder }),
	),
	encode: (__typed__) => ({
		proposer: damlTypes.Party.encode(__typed__.proposer),
		ownerToRemove: damlTypes.Party.encode(__typed__.ownerToRemove),
	}),
};

exports.ProposeAddOwner = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({ proposer: damlTypes.Party.decoder, newOwner: damlTypes.Party.decoder }),
	),
	encode: (__typed__) => ({
		proposer: damlTypes.Party.encode(__typed__.proposer),
		newOwner: damlTypes.Party.encode(__typed__.newOwner),
	}),
};

exports.ExecuteTransfer = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			executor: damlTypes.Party.decoder,
			iouCid: damlTypes.ContractId(Iou.Iou).decoder,
			recipient: damlTypes.Party.decoder,
		}),
	),
	encode: (__typed__) => ({
		executor: damlTypes.Party.encode(__typed__.executor),
		iouCid: damlTypes.ContractId(Iou.Iou).encode(__typed__.iouCid),
		recipient: damlTypes.Party.encode(__typed__.recipient),
	}),
};

exports.ProposeTransfer = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			proposer: damlTypes.Party.decoder,
			recipient: damlTypes.Party.decoder,
			txAmount: damlTypes.Numeric(10).decoder,
			txCurrency: damlTypes.Text.decoder,
			description: damlTypes.Text.decoder,
		}),
	),
	encode: (__typed__) => ({
		proposer: damlTypes.Party.encode(__typed__.proposer),
		recipient: damlTypes.Party.encode(__typed__.recipient),
		txAmount: damlTypes.Numeric(10).encode(__typed__.txAmount),
		txCurrency: damlTypes.Text.encode(__typed__.txCurrency),
		description: damlTypes.Text.encode(__typed__.description),
	}),
};

exports.CreatePendingUpdate = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({ executor: damlTypes.Party.decoder, newOwner: damlTypes.Party.decoder }),
	),
	encode: (__typed__) => ({
		executor: damlTypes.Party.encode(__typed__.executor),
		newOwner: damlTypes.Party.encode(__typed__.newOwner),
	}),
};

exports.MultisigWallet = damlTypes.assembleTemplate({
	templateId: "#nexus-example:MultisigWallet:MultisigWallet",
	templateIdWithPackageId:
		"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e:MultisigWallet:MultisigWallet",
	keyDecoder: damlTypes.lazyMemo(() => jtv.constant(undefined)),
	keyEncode: () => {
		throw "EncodeError";
	},
	decoder: damlTypes.lazyMemo(() =>
		jtv.object({
			walletId: damlTypes.Text.decoder,
			owners: damlTypes.List(damlTypes.Party).decoder,
			threshold: damlTypes.Int.decoder,
			custodian: damlTypes.Party.decoder,
		}),
	),
	encode: (__typed__) => ({
		walletId: damlTypes.Text.encode(__typed__.walletId),
		owners: damlTypes.List(damlTypes.Party).encode(__typed__.owners),
		threshold: damlTypes.Int.encode(__typed__.threshold),
		custodian: damlTypes.Party.encode(__typed__.custodian),
	}),
	Archive: {
		template: () => exports.MultisigWallet,
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
	CreatePendingUpdate: {
		template: () => exports.MultisigWallet,
		choiceName: "CreatePendingUpdate",
		argumentDecoder: damlTypes.lazyMemo(() => exports.CreatePendingUpdate.decoder),
		argumentEncode: (__typed__) => exports.CreatePendingUpdate.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(
			() => damlTypes.ContractId(exports.PendingWalletUpdate).decoder,
		),
		resultEncode: (__typed__) =>
			damlTypes.ContractId(exports.PendingWalletUpdate).encode(__typed__),
	},
	ProposeTransfer: {
		template: () => exports.MultisigWallet,
		choiceName: "ProposeTransfer",
		argumentDecoder: damlTypes.lazyMemo(() => exports.ProposeTransfer.decoder),
		argumentEncode: (__typed__) => exports.ProposeTransfer.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(
			() => damlTypes.ContractId(exports.TransactionProposal).decoder,
		),
		resultEncode: (__typed__) =>
			damlTypes.ContractId(exports.TransactionProposal).encode(__typed__),
	},
	ExecuteTransfer: {
		template: () => exports.MultisigWallet,
		choiceName: "ExecuteTransfer",
		argumentDecoder: damlTypes.lazyMemo(() => exports.ExecuteTransfer.decoder),
		argumentEncode: (__typed__) => exports.ExecuteTransfer.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.ContractId(Iou.Iou).decoder),
		resultEncode: (__typed__) => damlTypes.ContractId(Iou.Iou).encode(__typed__),
	},
	ProposeAddOwner: {
		template: () => exports.MultisigWallet,
		choiceName: "ProposeAddOwner",
		argumentDecoder: damlTypes.lazyMemo(() => exports.ProposeAddOwner.decoder),
		argumentEncode: (__typed__) => exports.ProposeAddOwner.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(
			() => damlTypes.ContractId(exports.GovernanceProposal).decoder,
		),
		resultEncode: (__typed__) => damlTypes.ContractId(exports.GovernanceProposal).encode(__typed__),
	},
	ProposeRemoveOwner: {
		template: () => exports.MultisigWallet,
		choiceName: "ProposeRemoveOwner",
		argumentDecoder: damlTypes.lazyMemo(() => exports.ProposeRemoveOwner.decoder),
		argumentEncode: (__typed__) => exports.ProposeRemoveOwner.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(
			() => damlTypes.ContractId(exports.GovernanceProposal).decoder,
		),
		resultEncode: (__typed__) => damlTypes.ContractId(exports.GovernanceProposal).encode(__typed__),
	},
	ProposeChangeThreshold: {
		template: () => exports.MultisigWallet,
		choiceName: "ProposeChangeThreshold",
		argumentDecoder: damlTypes.lazyMemo(() => exports.ProposeChangeThreshold.decoder),
		argumentEncode: (__typed__) => exports.ProposeChangeThreshold.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(
			() => damlTypes.ContractId(exports.GovernanceProposal).decoder,
		),
		resultEncode: (__typed__) => damlTypes.ContractId(exports.GovernanceProposal).encode(__typed__),
	},
	ExecuteGovernanceDirect: {
		template: () => exports.MultisigWallet,
		choiceName: "ExecuteGovernanceDirect",
		argumentDecoder: damlTypes.lazyMemo(() => exports.ExecuteGovernanceDirect.decoder),
		argumentEncode: (__typed__) => exports.ExecuteGovernanceDirect.encode(__typed__),
		resultDecoder: damlTypes.lazyMemo(() => damlTypes.ContractId(exports.MultisigWallet).decoder),
		resultEncode: (__typed__) => damlTypes.ContractId(exports.MultisigWallet).encode(__typed__),
	},
});

damlTypes.registerTemplate(exports.MultisigWallet, [
	"e2bfbf30dacbc07f56c8f79ca1e7a02df0b41d16c08181cbd8376414ab33806e",
	"#nexus-example",
]);

exports.GovernanceAction = {
	decoder: damlTypes.lazyMemo(() =>
		jtv.oneOf(
			jtv.object({ tag: jtv.constant("AddOwner"), value: damlTypes.Party.decoder }),
			jtv.object({ tag: jtv.constant("RemoveOwner"), value: damlTypes.Party.decoder }),
			jtv.object({ tag: jtv.constant("ChangeThreshold"), value: damlTypes.Int.decoder }),
		),
	),
	encode: (__typed__) => {
		switch (__typed__.tag) {
			case "AddOwner":
				return { tag: __typed__.tag, value: damlTypes.Party.encode(__typed__.value) };
			case "RemoveOwner":
				return { tag: __typed__.tag, value: damlTypes.Party.encode(__typed__.value) };
			case "ChangeThreshold":
				return { tag: __typed__.tag, value: damlTypes.Int.encode(__typed__.value) };
			default:
				throw (
					"unrecognized type tag: " +
					__typed__.tag +
					" while serializing a value of type GovernanceAction"
				);
		}
	},
};
