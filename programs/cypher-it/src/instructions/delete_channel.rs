use anchor_lang::prelude::*;
use crate::constants::CHANNEL_SEED;
use crate::errors::ErrorCode;
use crate::states::Channel;

pub fn delete_channel(ctx: Context<DeleteChannelCtx>, channel_id: u64) -> Result<()> {
    let channel = &ctx.accounts.channel;
    let creator = &ctx.accounts.creator;

    // Verify channel ID matches
    if channel.id != channel_id {
        return Err(ErrorCode::ChannelNotFound.into());
    }

    // Only channel creator can delete
    if channel.creator != creator.key() {
        return Err(ErrorCode::UnauthorizedChannelUpdate.into());
    }

    emit!(ChannelDeleted {
        channel_id,
        creator: creator.key(),
        deleted_at: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(channel_id: u64)]
pub struct DeleteChannelCtx<'info> {
    #[account(
        mut,
        seeds = [
            CHANNEL_SEED,
            channel_id.to_le_bytes().as_ref()
        ],
        bump,
        constraint = channel.creator == creator.key() @ ErrorCode::UnauthorizedChannelUpdate,
        close = creator
    )]
    pub channel: Account<'info, Channel>,

    #[account(mut)]
    pub creator: Signer<'info>,
}

#[event]
pub struct ChannelDeleted {
    pub channel_id: u64,
    pub creator: Pubkey,
    pub deleted_at: i64,
}