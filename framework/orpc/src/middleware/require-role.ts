import { ORPCError } from "@orpc/server";

export type Role = "Owner" | "Admin" | "Signer" | "Viewer";

const ROLE_HIERARCHY: Record<Role, number> = {
  Owner: 0,
  Admin: 1,
  Signer: 2,
  Viewer: 3,
};

export interface WalletMember {
  party: string;
  role: Role;
}

export interface Wallet {
  payload: {
    members: WalletMember[];
  };
}

export interface LedgerWithMultisigWallet {
  MultisigWallet: {
    findById: (cid: string) => Promise<Wallet | null>;
  };
}

export interface SessionContext {
  user?: {
    id: string;
  };
}

export interface RoleCheckContext {
  ledger: LedgerWithMultisigWallet;
  session?: SessionContext;
}

export interface RoleCheckInput {
  walletCid?: string;
}

/**
 * RBAC middleware for ledger-based role checks.
 * Requires `walletCid` in the input.
 */
export function createRequireRoleMiddleware() {
  return (requiredRole: Role) => {
    return async ({ 
      context, 
      next, 
      input 
    }: {
      context: RoleCheckContext;
      next: (args: { context: RoleCheckContext }) => Promise<unknown>;
      input: RoleCheckInput;
    }) => {
      // Get wallet from ledger
      if (!input.walletCid) {
        throw new ORPCError("BAD_REQUEST", {
          message: "walletCid required for role check",
        });
      }
      
      const wallet = await context.ledger.MultisigWallet.findById(input.walletCid);
      if (!wallet) {
        throw new ORPCError("NOT_FOUND", { message: "Wallet not found" });
      }
      
      // Get current user from context (assuming session is available or extracted from token)
      // For now, we assume the user ID is in context.session.user.id or similar
      const currentUser = context.session?.user?.id;
      if (!currentUser) {
        // Fallback: try to get party ID from ledger context if available
        // In Nexus, ledger is usually tied to a party.
        // But for RBAC, we need the actual acting party ID.
        throw new ORPCError("UNAUTHORIZED", { message: "Identification required for role check" });
      }
      
      // Check role
      const member = wallet.payload.members.find(
        (m: WalletMember) => m.party === currentUser
      );
      
      if (!member) {
        throw new ORPCError("FORBIDDEN", {
          message: "User not a member of this wallet",
        });
      }
      
      if (ROLE_HIERARCHY[member.role] > ROLE_HIERARCHY[requiredRole]) {
        throw new ORPCError("FORBIDDEN", {
          message: `Requires ${requiredRole} role, user has ${member.role}`,
        });
      }
      
      return next({ context });
    };
  };
}
