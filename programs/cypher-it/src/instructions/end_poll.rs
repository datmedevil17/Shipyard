// instructions/end_poll.rs
use anchor_lang::prelude::*;
use crate::states::{Poll, Channel, Membership};
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct EndPollCtx<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub poll: Account<'info, Poll>,

    #[account(
        seeds = [b"channel", poll.channel_id.to_le_bytes().as_ref()],
        bump ,
    )]
    pub channel: Account<'info, Channel>,

    // Optional: target membership for kick/mute actions
    #[account(mut)]
    pub target_membership: Option<Account<'info, Membership>>,

    pub system_program: Program<'info, System>,
}

pub fn end_poll(ctx: Context<EndPollCtx>) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    let clock = Clock::get()?;

    // Only creator or channel owner can end poll, or it must be past end time
    require!(
        poll.creator == ctx.accounts.user.key() 
        || ctx.accounts.channel.creator == ctx.accounts.user.key()
        || clock.unix_timestamp > poll.end_time,
        ErrorCode::Unauthorized
    );

    // Check if poll is already ended
    require!(!poll.ended, ErrorCode::PollAlreadyEnded);

    poll.ended = true;

    // Execute poll action based on type and results
    if poll.poll_type == 0 || poll.poll_type == 1 {
        // Kick or Mute poll
        if poll.votes.len() >= 2 {
            let yes_votes = poll.votes[0];
            let no_votes = poll.votes[1];

            // Check if "Yes" wins and meets required votes
            if yes_votes > no_votes && poll.total_votes >= poll.required_votes {
                msg!("Poll passed! Action will be executed.");
                
                // Execute action based on poll type
                match poll.poll_type {
                    0 => {
                        // Kick user - handled by target_membership
                        if let Some(membership) = &ctx.accounts.target_membership {
                            require!(
                                membership.member == poll.target.unwrap(),
                                ErrorCode::InvalidTarget
                            );
                            // Actual kick logic would go here
                            msg!("User kicked from channel");
                        }
                    }
                    1 => {
                        // Mute user - handled by target_membership
                        if let Some(membership) = &mut ctx.accounts.target_membership {
                            require!(
                                membership.member == poll.target.unwrap(),
                                ErrorCode::InvalidTarget
                            );
                            // Set mute flag or timestamp
                            msg!("User muted in channel");
                        }
                    }
                    _ => {}
                }
            } else {
                msg!("Poll did not pass. No action taken.");
            }
        }
    }

    msg!("Poll ended. Total votes: {}", poll.total_votes);
    Ok(())
}