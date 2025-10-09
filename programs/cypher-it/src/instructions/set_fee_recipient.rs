use anchor_lang::prelude::*;
use crate::constants::STATE_SEED;
use crate::errors::ErrorCode;
use crate::states::Config;

pub fn set_fee_recipient(ctx: Context<SetFeeRecipientCtx>, new_recipient: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let owner = &ctx.accounts.owner;

    // Only program owner can set fee recipient
    if config.owner != owner.key() {
        return Err(ErrorCode::UnauthorizedOwner.into());
    }

    let old_recipient = config.fee_recipient;
    config.fee_recipient = new_recipient;

    emit!(FeeRecipientUpdated {
        owner: owner.key(),
        old_recipient,
        new_recipient,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct SetFeeRecipientCtx<'info> {
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
pub struct FeeRecipientUpdated {
    pub owner: Pubkey,
    pub old_recipient: Pubkey,
    pub new_recipient: Pubkey,
}