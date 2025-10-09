use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub initialized: bool,
    pub total_channels: u64,
    pub platform_fee: u64, // Percentage (0-50)
    pub fee_recipient: Pubkey,
    pub owner: Pubkey,
}