// Generated from WalletSetup.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from "@mojotech/json-type-validation";
import * as damlTypes from "@daml/types";

import * as pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 from "@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0";

import * as MultisigWallet from "../MultisigWallet/module";

export declare type CancelFactory = {};

export declare const CancelFactory: damlTypes.Serializable<CancelFactory> & {};

export declare type Finalize = {
	acceptors: damlTypes.Party[];
};

export declare const Finalize: damlTypes.Serializable<Finalize> & {};

export declare type WalletFactory = {
	initiator: damlTypes.Party;
	walletId: string;
	allOwners: damlTypes.Party[];
	threshold: damlTypes.Int;
	custodian: damlTypes.Party;
};

export declare interface WalletFactoryInterface {
	Archive: damlTypes.Choice<
		WalletFactory,
		pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive,
		{},
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<WalletFactory, undefined>>;
	CancelFactory: damlTypes.Choice<WalletFactory, CancelFactory, {}, undefined> &
		damlTypes.ChoiceFrom<damlTypes.Template<WalletFactory, undefined>>;
	Finalize: damlTypes.Choice<
		WalletFactory,
		Finalize,
		damlTypes.ContractId<MultisigWallet.MultisigWallet>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<WalletFactory, undefined>>;
}
export declare const WalletFactory: damlTypes.Template<
	WalletFactory,
	undefined,
	"#nexus-example:WalletSetup:WalletFactory"
> &
	damlTypes.ToInterface<WalletFactory, never> &
	WalletFactoryInterface;

export declare namespace WalletFactory {}

export declare type RetractAcceptance = {};

export declare const RetractAcceptance: damlTypes.Serializable<RetractAcceptance> & {};

export declare type WalletAcceptance = {
	walletId: string;
	owner: damlTypes.Party;
	initiator: damlTypes.Party;
	allOwners: damlTypes.Party[];
	threshold: damlTypes.Int;
	custodian: damlTypes.Party;
};

export declare interface WalletAcceptanceInterface {
	RetractAcceptance: damlTypes.Choice<WalletAcceptance, RetractAcceptance, {}, undefined> &
		damlTypes.ChoiceFrom<damlTypes.Template<WalletAcceptance, undefined>>;
	Archive: damlTypes.Choice<
		WalletAcceptance,
		pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive,
		{},
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<WalletAcceptance, undefined>>;
}
export declare const WalletAcceptance: damlTypes.Template<
	WalletAcceptance,
	undefined,
	"#nexus-example:WalletSetup:WalletAcceptance"
> &
	damlTypes.ToInterface<WalletAcceptance, never> &
	WalletAcceptanceInterface;

export declare namespace WalletAcceptance {}

export declare type RetractInvitation = {};

export declare const RetractInvitation: damlTypes.Serializable<RetractInvitation> & {};

export declare type DeclineInvitation = {};

export declare const DeclineInvitation: damlTypes.Serializable<DeclineInvitation> & {};

export declare type AcceptInvitation = {};

export declare const AcceptInvitation: damlTypes.Serializable<AcceptInvitation> & {};

export declare type WalletInvitation = {
	initiator: damlTypes.Party;
	invitee: damlTypes.Party;
	walletId: string;
	allOwners: damlTypes.Party[];
	threshold: damlTypes.Int;
	custodian: damlTypes.Party;
};

export declare interface WalletInvitationInterface {
	AcceptInvitation: damlTypes.Choice<
		WalletInvitation,
		AcceptInvitation,
		damlTypes.ContractId<WalletAcceptance>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<WalletInvitation, undefined>>;
	DeclineInvitation: damlTypes.Choice<WalletInvitation, DeclineInvitation, {}, undefined> &
		damlTypes.ChoiceFrom<damlTypes.Template<WalletInvitation, undefined>>;
	RetractInvitation: damlTypes.Choice<WalletInvitation, RetractInvitation, {}, undefined> &
		damlTypes.ChoiceFrom<damlTypes.Template<WalletInvitation, undefined>>;
	Archive: damlTypes.Choice<
		WalletInvitation,
		pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive,
		{},
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<WalletInvitation, undefined>>;
}
export declare const WalletInvitation: damlTypes.Template<
	WalletInvitation,
	undefined,
	"#nexus-example:WalletSetup:WalletInvitation"
> &
	damlTypes.ToInterface<WalletInvitation, never> &
	WalletInvitationInterface;

export declare namespace WalletInvitation {}
