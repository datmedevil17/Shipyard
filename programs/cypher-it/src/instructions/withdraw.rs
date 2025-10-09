use anchor_lang::prelude::*;
use crate::constants::STATE_SEED;
use crate::errors::ErrorCode;
use crate::states::Config;

pub fn withdraw(ctx: Context<WithdrawCtx>, amount: u64) -> Result<()> {
    let config = &ctx.accounts.config;
    let owner = &ctx.accounts.owner;
    let recipient = &ctx.accounts.recipient;

    // Only program owner can withdraw
    if config.owner != owner.key() {
        return Err(ErrorCode::UnauthorizedOwner.into());
    }

    // Validate withdrawal amount
    if amount == 0 {
        return Err(ErrorCode::InvalidWithdrawalAmount.into());
    }

    let recipient_info = recipient.to_account_info();
    let available_balance = recipient_info.lamports();

    if amount > available_balance {
        return Err(ErrorCode::InvalidWithdrawalAmount.into());
    }

    // Perform withdrawal
    **recipient_info.try_borrow_mut_lamports()? = available_balance
        .checked_sub(amount)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    **owner.to_account_info().try_borrow_mut_lamports()? = owner
        .to_account_info()
        .lamports()
        .checked_add(amount)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    emit!(Withdraw {
        owner: owner.key(),
        recipient: recipient.key(),
        amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawCtx<'info> {
    #[account(
        seeds = [STATE_SEED],
        bump,
        constraint = config.owner == owner.key() @ ErrorCode::UnauthorizedOwner
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: Can be any account that holds lamports for withdrawal
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
}

#[event]
pub struct Withdraw {
    pub owner: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}