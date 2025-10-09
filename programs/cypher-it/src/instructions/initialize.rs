use anchor_lang::prelude::*;
use crate::constants::{ANCHOR_DISCRIMINATOR_SIZE, STATE_SEED};
use crate::errors::ErrorCode;
use crate::states::Config;

pub fn initialize(ctx: Context<InitializeCtx>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let owner = &ctx.accounts.owner;

    if config.initialized {
        return Err(ErrorCode::AlreadyInitialized.into());
    }

    config.initialized = true;
    config.total_channels = 0;
    config.platform_fee = 5; // 5% default platform fee
    config.fee_recipient = owner.key();
    config.owner = owner.key();

    emit!(ConfigInitialized {
        owner: owner.key(),
        platform_fee: 5,
        fee_recipient: owner.key(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeCtx<'info> {
    #[account(
        init,
        payer = owner,
        space = ANCHOR_DISCRIMINATOR_SIZE + Config::INIT_SPACE,
        seeds = [STATE_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[event]
pub struct ConfigInitialized {
    pub owner: Pubkey,
    pub platform_fee: u64,
    pub fee_recipient: Pubkey,
}