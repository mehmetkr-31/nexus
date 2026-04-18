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

var pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4 = require('daml.js/daml-prim-DA-Types-1.0.0');
var pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 = require('daml.js/ghc-stdlib-DA-Internal-Template-1.0.0');

var Iou = require('../Iou/module');


exports.CancelUpdate = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.AcceptMembership = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.PendingWalletUpdate = damlTypes.assembleTemplate(
{
  templateId: '#nexus-example:MultisigWallet:PendingWalletUpdate',
  templateIdWithPackageId: 'ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05:MultisigWallet:PendingWalletUpdate',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({walletId: damlTypes.Text.decoder, existingMembers: damlTypes.List(exports.Member).decoder, newMembers: damlTypes.List(exports.Member).decoder, newThreshold: damlTypes.Int.decoder, custodian: damlTypes.Party.decoder, pendingMember: exports.Member.decoder, }); }),
  encode: function (__typed__) {
  return {
    walletId: damlTypes.Text.encode(__typed__.walletId),
    existingMembers: damlTypes.List(exports.Member).encode(__typed__.existingMembers),
    newMembers: damlTypes.List(exports.Member).encode(__typed__.newMembers),
    newThreshold: damlTypes.Int.encode(__typed__.newThreshold),
    custodian: damlTypes.Party.encode(__typed__.custodian),
    pendingMember: exports.Member.encode(__typed__.pendingMember),
  };
}
,
  AcceptMembership: {
    template: function () { return exports.PendingWalletUpdate; },
    choiceName: 'AcceptMembership',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.AcceptMembership.decoder; }),
    argumentEncode: function (__typed__) { return exports.AcceptMembership.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.MultisigWallet).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.MultisigWallet).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.PendingWalletUpdate; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  CancelUpdate: {
    template: function () { return exports.PendingWalletUpdate; },
    choiceName: 'CancelUpdate',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.CancelUpdate.decoder; }),
    argumentEncode: function (__typed__) { return exports.CancelUpdate.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.PendingWalletUpdate, ['ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05', '#nexus-example']);



exports.RejectGovernance = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({rejector: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    rejector: damlTypes.Party.encode(__typed__.rejector),
  };
}
,
};



exports.ExecuteGovernance = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({executor: damlTypes.Party.decoder, walletCid: damlTypes.ContractId(exports.MultisigWallet).decoder, }); }),
  encode: function (__typed__) {
  return {
    executor: damlTypes.Party.encode(__typed__.executor),
    walletCid: damlTypes.ContractId(exports.MultisigWallet).encode(__typed__.walletCid),
  };
}
,
};



exports.ApproveGovernance = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({approver: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    approver: damlTypes.Party.encode(__typed__.approver),
  };
}
,
};



exports.GovernanceProposal = damlTypes.assembleTemplate(
{
  templateId: '#nexus-example:MultisigWallet:GovernanceProposal',
  templateIdWithPackageId: 'ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05:MultisigWallet:GovernanceProposal',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({walletId: damlTypes.Text.decoder, walletMembers: damlTypes.List(exports.Member).decoder, threshold: damlTypes.Int.decoder, custodian: damlTypes.Party.decoder, proposer: damlTypes.Party.decoder, approvers: damlTypes.List(damlTypes.Party).decoder, action: exports.GovernanceAction.decoder, }); }),
  encode: function (__typed__) {
  return {
    walletId: damlTypes.Text.encode(__typed__.walletId),
    walletMembers: damlTypes.List(exports.Member).encode(__typed__.walletMembers),
    threshold: damlTypes.Int.encode(__typed__.threshold),
    custodian: damlTypes.Party.encode(__typed__.custodian),
    proposer: damlTypes.Party.encode(__typed__.proposer),
    approvers: damlTypes.List(damlTypes.Party).encode(__typed__.approvers),
    action: exports.GovernanceAction.encode(__typed__.action),
  };
}
,
  RejectGovernance: {
    template: function () { return exports.GovernanceProposal; },
    choiceName: 'RejectGovernance',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.RejectGovernance.decoder; }),
    argumentEncode: function (__typed__) { return exports.RejectGovernance.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  ExecuteGovernance: {
    template: function () { return exports.GovernanceProposal; },
    choiceName: 'ExecuteGovernance',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ExecuteGovernance.decoder; }),
    argumentEncode: function (__typed__) { return exports.ExecuteGovernance.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Either(damlTypes.ContractId(exports.PendingWalletUpdate), damlTypes.ContractId(exports.MultisigWallet)).decoder; }),
    resultEncode: function (__typed__) { return pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Either(damlTypes.ContractId(exports.PendingWalletUpdate), damlTypes.ContractId(exports.MultisigWallet)).encode(__typed__); },
  },
  ApproveGovernance: {
    template: function () { return exports.GovernanceProposal; },
    choiceName: 'ApproveGovernance',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ApproveGovernance.decoder; }),
    argumentEncode: function (__typed__) { return exports.ApproveGovernance.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.GovernanceProposal).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.GovernanceProposal).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.GovernanceProposal; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.GovernanceProposal, ['ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05', '#nexus-example']);



exports.Reject = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({rejector: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    rejector: damlTypes.Party.encode(__typed__.rejector),
  };
}
,
};



exports.Execute = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({executor: damlTypes.Party.decoder, walletCid: damlTypes.ContractId(exports.MultisigWallet).decoder, iouCid: damlTypes.ContractId(Iou.Iou).decoder, }); }),
  encode: function (__typed__) {
  return {
    executor: damlTypes.Party.encode(__typed__.executor),
    walletCid: damlTypes.ContractId(exports.MultisigWallet).encode(__typed__.walletCid),
    iouCid: damlTypes.ContractId(Iou.Iou).encode(__typed__.iouCid),
  };
}
,
};



exports.Approve = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({approver: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    approver: damlTypes.Party.encode(__typed__.approver),
  };
}
,
};



exports.TransactionProposal = damlTypes.assembleTemplate(
{
  templateId: '#nexus-example:MultisigWallet:TransactionProposal',
  templateIdWithPackageId: 'ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05:MultisigWallet:TransactionProposal',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({walletId: damlTypes.Text.decoder, walletMembers: damlTypes.List(exports.Member).decoder, walletThreshold: damlTypes.Int.decoder, custodian: damlTypes.Party.decoder, proposer: damlTypes.Party.decoder, recipient: damlTypes.Party.decoder, amount: damlTypes.Numeric(10).decoder, currency: damlTypes.Text.decoder, description: damlTypes.Text.decoder, approvers: damlTypes.List(damlTypes.Party).decoder, }); }),
  encode: function (__typed__) {
  return {
    walletId: damlTypes.Text.encode(__typed__.walletId),
    walletMembers: damlTypes.List(exports.Member).encode(__typed__.walletMembers),
    walletThreshold: damlTypes.Int.encode(__typed__.walletThreshold),
    custodian: damlTypes.Party.encode(__typed__.custodian),
    proposer: damlTypes.Party.encode(__typed__.proposer),
    recipient: damlTypes.Party.encode(__typed__.recipient),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
    currency: damlTypes.Text.encode(__typed__.currency),
    description: damlTypes.Text.encode(__typed__.description),
    approvers: damlTypes.List(damlTypes.Party).encode(__typed__.approvers),
  };
}
,
  Reject: {
    template: function () { return exports.TransactionProposal; },
    choiceName: 'Reject',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Reject.decoder; }),
    argumentEncode: function (__typed__) { return exports.Reject.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Execute: {
    template: function () { return exports.TransactionProposal; },
    choiceName: 'Execute',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Execute.decoder; }),
    argumentEncode: function (__typed__) { return exports.Execute.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(Iou.Iou).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(Iou.Iou).encode(__typed__); },
  },
  Approve: {
    template: function () { return exports.TransactionProposal; },
    choiceName: 'Approve',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Approve.decoder; }),
    argumentEncode: function (__typed__) { return exports.Approve.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.TransactionProposal).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.TransactionProposal).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.TransactionProposal; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.TransactionProposal, ['ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05', '#nexus-example']);



exports.ExecuteGovernanceDirect = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({executor: damlTypes.Party.decoder, action: exports.GovernanceAction.decoder, newApproversCount: damlTypes.Int.decoder, }); }),
  encode: function (__typed__) {
  return {
    executor: damlTypes.Party.encode(__typed__.executor),
    action: exports.GovernanceAction.encode(__typed__.action),
    newApproversCount: damlTypes.Int.encode(__typed__.newApproversCount),
  };
}
,
};



exports.ProposeChangeThreshold = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({proposer: damlTypes.Party.decoder, newThreshold: damlTypes.Int.decoder, }); }),
  encode: function (__typed__) {
  return {
    proposer: damlTypes.Party.encode(__typed__.proposer),
    newThreshold: damlTypes.Int.encode(__typed__.newThreshold),
  };
}
,
};



exports.ProposeRemoveMember = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({proposer: damlTypes.Party.decoder, memberToRemove: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    proposer: damlTypes.Party.encode(__typed__.proposer),
    memberToRemove: damlTypes.Party.encode(__typed__.memberToRemove),
  };
}
,
};



exports.ProposeAddMember = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({proposer: damlTypes.Party.decoder, newMember: exports.Member.decoder, }); }),
  encode: function (__typed__) {
  return {
    proposer: damlTypes.Party.encode(__typed__.proposer),
    newMember: exports.Member.encode(__typed__.newMember),
  };
}
,
};



exports.ExecuteTransfer = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({executor: damlTypes.Party.decoder, iouCid: damlTypes.ContractId(Iou.Iou).decoder, recipient: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    executor: damlTypes.Party.encode(__typed__.executor),
    iouCid: damlTypes.ContractId(Iou.Iou).encode(__typed__.iouCid),
    recipient: damlTypes.Party.encode(__typed__.recipient),
  };
}
,
};



exports.ProposeTransfer = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({proposer: damlTypes.Party.decoder, recipient: damlTypes.Party.decoder, txAmount: damlTypes.Numeric(10).decoder, txCurrency: damlTypes.Text.decoder, description: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    proposer: damlTypes.Party.encode(__typed__.proposer),
    recipient: damlTypes.Party.encode(__typed__.recipient),
    txAmount: damlTypes.Numeric(10).encode(__typed__.txAmount),
    txCurrency: damlTypes.Text.encode(__typed__.txCurrency),
    description: damlTypes.Text.encode(__typed__.description),
  };
}
,
};



exports.CreatePendingUpdate = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({executor: damlTypes.Party.decoder, newMember: exports.Member.decoder, }); }),
  encode: function (__typed__) {
  return {
    executor: damlTypes.Party.encode(__typed__.executor),
    newMember: exports.Member.encode(__typed__.newMember),
  };
}
,
};



exports.MultisigWallet = damlTypes.assembleTemplate(
{
  templateId: '#nexus-example:MultisigWallet:MultisigWallet',
  templateIdWithPackageId: 'ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05:MultisigWallet:MultisigWallet',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({walletId: damlTypes.Text.decoder, members: damlTypes.List(exports.Member).decoder, threshold: damlTypes.Int.decoder, custodian: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    walletId: damlTypes.Text.encode(__typed__.walletId),
    members: damlTypes.List(exports.Member).encode(__typed__.members),
    threshold: damlTypes.Int.encode(__typed__.threshold),
    custodian: damlTypes.Party.encode(__typed__.custodian),
  };
}
,
  ExecuteGovernanceDirect: {
    template: function () { return exports.MultisigWallet; },
    choiceName: 'ExecuteGovernanceDirect',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ExecuteGovernanceDirect.decoder; }),
    argumentEncode: function (__typed__) { return exports.ExecuteGovernanceDirect.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.MultisigWallet).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.MultisigWallet).encode(__typed__); },
  },
  ProposeChangeThreshold: {
    template: function () { return exports.MultisigWallet; },
    choiceName: 'ProposeChangeThreshold',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ProposeChangeThreshold.decoder; }),
    argumentEncode: function (__typed__) { return exports.ProposeChangeThreshold.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.GovernanceProposal).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.GovernanceProposal).encode(__typed__); },
  },
  ProposeRemoveMember: {
    template: function () { return exports.MultisigWallet; },
    choiceName: 'ProposeRemoveMember',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ProposeRemoveMember.decoder; }),
    argumentEncode: function (__typed__) { return exports.ProposeRemoveMember.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.GovernanceProposal).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.GovernanceProposal).encode(__typed__); },
  },
  ProposeAddMember: {
    template: function () { return exports.MultisigWallet; },
    choiceName: 'ProposeAddMember',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ProposeAddMember.decoder; }),
    argumentEncode: function (__typed__) { return exports.ProposeAddMember.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.GovernanceProposal).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.GovernanceProposal).encode(__typed__); },
  },
  ExecuteTransfer: {
    template: function () { return exports.MultisigWallet; },
    choiceName: 'ExecuteTransfer',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ExecuteTransfer.decoder; }),
    argumentEncode: function (__typed__) { return exports.ExecuteTransfer.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(Iou.Iou).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(Iou.Iou).encode(__typed__); },
  },
  ProposeTransfer: {
    template: function () { return exports.MultisigWallet; },
    choiceName: 'ProposeTransfer',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ProposeTransfer.decoder; }),
    argumentEncode: function (__typed__) { return exports.ProposeTransfer.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.TransactionProposal).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.TransactionProposal).encode(__typed__); },
  },
  CreatePendingUpdate: {
    template: function () { return exports.MultisigWallet; },
    choiceName: 'CreatePendingUpdate',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.CreatePendingUpdate.decoder; }),
    argumentEncode: function (__typed__) { return exports.CreatePendingUpdate.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.PendingWalletUpdate).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.PendingWalletUpdate).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.MultisigWallet; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.MultisigWallet, ['ee685789f7ed6681277d1be17c49ab9cc3821b337a70e886472710dfc9e38f05', '#nexus-example']);



exports.GovernanceAction = {
  decoder: damlTypes.lazyMemo(function () { return jtv.oneOf(jtv.object({tag: jtv.constant('AddMember'), value: exports.Member.decoder, }), jtv.object({tag: jtv.constant('RemoveMember'), value: damlTypes.Party.decoder, }), jtv.object({tag: jtv.constant('ChangeThreshold'), value: damlTypes.Int.decoder, })); }),
  encode: function (__typed__) {
  switch(__typed__.tag) {
    case 'AddMember': return {tag: __typed__.tag, value: exports.Member.encode(__typed__.value)};
    case 'RemoveMember': return {tag: __typed__.tag, value: damlTypes.Party.encode(__typed__.value)};
    case 'ChangeThreshold': return {tag: __typed__.tag, value: damlTypes.Int.encode(__typed__.value)};
    default: throw 'unrecognized type tag: ' + __typed__.tag + ' while serializing a value of type GovernanceAction';
  }
}
,
};



exports.Member = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({party: damlTypes.Party.decoder, role: exports.Role.decoder, }); }),
  encode: function (__typed__) {
  return {
    party: damlTypes.Party.encode(__typed__.party),
    role: exports.Role.encode(__typed__.role),
  };
}
,
};



exports.Role = {
  Owner: 'Owner',
  Admin: 'Admin',
  Signer: 'Signer',
  Viewer: 'Viewer',
  keys: ['Owner','Admin','Signer','Viewer',],
  decoder: damlTypes.lazyMemo(function () { return jtv.oneOf(jtv.constant(exports.Role.Owner), jtv.constant(exports.Role.Admin), jtv.constant(exports.Role.Signer), jtv.constant(exports.Role.Viewer)); }),
  encode: function (__typed__) { return __typed__; },
};

