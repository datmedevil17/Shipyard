use anchor_lang::prelude::*;
use crate::states::*;

#[derive(Accounts)]
pub struct GetProfileCtx<'info> {
    #[account(
        seeds = [b"profile", user.key().as_ref()],
        bump,
    )]
    pub profile: Account<'info, Profile>,
    pub user: Signer<'info>,
}

pub fn get_profile(ctx: Context<GetProfileCtx>) -> Result<()> {
    let profile = &ctx.accounts.profile;
    msg!("Display Name: {}", profile.display_name);
    msg!("Bio: {}", profile.bio);
    msg!("Avatar: {}", profile.avatar_uri);
    Ok(())
}
