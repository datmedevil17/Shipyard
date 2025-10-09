use anchor_lang::prelude::*;
use crate::constants::{
    ANCHOR_DISCRIMINATOR_SIZE, 
    CHANNEL_SEED, 
    STATE_SEED,
    MAX_CHANNEL_NAME_LENGTH,
    MAX_CHANNEL_DESCRIPTION_LENGTH,
    MIN_CHANNEL_COST
};
use crate::errors::ErrorCode;
use crate::states::{Channel, Config};

pub fn create_channel(
    ctx: Context<CreateChannelCtx>,
    name: String,
    description: String,
    cost: u64,
    is_private: bool,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let channel = &mut ctx.accounts.channel;
    let creator = &ctx.accounts.creator;

    // Validation
    if name.len() > MAX_CHANNEL_NAME_LENGTH {
        return Err(ErrorCode::ChannelNameTooLong.into());
    }

    if description.len() > MAX_CHANNEL_DESCRIPTION_LENGTH {
        return Err(ErrorCode::ChannelDescriptionTooLong.into());
    }

    if cost < MIN_CHANNEL_COST {
        return Err(ErrorCode::InvalidChannelCost.into());
    }

    // Increment total channels counter
    config.total_channels = config.total_channels
        .checked_add(1)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    // Initialize channel
    let channel_id = config.total_channels;
    let current_time = Clock::get()?.unix_timestamp;

    channel.id = channel_id;
    channel.name = name.clone();
    channel.description = description.clone();
    channel.cost = cost;
    channel.creator = creator.key();
    channel.is_private = is_private;
    channel.member_count = 0;
    channel.created_at = current_time;
    channel.updated_at = current_time;

    emit!(ChannelCreated {
        channel_id,
        name,
        description,
        cost,
        creator: creator.key(),
        is_private,
        created_at: current_time,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String, description: String, cost: u64, is_private: bool)]
pub struct CreateChannelCtx<'info> {
    #[account(
        mut,
        seeds = [STATE_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = creator,
        space = ANCHOR_DISCRIMINATOR_SIZE + Channel::INIT_SPACE,
        seeds = [
            CHANNEL_SEED,
            (config.total_channels + 1).to_le_bytes().as_ref()
        ],
        bump
    )]
    pub channel: Account<'info, Channel>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[event]
pub struct ChannelCreated {
    pub channel_id: u64,
    pub name: String,
    pub description: String,
    pub cost: u64,
    pub creator: Pubkey,
    pub is_private: bool,
    pub created_at: i64,
}