use anchor_lang::prelude::*;
use crate::constants::{CHANNEL_SEED, MEMBERSHIP_SEED};
use crate::errors::ErrorCode;
use crate::states::{Channel, Membership};

pub fn leave_channel(ctx: Context<LeaveChannelCtx>, channel_id: u64) -> Result<()> {
    let channel = &mut ctx.accounts.channel;
    let membership = &mut ctx.accounts.membership;
    let member = &ctx.accounts.member;

    // Verify channel and membership
    if channel.id != channel_id {
        return Err(ErrorCode::ChannelNotFound.into());
    }

    if membership.channel_id != channel_id || membership.member != member.key() {
        return Err(ErrorCode::MembershipNotFound.into());
    }

    if !membership.joined {
        return Err(ErrorCode::NotChannelMember.into());
    }

    // Update membership status
    membership.joined = false;

    // Decrement channel member count
    channel.member_count = channel.member_count
        .checked_sub(1)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    emit!(ChannelLeft {
        channel_id,
        member: member.key(),
        left_at: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(channel_id: u64)]
pub struct LeaveChannelCtx<'info> {
    #[account(
        mut,
        seeds = [
            CHANNEL_SEED,
            channel_id.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub channel: Account<'info, Channel>,

    #[account(
        mut,
        seeds = [
            MEMBERSHIP_SEED,
            channel_id.to_le_bytes().as_ref(),
            member.key().as_ref()
        ],
        bump,
        constraint = membership.member == member.key() @ ErrorCode::NotChannelMember,
        constraint = membership.joined @ ErrorCode::NotChannelMember
    )]
    pub membership: Account<'info, Membership>,

    pub member: Signer<'info>,
}

#[event]
pub struct ChannelLeft {
    pub channel_id: u64,
    pub member: Pubkey,
    pub left_at: i64,
}