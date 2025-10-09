use anchor_lang::prelude::*;
use crate::constants::{
    CHANNEL_SEED,
    MAX_CHANNEL_NAME_LENGTH,
    MAX_CHANNEL_DESCRIPTION_LENGTH,
    MIN_CHANNEL_COST
};
use crate::errors::ErrorCode;
use crate::states::Channel;

pub fn update_channel(
    ctx: Context<UpdateChannelCtx>,
    channel_id: u64,
    name: Option<String>,
    description: Option<String>,
    cost: Option<u64>,
    is_private: Option<bool>,
) -> Result<()> {
    let channel = &mut ctx.accounts.channel;
    let creator = &ctx.accounts.creator;

    // Verify channel ID matches
    if channel.id != channel_id {
        return Err(ErrorCode::ChannelNotFound.into());
    }

    // Only channel creator can update
    if channel.creator != creator.key() {
        return Err(ErrorCode::UnauthorizedChannelUpdate.into());
    }

    let mut updated_fields = Vec::new();

    // Update name if provided
    if let Some(new_name) = name {
        if new_name.len() > MAX_CHANNEL_NAME_LENGTH {
            return Err(ErrorCode::ChannelNameTooLong.into());
        }
        channel.name = new_name.clone();
        updated_fields.push(format!("name: {}", new_name));
    }

    // Update description if provided
    if let Some(new_description) = description {
        if new_description.len() > MAX_CHANNEL_DESCRIPTION_LENGTH {
            return Err(ErrorCode::ChannelDescriptionTooLong.into());
        }
        channel.description = new_description.clone();
        updated_fields.push(format!("description: {}", new_description));
    }

    // Update cost if provided
    if let Some(new_cost) = cost {
        if new_cost < MIN_CHANNEL_COST {
            return Err(ErrorCode::InvalidChannelCost.into());
        }
        channel.cost = new_cost;
        updated_fields.push(format!("cost: {}", new_cost));
    }

    // Update privacy if provided
    if let Some(new_is_private) = is_private {
        channel.is_private = new_is_private;
        updated_fields.push(format!("is_private: {}", new_is_private));
    }

    // Update timestamp
    channel.updated_at = Clock::get()?.unix_timestamp;

    emit!(ChannelUpdated {
        channel_id,
        creator: creator.key(),
        updated_fields: updated_fields.join(", "),
        updated_at: channel.updated_at,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(channel_id: u64)]
pub struct UpdateChannelCtx<'info> {
    #[account(
        mut,
        seeds = [
            CHANNEL_SEED,
            channel_id.to_le_bytes().as_ref()
        ],
        bump,
        constraint = channel.creator == creator.key() @ ErrorCode::UnauthorizedChannelUpdate
    )]
    pub channel: Account<'info, Channel>,

    pub creator: Signer<'info>,
}

#[event]
pub struct ChannelUpdated {
    pub channel_id: u64,
    pub creator: Pubkey,
    pub updated_fields: String,
    pub updated_at: i64,
}