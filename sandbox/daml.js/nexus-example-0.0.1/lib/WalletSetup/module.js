"use strict";
/* eslint-disable-next-line no-unused-vars */
function __export(m) {
/* eslint-disable-next-line no-prototype-builtins */
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable-next-line no-unused-vars */
var jtv = require('@mojotech/json-type-validation');
/* eslint-disable-next-line no-unused-vars */
var damlTypes = require('@daml/types');

var pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 = require('daml.js/ghc-stdlib-DA-Internal-Template-1.0.0');

var MultisigWallet = require('../MultisigWallet/module');


exports.CancelFactory = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Finalize = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({acceptors: damlTypes.List(damlTypes.Party).decoder, }); }),
  encode: function (__typed__) {
  return {
    acceptors: damlTypes.List(damlTypes.Party).encode(__typed__.acceptors),
  };
}
,
};



exports.WalletFactory = damlTypes.assembleTemplate(
{
  templateId: '#nexus-example:WalletSetup:WalletFactory',
  templateIdWithPackageId: 'ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05:WalletSetup:WalletFactory',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({initiator: damlTypes.Party.decoder, walletId: damlTypes.Text.decoder, allMembers: damlTypes.List(MultisigWallet.Member).decoder, threshold: damlTypes.Int.decoder, custodian: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    initiator: damlTypes.Party.encode(__typed__.initiator),
    walletId: damlTypes.Text.encode(__typed__.walletId),
    allMembers: damlTypes.List(MultisigWallet.Member).encode(__typed__.allMembers),
    threshold: damlTypes.Int.encode(__typed__.threshold),
    custodian: damlTypes.Party.encode(__typed__.custodian),
  };
}
,
  Archive: {
    template: function () { return exports.WalletFactory; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  CancelFactory: {
    template: function () { return exports.WalletFactory; },
    choiceName: 'CancelFactory',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.CancelFactory.decoder; }),
    argumentEncode: function (__typed__) { return exports.CancelFactory.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Finalize: {
    template: function () { return exports.WalletFactory; },
    choiceName: 'Finalize',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Finalize.decoder; }),
    argumentEncode: function (__typed__) { return exports.Finalize.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(MultisigWallet.MultisigWallet).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(MultisigWallet.MultisigWallet).encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.WalletFactory, ['ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05', '#nexus-example']);



exports.RetractAcceptance = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.WalletAcceptance = damlTypes.assembleTemplate(
{
  templateId: '#nexus-example:WalletSetup:WalletAcceptance',
  templateIdWithPackageId: 'ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05:WalletSetup:WalletAcceptance',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({walletId: damlTypes.Text.decoder, member: MultisigWallet.Member.decoder, initiator: damlTypes.Party.decoder, allMembers: damlTypes.List(MultisigWallet.Member).decoder, threshold: damlTypes.Int.decoder, custodian: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    walletId: damlTypes.Text.encode(__typed__.walletId),
    member: MultisigWallet.Member.encode(__typed__.member),
    initiator: damlTypes.Party.encode(__typed__.initiator),
    allMembers: damlTypes.List(MultisigWallet.Member).encode(__typed__.allMembers),
    threshold: damlTypes.Int.encode(__typed__.threshold),
    custodian: damlTypes.Party.encode(__typed__.custodian),
  };
}
,
  RetractAcceptance: {
    template: function () { return exports.WalletAcceptance; },
    choiceName: 'RetractAcceptance',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.RetractAcceptance.decoder; }),
    argumentEncode: function (__typed__) { return exports.RetractAcceptance.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.WalletAcceptance; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.WalletAcceptance, ['ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05', '#nexus-example']);



exports.RetractInvitation = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.DeclineInvitation = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.AcceptInvitation = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.WalletInvitation = damlTypes.assembleTemplate(
{
  templateId: '#nexus-example:WalletSetup:WalletInvitation',
  templateIdWithPackageId: 'ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05:WalletSetup:WalletInvitation',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({initiator: damlTypes.Party.decoder, invitee: MultisigWallet.Member.decoder, walletId: damlTypes.Text.decoder, allMembers: damlTypes.List(MultisigWallet.Member).decoder, threshold: damlTypes.Int.decoder, custodian: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    initiator: damlTypes.Party.encode(__typed__.initiator),
    invitee: MultisigWallet.Member.encode(__typed__.invitee),
    walletId: damlTypes.Text.encode(__typed__.walletId),
    allMembers: damlTypes.List(MultisigWallet.Member).encode(__typed__.allMembers),
    threshold: damlTypes.Int.encode(__typed__.threshold),
    custodian: damlTypes.Party.encode(__typed__.custodian),
  };
}
,
  AcceptInvitation: {
    template: function () { return exports.WalletInvitation; },
    choiceName: 'AcceptInvitation',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.AcceptInvitation.decoder; }),
    argumentEncode: function (__typed__) { return exports.AcceptInvitation.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.WalletAcceptance).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.WalletAcceptance).encode(__typed__); },
  },
  DeclineInvitation: {
    template: function () { return exports.WalletInvitation; },
    choiceName: 'DeclineInvitation',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.DeclineInvitation.decoder; }),
    argumentEncode: function (__typed__) { return exports.DeclineInvitation.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  RetractInvitation: {
    template: function () { return exports.WalletInvitation; },
    choiceName: 'RetractInvitation',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.RetractInvitation.decoder; }),
    argumentEncode: function (__typed__) { return exports.RetractInvitation.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.WalletInvitation; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.WalletInvitation, ['ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05', '#nexus-example']);

