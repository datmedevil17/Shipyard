use crate::constants::{MAX_CHANNEL_NAME_LENGTH, MAX_CHANNEL_DESCRIPTION_LENGTH, MIN_CHANNEL_COST};
use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

pub fn validate_channel_name(name: &str) -> Result<()> {
    if name.is_empty() {
        return Err(ErrorCode::ChannelNameTooLong.into());
    }
    if name.len() > MAX_CHANNEL_NAME_LENGTH {
        return Err(ErrorCode::ChannelNameTooLong.into());
    }
    Ok(())
}

pub fn validate_channel_description(description: &str) -> Result<()> {
    if description.len() > MAX_CHANNEL_DESCRIPTION_LENGTH {
        return Err(ErrorCode::ChannelDescriptionTooLong.into());
    }
    Ok(())
}

pub fn validate_channel_cost(cost: u64) -> Result<()> {
    if cost < MIN_CHANNEL_COST {
        return Err(ErrorCode::InvalidChannelCost.into());
    }
    Ok(())
}

pub fn validate_platform_fee(fee: u64, max_fee: u64) -> Result<()> {
    if fee > max_fee {
        return Err(ErrorCode::PlatformFeeExceedsMaximum.into());
    }
    Ok(())
}