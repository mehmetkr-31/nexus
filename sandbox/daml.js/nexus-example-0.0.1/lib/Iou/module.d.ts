// Generated from Iou.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from "@mojotech/json-type-validation";
import * as damlTypes from "@daml/types";

import * as pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4 from "@daml.js/daml-prim-DA-Types-1.0.0";
import * as pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 from "@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0";

export declare type Merge = {
	otherCid: damlTypes.ContractId<Iou>;
};

export declare const Merge: damlTypes.Serializable<Merge> & {};

export declare type Split = {
	splitAmount: damlTypes.Numeric;
};

export declare const Split: damlTypes.Serializable<Split> & {};

export declare type Transfer = {
	newOwner: damlTypes.Party;
};

export declare const Transfer: damlTypes.Serializable<Transfer> & {};

export declare type Iou = {
	issuer: damlTypes.Party;
	owner: damlTypes.Party;
	amount: damlTypes.Numeric;
	currency: string;
	observers: damlTypes.Party[];
};

export declare interface IouInterface {
	Transfer: damlTypes.Choice<Iou, Transfer, damlTypes.ContractId<Iou>, undefined> &
		damlTypes.ChoiceFrom<damlTypes.Template<Iou, undefined>>;
	Split: damlTypes.Choice<
		Iou,
		Split,
		pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Tuple2<
			damlTypes.ContractId<Iou>,
			damlTypes.ContractId<Iou>
		>,
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<Iou, undefined>>;
	Archive: damlTypes.Choice<
		Iou,
		pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive,
		{},
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<Iou, undefined>>;
	Merge: damlTypes.Choice<Iou, Merge, damlTypes.ContractId<Iou>, undefined> &
		damlTypes.ChoiceFrom<damlTypes.Template<Iou, undefined>>;
}
export declare const Iou: damlTypes.Template<Iou, undefined, "#nexus-example:Iou:Iou"> &
	damlTypes.ToInterface<Iou, never> &
	IouInterface;

export declare namespace Iou {}
