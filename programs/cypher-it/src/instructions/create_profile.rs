use anchor_lang::prelude::*;
use crate::states::*;

#[derive(Accounts)]
pub struct CreateProfileCtx<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + Profile::MAX_SIZE as usize,
        seeds = [b"profile", payer.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, Profile>,
    pub system_program: Program<'info, System>,
}

pub fn create_profile(
    ctx: Context<CreateProfileCtx>,
    display_name: String,
    bio: String,
    avatar_uri: String,
) -> Result<()> {
    let profile = &mut ctx.accounts.profile;

    profile.owner = ctx.accounts.payer.key();
    profile.display_name = display_name;
    profile.bio = bio;
    profile.avatar_uri = avatar_uri;
    profile.created_at = Clock::get()?.unix_timestamp;

    Ok(())
}
