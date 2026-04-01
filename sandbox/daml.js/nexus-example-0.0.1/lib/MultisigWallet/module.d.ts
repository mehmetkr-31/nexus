// Generated from MultisigWallet.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from "@mojotech/json-type-validation";
import * as damlTypes from "@daml/types";

import * as pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4 from "@daml.js/daml-prim-DA-Types-1.0.0";
import * as pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 from "@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0";

import * as Iou from "../Iou/module";

export declare type CancelUpdate = {};

export declare const CancelUpdate: damlTypes.Serializable<CancelUpdate> & {};

export declare type AcceptMembership = {};

export declare const AcceptMembership: damlTypes.Serializable<AcceptMembership> & {};

export declare type PendingWalletUpdate = {
	walletId: string;
	existingMembers: damlTypes.Party[];
	newOwners: damlTypes.Party[];
	newThreshold: damlTypes.Int;
	custodian: damlTypes.Party;
	newMember: damlTypes.Party;
};

export declare interface PendingWalletUpdateInterface {
	Archive: damlTypes.Choice<
		PendingWalletUpdate,
		pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive,
		{},
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<PendingWalletUpdate, undefined>>;
	CancelUpdate: damlTypes.Choice<PendingWalletUpdate, CancelUpdate, {}, undefined> &
		damlTypes.ChoiceFrom<damlTypes.Template<PendingWalletUpdate, undefined>>;
	AcceptMembership: damlTypes.Choice<
		PendingWalletUpdate,
		AcceptMembership,
		damlTypes.ContractId<MultisigWallet>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<PendingWalletUpdate, undefined>>;
}
export declare const PendingWalletUpdate: damlTypes.Template<
	PendingWalletUpdate,
	undefined,
	"#nexus-example:MultisigWallet:PendingWalletUpdate"
> &
	damlTypes.ToInterface<PendingWalletUpdate, never> &
	PendingWalletUpdateInterface;

export declare namespace PendingWalletUpdate {}

export declare type RejectGovernance = {
	rejector: damlTypes.Party;
};

export declare const RejectGovernance: damlTypes.Serializable<RejectGovernance> & {};

export declare type ExecuteGovernance = {
	executor: damlTypes.Party;
	walletCid: damlTypes.ContractId<MultisigWallet>;
};

export declare const ExecuteGovernance: damlTypes.Serializable<ExecuteGovernance> & {};

export declare type ApproveGovernance = {
	approver: damlTypes.Party;
};

export declare const ApproveGovernance: damlTypes.Serializable<ApproveGovernance> & {};

export declare type GovernanceProposal = {
	walletId: string;
	walletOwners: damlTypes.Party[];
	threshold: damlTypes.Int;
	custodian: damlTypes.Party;
	proposer: damlTypes.Party;
	approvers: damlTypes.Party[];
	action: GovernanceAction;
};

export declare interface GovernanceProposalInterface {
	Archive: damlTypes.Choice<
		GovernanceProposal,
		pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive,
		{},
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<GovernanceProposal, undefined>>;
	ExecuteGovernance: damlTypes.Choice<
		GovernanceProposal,
		ExecuteGovernance,
		pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Either<
			damlTypes.ContractId<PendingWalletUpdate>,
			damlTypes.ContractId<MultisigWallet>
		>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<GovernanceProposal, undefined>>;
	RejectGovernance: damlTypes.Choice<GovernanceProposal, RejectGovernance, {}, undefined> &
		damlTypes.ChoiceFrom<damlTypes.Template<GovernanceProposal, undefined>>;
	ApproveGovernance: damlTypes.Choice<
		GovernanceProposal,
		ApproveGovernance,
		damlTypes.ContractId<GovernanceProposal>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<GovernanceProposal, undefined>>;
}
export declare const GovernanceProposal: damlTypes.Template<
	GovernanceProposal,
	undefined,
	"#nexus-example:MultisigWallet:GovernanceProposal"
> &
	damlTypes.ToInterface<GovernanceProposal, never> &
	GovernanceProposalInterface;

export declare namespace GovernanceProposal {}

export declare type Reject = {
	rejector: damlTypes.Party;
};

export declare const Reject: damlTypes.Serializable<Reject> & {};

export declare type Execute = {
	executor: damlTypes.Party;
	walletCid: damlTypes.ContractId<MultisigWallet>;
	iouCid: damlTypes.ContractId<Iou.Iou>;
};

export declare const Execute: damlTypes.Serializable<Execute> & {};

export declare type Approve = {
	approver: damlTypes.Party;
};

export declare const Approve: damlTypes.Serializable<Approve> & {};

export declare type TransactionProposal = {
	walletId: string;
	walletOwners: damlTypes.Party[];
	walletThreshold: damlTypes.Int;
	custodian: damlTypes.Party;
	proposer: damlTypes.Party;
	recipient: damlTypes.Party;
	amount: damlTypes.Numeric;
	currency: string;
	description: string;
	approvers: damlTypes.Party[];
};

export declare interface TransactionProposalInterface {
	Archive: damlTypes.Choice<
		TransactionProposal,
		pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive,
		{},
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<TransactionProposal, undefined>>;
	Reject: damlTypes.Choice<TransactionProposal, Reject, {}, undefined> &
		damlTypes.ChoiceFrom<damlTypes.Template<TransactionProposal, undefined>>;
	Approve: damlTypes.Choice<
		TransactionProposal,
		Approve,
		damlTypes.ContractId<TransactionProposal>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<TransactionProposal, undefined>>;
	Execute: damlTypes.Choice<
		TransactionProposal,
		Execute,
		damlTypes.ContractId<Iou.Iou>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<TransactionProposal, undefined>>;
}
export declare const TransactionProposal: damlTypes.Template<
	TransactionProposal,
	undefined,
	"#nexus-example:MultisigWallet:TransactionProposal"
> &
	damlTypes.ToInterface<TransactionProposal, never> &
	TransactionProposalInterface;

export declare namespace TransactionProposal {}

export declare type ExecuteGovernanceDirect = {
	executor: damlTypes.Party;
	action: GovernanceAction;
	newApproversCount: damlTypes.Int;
};

export declare const ExecuteGovernanceDirect: damlTypes.Serializable<ExecuteGovernanceDirect> & {};

export declare type ProposeChangeThreshold = {
	proposer: damlTypes.Party;
	newThreshold: damlTypes.Int;
};

export declare const ProposeChangeThreshold: damlTypes.Serializable<ProposeChangeThreshold> & {};

export declare type ProposeRemoveOwner = {
	proposer: damlTypes.Party;
	ownerToRemove: damlTypes.Party;
};

export declare const ProposeRemoveOwner: damlTypes.Serializable<ProposeRemoveOwner> & {};

export declare type ProposeAddOwner = {
	proposer: damlTypes.Party;
	newOwner: damlTypes.Party;
};

export declare const ProposeAddOwner: damlTypes.Serializable<ProposeAddOwner> & {};

export declare type ExecuteTransfer = {
	executor: damlTypes.Party;
	iouCid: damlTypes.ContractId<Iou.Iou>;
	recipient: damlTypes.Party;
};

export declare const ExecuteTransfer: damlTypes.Serializable<ExecuteTransfer> & {};

export declare type ProposeTransfer = {
	proposer: damlTypes.Party;
	recipient: damlTypes.Party;
	txAmount: damlTypes.Numeric;
	txCurrency: string;
	description: string;
};

export declare const ProposeTransfer: damlTypes.Serializable<ProposeTransfer> & {};

export declare type CreatePendingUpdate = {
	executor: damlTypes.Party;
	newOwner: damlTypes.Party;
};

export declare const CreatePendingUpdate: damlTypes.Serializable<CreatePendingUpdate> & {};

export declare type MultisigWallet = {
	walletId: string;
	owners: damlTypes.Party[];
	threshold: damlTypes.Int;
	custodian: damlTypes.Party;
};

export declare interface MultisigWalletInterface {
	Archive: damlTypes.Choice<
		MultisigWallet,
		pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive,
		{},
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<MultisigWallet, undefined>>;
	CreatePendingUpdate: damlTypes.Choice<
		MultisigWallet,
		CreatePendingUpdate,
		damlTypes.ContractId<PendingWalletUpdate>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<MultisigWallet, undefined>>;
	ProposeTransfer: damlTypes.Choice<
		MultisigWallet,
		ProposeTransfer,
		damlTypes.ContractId<TransactionProposal>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<MultisigWallet, undefined>>;
	ExecuteTransfer: damlTypes.Choice<
		MultisigWallet,
		ExecuteTransfer,
		damlTypes.ContractId<Iou.Iou>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<MultisigWallet, undefined>>;
	ProposeAddOwner: damlTypes.Choice<
		MultisigWallet,
		ProposeAddOwner,
		damlTypes.ContractId<GovernanceProposal>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<MultisigWallet, undefined>>;
	ProposeRemoveOwner: damlTypes.Choice<
		MultisigWallet,
		ProposeRemoveOwner,
		damlTypes.ContractId<GovernanceProposal>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<MultisigWallet, undefined>>;
	ProposeChangeThreshold: damlTypes.Choice<
		MultisigWallet,
		ProposeChangeThreshold,
		damlTypes.ContractId<GovernanceProposal>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<MultisigWallet, undefined>>;
	ExecuteGovernanceDirect: damlTypes.Choice<
		MultisigWallet,
		ExecuteGovernanceDirect,
		damlTypes.ContractId<MultisigWallet>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<MultisigWallet, undefined>>;
}
export declare const MultisigWallet: damlTypes.Template<
	MultisigWallet,
	undefined,
	"#nexus-example:MultisigWallet:MultisigWallet"
> &
	damlTypes.ToInterface<MultisigWallet, never> &
	MultisigWalletInterface;

export declare namespace MultisigWallet {}

export declare type GovernanceAction =
	| { tag: "AddOwner"; value: damlTypes.Party }
	| { tag: "RemoveOwner"; value: damlTypes.Party }
	| { tag: "ChangeThreshold"; value: damlTypes.Int };

export declare const GovernanceAction: damlTypes.Serializable<GovernanceAction> & {};
