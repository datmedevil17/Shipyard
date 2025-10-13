// states/channel.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Channel {
    pub id: u64,
    #[max_len(64)]
    pub name: String,
    #[max_len(512)]
    pub description: String,
    pub cost: u64, // in lamports
    pub creator: Pubkey,
    pub is_private: bool,
    pub member_count: u64,
    pub created_at: i64,
    pub updated_at: i64,
    #[max_len(256)]
    pub img_url: String,
    pub poll_count: u64, // Track number of polls created
}