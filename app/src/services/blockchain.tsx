import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionSignature,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { DiscordLikeProgram } from "./discord_like_program";
import idl from "./discord_like_program.json";
import { getClusterURL } from "@/utils/helpers";

const CLUSTER: string = process.env.NEXT_PUBLIC_CLUSTER || "devnet";
const RPC_URL: string = getClusterURL(CLUSTER);

// ==================== Transaction Configuration ====================
// Using skipPreflight: true to prevent simulation failures that can occur
// with PDAs, account initialization, and complex interactions.
// Transactions may still succeed on-chain even if simulation fails.
// maxRetries: 3 ensures the transaction is attempted multiple times if network issues occur.

// ==================== Types ====================

export interface TransactionResult {
  success: boolean;
  signature?: TransactionSignature;
  error?: string;
  errorCode?: number;
}

export enum ErrorCode {
  ALREADY_INITIALIZED = 6000,
  CHANNEL_NAME_TOO_LONG = 6001,
  CHANNEL_DESCRIPTION_TOO_LONG = 6002,
  INVALID_CHANNEL_COST = 6003,
  CHANNEL_NOT_FOUND = 6004,
  ALREADY_JOINED = 6005,
  INSUFFICIENT_FUNDS = 6006,
  UNAUTHORIZED_CHANNEL_UPDATE = 6007,
  UNAUTHORIZED_OWNER = 6008,
  PLATFORM_FEE_EXCEEDS_MAXIMUM = 6009,
  INVALID_WITHDRAWAL_AMOUNT = 6010,
  MEMBERSHIP_NOT_FOUND = 6011,
  NOT_CHANNEL_MEMBER = 6012,
  PRIVATE_CHANNEL = 6013,
  ARITHMETIC_OVERFLOW = 6014,
  TRANSFER_FAILED = 6015,
}

// ==================== Rate Limiting ====================

class RateLimiter {
  private timestamps: Map<string, number> = new Map();
  private readonly cooldown: number;

  constructor(cooldownMs: number = 1000) {
    this.cooldown = cooldownMs;
  }

  canExecute(key: string): boolean {
    const now = Date.now();
    const lastExecution = this.timestamps.get(key);

    if (!lastExecution || now - lastExecution >= this.cooldown) {
      this.timestamps.set(key, now);
      return true;
    }

    return false;
  }

  getTimeUntilNext(key: string): number {
    const now = Date.now();
    const lastExecution = this.timestamps.get(key);

    if (!lastExecution) return 0;

    const timeElapsed = now - lastExecution;
    return Math.max(0, this.cooldown - timeElapsed);
  }
}

// Rate limiters for different operations
const joinChannelLimiter = new RateLimiter(2000); // 2 seconds
const createChannelLimiter = new RateLimiter(3000); // 3 seconds
const createProfileLimiter = new RateLimiter(3000); // 3 seconds

// ==================== Error Handling ====================

function handleProgramError(error: any): TransactionResult {
  console.error("Transaction error:", error);

  // Check for program errors
  if (error.error && error.error.errorCode) {
    const code = error.error.errorCode.number;
    const errorMessages: Record<number, string> = {
      [ErrorCode.ALREADY_INITIALIZED]: "Program is already initialized",
      [ErrorCode.CHANNEL_NAME_TOO_LONG]: "Channel name is too long (max 50 characters)",
      [ErrorCode.CHANNEL_DESCRIPTION_TOO_LONG]: "Channel description is too long (max 500 characters)",
      [ErrorCode.INVALID_CHANNEL_COST]: "Invalid channel cost amount",
      [ErrorCode.CHANNEL_NOT_FOUND]: "Channel not found",
      [ErrorCode.ALREADY_JOINED]: "You have already joined this channel",
      [ErrorCode.INSUFFICIENT_FUNDS]: "Insufficient funds to join channel",
      [ErrorCode.UNAUTHORIZED_CHANNEL_UPDATE]: "Only channel creator can update channel",
      [ErrorCode.UNAUTHORIZED_OWNER]: "Only program owner can perform this action",
      [ErrorCode.PLATFORM_FEE_EXCEEDS_MAXIMUM]: "Platform fee cannot exceed maximum allowed percentage",
      [ErrorCode.INVALID_WITHDRAWAL_AMOUNT]: "Invalid withdrawal amount",
      [ErrorCode.MEMBERSHIP_NOT_FOUND]: "Membership not found",
      [ErrorCode.NOT_CHANNEL_MEMBER]: "User is not a member of this channel",
      [ErrorCode.PRIVATE_CHANNEL]: "This is a private channel",
      [ErrorCode.ARITHMETIC_OVERFLOW]: "Arithmetic overflow occurred",
      [ErrorCode.TRANSFER_FAILED]: "Transfer failed",
    };

    return {
      success: false,
      error: errorMessages[code] || `Program error: ${error.error.errorMessage}`,
      errorCode: code,
    };
  }

  // Check for simulation errors
  if (error.message) {
    if (error.message.includes("insufficient")) {
      return {
        success: false,
        error: "Insufficient SOL balance for transaction",
      };
    }
    if (error.message.includes("blockhash")) {
      return {
        success: false,
        error: "Transaction expired. Please try again",
      };
    }
    if (error.message.includes("User rejected")) {
      return {
        success: false,
        error: "Transaction rejected by user",
      };
    }
  }

  return {
    success: false,
    error: error.message || "An unknown error occurred",
  };
}

// ==================== Account Validation ====================

async function validateConfigExists(
  program: Program<DiscordLikeProgram>
): Promise<boolean> {
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    program.programId
  );

  try {
    await program.account.config.fetch(configPda);
    return true;
  } catch {
    return false;
  }
}

async function validateProfileExists(
  program: Program<DiscordLikeProgram>,
  userPublicKey: PublicKey
): Promise<boolean> {
  const [profilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), userPublicKey.toBuffer()],
    program.programId
  );

  try {
    await program.account.profile.fetch(profilePda);
    return true;
  } catch {
    return false;
  }
}

async function validateChannelExists(
  program: Program<DiscordLikeProgram>,
  channelId: number
): Promise<boolean> {
  const [channelPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("channel"), new BN(channelId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  try {
    await program.account.channel.fetch(channelPda);
    return true;
  } catch {
    return false;
  }
}

// ==================== Provider Setup ====================

export const getProvider = (
  publicKey: PublicKey | null,
  signTransaction: unknown,
  sendTransaction: unknown
): Program<DiscordLikeProgram> | null => {
  if (!publicKey || !signTransaction) {
    console.log("Wallet not connected or missing signTransaction");
    return null;
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(
    connection,
    { publicKey, signTransaction, sendTransaction } as unknown as Wallet,
    { commitment: "processed" }
  );

  return new Program<DiscordLikeProgram>(idl as DiscordLikeProgram, provider);
};

export const getProviderReadonly = (): Program<DiscordLikeProgram> => {
  const connection = new Connection(RPC_URL, "confirmed");

  const wallet = {
    publicKey: PublicKey.default,
    signTransaction: async () => {
      throw new Error("Read-only provider cannot sign transactions.");
    },
    signAllTransaction: async () => {
      throw new Error("Read-only provider cannot sign transactions.");
    },
  };

  const provider = new AnchorProvider(
    connection,
    wallet as unknown as Wallet,
    { commitment: "processed" }
  );

  return new Program<DiscordLikeProgram>(idl as DiscordLikeProgram, provider);
};

// ==================== Initialize Program ====================

export const initializeProgram = async (
  program: Program<DiscordLikeProgram>,
  publicKey: PublicKey
): Promise<TransactionResult> => {
  try {
    // Check if already initialized
    const isInitialized = await validateConfigExists(program);
    if (isInitialized) {
      return {
        success: false,
        error: "Program is already initialized",
        errorCode: ErrorCode.ALREADY_INITIALIZED,
      };
    }

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state")],
      program.programId
    );

    const tx = await program.methods
      .initialize()
      .accountsPartial({
        config: configPda,
        owner: publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc({ skipPreflight: true, maxRetries: 3 });

    return { success: true, signature: tx };
  } catch (error) {
    return handleProgramError(error);
  }
};

// ==================== Profile Functions ====================

export const createProfile = async (
  program: Program<DiscordLikeProgram>,
  publicKey: PublicKey,
  displayName: string,
  bio: string,
  avatarUri: string
): Promise<TransactionResult> => {
  try {
    // Rate limiting
    const rateLimitKey = `create_profile_${publicKey.toBase58()}`;
    if (!createProfileLimiter.canExecute(rateLimitKey)) {
      const waitTime = createProfileLimiter.getTimeUntilNext(rateLimitKey);
      return {
        success: false,
        error: `Please wait ${Math.ceil(waitTime / 1000)} seconds before creating another profile`,
      };
    }

    // Check if profile already exists
    const profileExists = await validateProfileExists(program, publicKey);
    if (profileExists) {
      return {
        success: false,
        error: "Profile already exists for this wallet",
      };
    }

    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .createProfile(displayName, bio, avatarUri)
      .accountsPartial({
        payer: publicKey,
        profile: profilePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc({ skipPreflight: true, maxRetries: 3 });

    return { success: true, signature: tx };
  } catch (error) {
    return handleProgramError(error);
  }
};

export const getProfile = async (
  program: Program<DiscordLikeProgram>,
  publicKey: PublicKey,
  userPublicKey: PublicKey
): Promise<TransactionResult> => {
  try {
    // Validate profile exists
    const profileExists = await validateProfileExists(program, userPublicKey);
    if (!profileExists) {
      return {
        success: false,
        error: "Profile does not exist for this user",
      };
    }

    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), userPublicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .getProfile()
      .accountsPartial({
        profile: profilePda,
        user: publicKey,
      })
      .rpc({ skipPreflight: true, maxRetries: 3 });

    return { success: true, signature: tx };
  } catch (error) {
    return handleProgramError(error);
  }
};

// ==================== Channel Functions ====================

export const createChannel = async (
  program: Program<DiscordLikeProgram>,
  publicKey: PublicKey,
  name: string,
  description: string,
  cost: number,
  isPrivate: boolean,
  imgUrl: string
): Promise<TransactionResult> => {
  try {
    // Rate limiting
    const rateLimitKey = `create_channel_${publicKey.toBase58()}`;
    if (!createChannelLimiter.canExecute(rateLimitKey)) {
      const waitTime = createChannelLimiter.getTimeUntilNext(rateLimitKey);
      return {
        success: false,
        error: `Please wait ${Math.ceil(waitTime / 1000)} seconds before creating another channel`,
      };
    }

    // Validate config exists
    const configExists = await validateConfigExists(program);
    if (!configExists) {
      return {
        success: false,
        error: "Program not initialized. Please initialize first",
      };
    }

    // Validate input
    if (name.length > 50) {
      return {
        success: false,
        error: "Channel name is too long (max 50 characters)",
        errorCode: ErrorCode.CHANNEL_NAME_TOO_LONG,
      };
    }

    if (description.length > 500) {
      return {
        success: false,
        error: "Channel description is too long (max 500 characters)",
        errorCode: ErrorCode.CHANNEL_DESCRIPTION_TOO_LONG,
      };
    }

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state")],
      program.programId
    );

    const config = await program.account.config.fetch(configPda);
    const channelId = config.totalChannels.add(new BN(1));

    const [channelPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("channel"), channelId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const tx = await program.methods
      .createChannel(name, description, new BN(cost), isPrivate, imgUrl)
      .accountsPartial({
        config: configPda,
        channel: channelPda,
        creator: publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc({ skipPreflight: true, maxRetries: 3 });

    return { success: true, signature: tx };
  } catch (error) {
    return handleProgramError(error);
  }
};

export const updateChannel = async (
  program: Program<DiscordLikeProgram>,
  publicKey: PublicKey,
  channelId: number,
  name?: string,
  description?: string,
  cost?: number,
  isPrivate?: boolean
): Promise<TransactionResult> => {
  try {
    // Validate channel exists
    const channelExists = await validateChannelExists(program, channelId);
    if (!channelExists) {
      return {
        success: false,
        error: "Channel not found",
        errorCode: ErrorCode.CHANNEL_NOT_FOUND,
      };
    }

    // Validate input if provided
    if (name && name.length > 50) {
      return {
        success: false,
        error: "Channel name is too long (max 50 characters)",
        errorCode: ErrorCode.CHANNEL_NAME_TOO_LONG,
      };
    }

    if (description && description.length > 500) {
      return {
        success: false,
        error: "Channel description is too long (max 500 characters)",
        errorCode: ErrorCode.CHANNEL_DESCRIPTION_TOO_LONG,
      };
    }

    const [channelPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("channel"), new BN(channelId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const tx = await program.methods
      .updateChannel(
        new BN(channelId),
        name || null,
        description || null,
        cost !== undefined ? new BN(cost) : null,
        isPrivate !== undefined ? isPrivate : null
      )
      .accountsPartial({
        channel: channelPda,
        creator: publicKey,
      })
      .rpc({ skipPreflight: true, maxRetries: 3 });

    return { success: true, signature: tx };
  } catch (error) {
    return handleProgramError(error);
  }
};

export const deleteChannel = async (
  program: Program<DiscordLikeProgram>,
  publicKey: PublicKey,
  channelId: number
): Promise<TransactionResult> => {
  try {
    // Validate channel exists
    const channelExists = await validateChannelExists(program, channelId);
    if (!channelExists) {
      return {
        success: false,
        error: "Channel not found",
        errorCode: ErrorCode.CHANNEL_NOT_FOUND,
      };
    }

    const [channelPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("channel"), new BN(channelId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const tx = await program.methods
      .deleteChannel(new BN(channelId))
      .accountsPartial({
        channel: channelPda,
        creator: publicKey,
      })
      .rpc({ skipPreflight: true, maxRetries: 3 });

    return { success: true, signature: tx };
  } catch (error) {
    return handleProgramError(error);
  }
};

// ==================== Channel Membership Functions ====================

export const joinChannel = async (
  program: Program<DiscordLikeProgram>,
  publicKey: PublicKey,
  channelId: number,
  creatorPublicKey: PublicKey,
  feeRecipientPublicKey: PublicKey
): Promise<TransactionResult> => {
  try {
    // Rate limiting
    const rateLimitKey = `join_channel_${publicKey.toBase58()}_${channelId}`;
    if (!joinChannelLimiter.canExecute(rateLimitKey)) {
      const waitTime = joinChannelLimiter.getTimeUntilNext(rateLimitKey);
      return {
        success: false,
        error: `Please wait ${Math.ceil(waitTime / 1000)} seconds before trying to join again`,
      };
    }

    // Validate config exists
    const configExists = await validateConfigExists(program);
    if (!configExists) {
      return {
        success: false,
        error: "Program not initialized",
      };
    }

    // Validate channel exists
    const channelExists = await validateChannelExists(program, channelId);
    if (!channelExists) {
      return {
        success: false,
        error: "Channel not found",
        errorCode: ErrorCode.CHANNEL_NOT_FOUND,
      };
    }

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state")],
      program.programId
    );

    const [channelPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("channel"), new BN(channelId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [membershipPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("membership"),
        new BN(channelId).toArrayLike(Buffer, "le", 8),
        publicKey.toBuffer(),
      ],
      program.programId
    );

    const nftMint = PublicKey.findProgramAddressSync(
      [
        Buffer.from("nft_mint"),
        new BN(channelId).toArrayLike(Buffer, "le", 8),
        publicKey.toBuffer(),
      ],
      program.programId
    )[0];

    const nftTokenAccount = PublicKey.findProgramAddressSync(
      [
        publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        nftMint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];

    const tx = await program.methods
      .joinChannel(new BN(channelId))
      .accountsPartial({
        config: configPda,
        channel: channelPda,
        membership: membershipPda,
        nftMint: nftMint,
        nftTokenAccount: nftTokenAccount,
        member: publicKey,
        creator: creatorPublicKey,
        feeRecipient: feeRecipientPublicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc({ skipPreflight: true, maxRetries: 3 });

    return { success: true, signature: tx };
  } catch (error) {
    return handleProgramError(error);
  }
};

export const leaveChannel = async (
  program: Program<DiscordLikeProgram>,
  publicKey: PublicKey,
  channelId: number
): Promise<TransactionResult> => {
  try {
    // Validate channel exists
    const channelExists = await validateChannelExists(program, channelId);
    if (!channelExists) {
      return {
        success: false,
        error: "Channel not found",
        errorCode: ErrorCode.CHANNEL_NOT_FOUND,
      };
    }

    const [channelPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("channel"), new BN(channelId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [membershipPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("membership"),
        new BN(channelId).toArrayLike(Buffer, "le", 8),
        publicKey.toBuffer(),
      ],
      program.programId
    );

    const tx = await program.methods
      .leaveChannel(new BN(channelId))
      .accountsPartial({
        channel: channelPda,
        membership: membershipPda,
        member: publicKey,
      })
      .rpc({ skipPreflight: true });

    return { success: true, signature: tx };
  } catch (error) {
    return handleProgramError(error);
  }
};

// ==================== Admin Functions ====================

export const setPlatformFee = async (
  program: Program<DiscordLikeProgram>,
  publicKey: PublicKey,
  newFee: number
): Promise<TransactionResult> => {
  try {
    // Validate config exists
    const configExists = await validateConfigExists(program);
    if (!configExists) {
      return {
        success: false,
        error: "Program not initialized",
      };
    }

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state")],
      program.programId
    );

    const tx = await program.methods
      .setPlatformFee(new BN(newFee))
      .accountsPartial({
        config: configPda,
        owner: publicKey,
      })
      .rpc({ skipPreflight: true });

    return { success: true, signature: tx };
  } catch (error) {
    return handleProgramError(error);
  }
};

export const setFeeRecipient = async (
  program: Program<DiscordLikeProgram>,
  publicKey: PublicKey,
  newRecipient: PublicKey
): Promise<TransactionResult> => {
  try {
    // Validate config exists
    const configExists = await validateConfigExists(program);
    if (!configExists) {
      return {
        success: false,
        error: "Program not initialized",
      };
    }

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state")],
      program.programId
    );

    const tx = await program.methods
      .setFeeRecipient(newRecipient)
      .accountsPartial({
        config: configPda,
        owner: publicKey,
      })
      .rpc({ skipPreflight: true });

    return { success: true, signature: tx };
  } catch (error) {
    return handleProgramError(error);
  }
};

export const withdraw = async (
  program: Program<DiscordLikeProgram>,
  publicKey: PublicKey,
  recipientPublicKey: PublicKey,
  amount: number
): Promise<TransactionResult> => {
  try {
    // Validate config exists
    const configExists = await validateConfigExists(program);
    if (!configExists) {
      return {
        success: false,
        error: "Program not initialized",
      };
    }

    if (amount <= 0) {
      return {
        success: false,
        error: "Invalid withdrawal amount",
        errorCode: ErrorCode.INVALID_WITHDRAWAL_AMOUNT,
      };
    }

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state")],
      program.programId
    );

    const tx = await program.methods
      .withdraw(new BN(amount))
      .accountsPartial({
        config: configPda,
        owner: publicKey,
        recipient: recipientPublicKey,
      })
      .rpc({ skipPreflight: true });

    return { success: true, signature: tx };
  } catch (error) {
    return handleProgramError(error);
  }
};

// ==================== Fetch Functions ====================

export const fetchConfig = async (program: Program<DiscordLikeProgram>) => {
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    program.programId
  );

  try {
    return await program.account.config.fetch(configPda);
  } catch (error) {
    console.error("Error fetching config:", error);
    return null;
  }
};

export const fetchProfile = async (
  program: Program<DiscordLikeProgram>,
  userPublicKey: PublicKey
) => {
  const [profilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), userPublicKey.toBuffer()],
    program.programId
  );

  try {
    return await program.account.profile.fetch(profilePda);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};

export const fetchChannel = async (
  program: Program<DiscordLikeProgram>,
  channelId: number
) => {
  const [channelPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("channel"), new BN(channelId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  try {
    return await program.account.channel.fetch(channelPda);
  } catch (error) {
    console.error("Error fetching channel:", error);
    return null;
  }
};

export const fetchAllChannels = async (program: Program<DiscordLikeProgram>) => {
  try {
    return await program.account.channel.all();
  } catch (error) {
    console.error("Error fetching all channels:", error);
    return [];
  }
};

export const fetchAllProfiles = async (program: Program<DiscordLikeProgram>) => {
  try {
    return await program.account.profile.all();
  } catch (error) {
    console.error("Error fetching all profiles:", error);
    return [];
  }
};

export const fetchUserChannels = async (
  program: Program<DiscordLikeProgram>,
  userPublicKey: PublicKey
) => {
  try {
    const allChannels = await program.account.channel.all();
    return allChannels.filter((channel) =>
      channel.account.creator.equals(userPublicKey)
    );
  } catch (error) {
    console.error("Error fetching user channels:", error);
    return [];
  }
};

export const fetchMembership = async (
  program: Program<DiscordLikeProgram>,
  channelId: number,
  memberPublicKey: PublicKey
) => {
  const [membershipPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("membership"),
      new BN(channelId).toArrayLike(Buffer, "le", 8),
      memberPublicKey.toBuffer(),
    ],
    program.programId
  );

  try {
    return await program.account.membership.fetch(membershipPda);
  } catch (error) {
    console.error("Error fetching membership:", error);
    return null;
  }
};

export const fetchChannelMembers = async (
  program: Program<DiscordLikeProgram>,
  channelId: number
) => {
  try {
    const allMemberships = await program.account.membership.all();
    return allMemberships.filter(
      (membership) =>
        membership.account.channelId.toNumber() === channelId &&
        membership.account.joined
    );
  } catch (error) {
    console.error("Error fetching channel members:", error);
    return [];
  }
};

export const fetchUserMemberships = async (
  program: Program<DiscordLikeProgram>,
  userPublicKey: PublicKey
) => {
  try {
    const allMemberships = await program.account.membership.all();
    return allMemberships.filter(
      (membership) =>
        membership.account.member.equals(userPublicKey) &&
        membership.account.joined
    );
  } catch (error) {
    console.error("Error fetching user memberships:", error);
    return [];
  }
};

// ==================== Check Functions ====================

export const checkIfMember = async (
  program: Program<DiscordLikeProgram>,
  channelId: number,
  memberPublicKey: PublicKey
): Promise<boolean> => {
  const membership = await fetchMembership(program, channelId, memberPublicKey);
  return membership !== null && membership.joined;
};

export const checkIfChannelExists = async (
  program: Program<DiscordLikeProgram>,
  channelId: number
): Promise<boolean> => {
  const channel = await fetchChannel(program, channelId);
  return channel !== null;
};

export const checkIfProfileExists = async (
  program: Program<DiscordLikeProgram>,
  userPublicKey: PublicKey
): Promise<boolean> => {
  const profile = await fetchProfile(program, userPublicKey);
  return profile !== null;
};