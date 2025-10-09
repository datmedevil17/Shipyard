pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

// String length limits
pub const MAX_CHANNEL_NAME_LENGTH: usize = 64;
pub const MAX_CHANNEL_DESCRIPTION_LENGTH: usize = 512;

// Platform fee limits
pub const MAX_PLATFORM_FEE: u64 = 50; // 50%

// Seeds for PDAs
pub const STATE_SEED: &[u8] = b"state";
pub const CHANNEL_SEED: &[u8] = b"channel";
pub const MEMBERSHIP_SEED: &[u8] = b"membership";
pub const NFT_MINT_SEED: &[u8] = b"nft_mint";

// Minimum costs
pub const MIN_CHANNEL_COST: u64 = 1_000_000; // 0.001 SOL in lamports