// instructions/create_poll.rs
use anchor_lang::prelude::*;
use crate::states::{Channel, Membership, Poll, Config, Profile};
use crate::errors::ErrorCode;

#[derive(Accounts)]
#[instruction(channel_id: u64, poll_type: u8)]
pub struct CreatePollCtx<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"channel", channel_id.to_le_bytes().as_ref()],
        bump
    )]
    pub channel: Account<'info, Channel>,

    #[account(
        seeds = [b"membership", creator.key().as_ref(), channel.key().as_ref()],
        bump 
    )]
    pub membership: Account<'info, Membership>,

    #[account(
        seeds = [b"profile", creator.key().as_ref()],
        bump 
    )]
    pub profile: Account<'info, Profile>,

    #[account(
        init,
        payer = creator,
        space = 8 + Poll::INIT_SPACE,
        seeds = [b"poll", channel.key().as_ref(), &channel.poll_count.to_le_bytes()],
        bump,
    )]
    pub poll: Account<'info, Poll>,

    // Optional target user for kick/mute polls
    pub target_profile: Option<Account<'info, Profile>>,

    #[account(
        seeds = [b"config"],
        bump 
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

pub fn create_poll(
    ctx: Context<CreatePollCtx>,
    channel_id: u64,
    poll_type: u8,
    question: String,
    options: Vec<String>,
    duration: i64, // Duration in seconds
) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    let channel = &mut ctx.accounts.channel;
    let clock = Clock::get()?;

    // Verify membership
    require!(
        ctx.accounts.membership.channel_id == channel_id,
        ErrorCode::NotMember
    );

    // Validate poll type and setup accordingly
    match poll_type {
        0 => {
            // Kick user poll
            require!(
                ctx.accounts.target_profile.is_some(),
                ErrorCode::MissingTarget
            );
            let target = ctx.accounts.target_profile.as_ref().unwrap();
            
            poll.channel_id = channel_id;
            poll.creator = ctx.accounts.creator.key();
            poll.poll_question = format!("Kick {} from the channel?", target.display_name);
            poll.poll_type = poll_type;
            poll.options = vec!["Yes".to_string(), "No".to_string()];
            poll.votes = vec![0; 2];
            poll.total_votes = 0;
            poll.start_time = clock.unix_timestamp;
            poll.end_time = clock.unix_timestamp + duration;
            poll.required_votes = (channel.member_count / 2) as u64 + 1; // Simple majority
            poll.target = Some(target.owner);
            poll.voted = vec![];
            poll.ended = false;
            poll.bump = ctx.bumps.poll;
        }
        1 => {
            // Mute user poll
            require!(
                ctx.accounts.target_profile.is_some(),
                ErrorCode::MissingTarget
            );
            let target = ctx.accounts.target_profile.as_ref().unwrap();
            
            poll.channel_id = channel_id;
            poll.creator = ctx.accounts.creator.key();
            poll.poll_question = format!("Mute {} in the channel?", target.display_name);
            poll.poll_type = poll_type;
            poll.options = vec!["Yes".to_string(), "No".to_string()];
            poll.votes = vec![0; 2];
            poll.total_votes = 0;
            poll.start_time = clock.unix_timestamp;
            poll.end_time = clock.unix_timestamp + duration;
            poll.required_votes = (channel.member_count / 2) as u64 + 1;
            poll.target = Some(target.owner);
            poll.voted = vec![];
            poll.ended = false;
            poll.bump = ctx.bumps.poll;
        }
        2 => {
            // Normal poll
            require!(options.len() >= 2, ErrorCode::InsufficientOptions);
            require!(options.len() <= 10, ErrorCode::TooManyOptions);
            require!(!question.is_empty(), ErrorCode::EmptyQuestion);
            require!(question.len() <= 200, ErrorCode::QuestionTooLong);
            
            let votes_vec = vec![0; options.len()];
            
            poll.channel_id = channel_id;
            poll.creator = ctx.accounts.creator.key();
            poll.poll_question = question;
            poll.poll_type = poll_type;
            poll.options = options;
            poll.votes = votes_vec;
            poll.total_votes = 0;
            poll.start_time = clock.unix_timestamp;
            poll.end_time = clock.unix_timestamp + duration;
            poll.required_votes = 0; // No required votes for normal polls
            poll.target = None;
            poll.voted = vec![];
            poll.ended = false;
            poll.bump = ctx.bumps.poll;
        }
        _ => return Err(ErrorCode::InvalidPollType.into()),
    }

    // Increment channel poll count
    channel.poll_count = channel.poll_count.checked_add(1).unwrap();
    channel.updated_at = clock.unix_timestamp;

    msg!("Poll created successfully for channel: {}", channel_id);
    Ok(())
}