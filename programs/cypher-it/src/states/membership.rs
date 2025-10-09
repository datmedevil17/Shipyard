use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Membership {
    pub channel_id: u64,
    pub member: Pubkey,
    pub joined: bool,
    pub joined_at: i64,
    pub nft_mint: Option<Pubkey>, // Optional NFT mint for membership
}