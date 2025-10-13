use anchor_lang::prelude::*;

#[account]
pub struct Profile {
    pub owner: Pubkey,         // user’s wallet
    pub display_name: String,  // nickname or username
    pub bio: String,           // short user bio
    pub avatar_uri: String,    // optional pfp or NFT image link
    pub created_at: i64,
}

impl Profile {
    pub const MAX_SIZE: u64 = 32 + (4 + 50) + (4 + 200) + (4 + 200) + 8;
}
