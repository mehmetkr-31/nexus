// Generated from Main.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from "@mojotech/json-type-validation";
import * as damlTypes from "@daml/types";

import * as pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 from "@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0";

export declare type Placeholder = {
	owner: damlTypes.Party;
};

export declare interface PlaceholderInterface {
	Archive: damlTypes.Choice<
		Placeholder,
		pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive,
		{},
		undefined
	> &
		damlTypes.ChoiceFrom<damlTypes.Template<Placeholder, undefined>>;
}
export declare const Placeholder: damlTypes.Template<
	Placeholder,
	undefined,
	"#nexus-example:Main:Placeholder"
> &
	damlTypes.ToInterface<Placeholder, never> &
	PlaceholderInterface;

export declare namespace Placeholder {}
