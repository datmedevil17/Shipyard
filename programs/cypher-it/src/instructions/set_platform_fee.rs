use anchor_lang::prelude::*;
use crate::constants::{STATE_SEED, MAX_PLATFORM_FEE};
use crate::errors::ErrorCode;
use crate::states::Config;

pub fn set_platform_fee(ctx: Context<SetPlatformFeeCtx>, new_fee: u64) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let owner = &ctx.accounts.owner;

    // Only program owner can set platform fee
    if config.owner != owner.key() {
        return Err(ErrorCode::UnauthorizedOwner.into());
    }

    // Validate fee is within acceptable range
    if new_fee > MAX_PLATFORM_FEE {
        return Err(ErrorCode::PlatformFeeExceedsMaximum.into());
    }

    let old_fee = config.platform_fee;
    config.platform_fee = new_fee;

    emit!(PlatformFeeUpdated {
        owner: owner.key(),
        old_fee,
        new_fee,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct SetPlatformFeeCtx<'info> {
    #[account(
        mut,
        seeds = [STATE_SEED],
        bump,
        constraint = config.owner == owner.key() @ ErrorCode::UnauthorizedOwner
    )]
    pub config: Account<'info, Config>,

    pub owner: Signer<'info>,
}

#[event]
pub struct PlatformFeeUpdated {
    pub owner: Pubkey,
    pub old_fee: u64,
    pub new_fee: u64,
}