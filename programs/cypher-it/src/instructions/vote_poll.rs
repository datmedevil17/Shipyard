// instructions/vote_poll.rs
use anchor_lang::prelude::*;
use crate::states::{Poll, Membership, Channel};
use crate::errors::ErrorCode;

#[derive(Accounts)]
#[instruction(channel_id: u64)]
pub struct VotePollCtx<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        seeds = [b"channel", channel_id.to_le_bytes().as_ref()],
        bump ,
    )]
    pub channel: Account<'info, Channel>,

    #[account(
        seeds = [b"membership", voter.key().as_ref(), channel.key().as_ref()],
        bump ,
    )]
    pub membership: Account<'info, Membership>,

    #[account(mut)]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

pub fn vote_poll(
    ctx: Context<VotePollCtx>,
    channel_id: u64,
    option_index: u64,
) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    let voter = ctx.accounts.voter.key();
    let clock = Clock::get()?;

    // Verify membership
    require!(
        ctx.accounts.membership.channel_id == channel_id,
        ErrorCode::NotMember
    );

    // Check if poll belongs to this channel
    require!(
        poll.channel_id == channel_id,
        ErrorCode::InvalidChannel
    );

    // Check if user has already voted
    require!(
        !poll.has_voted(&voter),
        ErrorCode::AlreadyVoted
    );

    // Check if poll is active
    require!(
        poll.can_vote(clock.unix_timestamp),
        ErrorCode::PollNotActive
    );

    // Validate option index
    require!(
        option_index < poll.options.len() as u64,
        ErrorCode::InvalidOption
    );

    // Add vote
    poll.add_vote(voter, option_index)?;

    msg!(
        "Vote recorded: User {} voted for option {} in poll",
        voter,
        option_index
    );

    Ok(())
}