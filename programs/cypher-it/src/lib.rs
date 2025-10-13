#![allow(unexpected_cfgs)]
#![allow(deprecated)]
use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod states;
pub mod utils;

use instructions::*;

declare_id!("2QZ6YQeJmAfg6iWe76amzgfEHZsGBUXtC41a4reCiqPC");

#[program]
pub mod discord_like_program {
    use super::*;

    pub fn initialize(ctx: Context<InitializeCtx>) -> Result<()> {
        instructions::initialize::initialize(ctx)
    }

    pub fn create_channel(
        ctx: Context<CreateChannelCtx>,
        name: String,
        description: String,
        cost: u64,
        is_private: bool,
        img_url: String,
    ) -> Result<()> {
        instructions::create_channel::create_channel(ctx, name, description, img_url, cost, is_private)
    }

    pub fn join_channel(ctx: Context<JoinChannelCtx>, channel_id: u64) -> Result<()> {
        instructions::join_channel::join_channel(ctx, channel_id)
    }

    pub fn update_channel(
        ctx: Context<UpdateChannelCtx>,
        channel_id: u64,
        name: Option<String>,
        description: Option<String>,
        cost: Option<u64>,
        is_private: Option<bool>,
    ) -> Result<()> {
        instructions::update_channel::update_channel(ctx, channel_id, name, description, cost, is_private)
    }

    pub fn set_platform_fee(ctx: Context<SetPlatformFeeCtx>, new_fee: u64) -> Result<()> {
        instructions::set_platform_fee::set_platform_fee(ctx, new_fee)
    }

    pub fn set_fee_recipient(ctx: Context<SetFeeRecipientCtx>, new_recipient: Pubkey) -> Result<()> {
        instructions::set_fee_recipient::set_fee_recipient(ctx, new_recipient)
    }

    pub fn withdraw(ctx: Context<WithdrawCtx>, amount: u64) -> Result<()> {
        instructions::withdraw::withdraw(ctx, amount)
    }

    pub fn leave_channel(ctx: Context<LeaveChannelCtx>, channel_id: u64) -> Result<()> {
        instructions::leave_channel::leave_channel(ctx, channel_id)
    }

    pub fn delete_channel(ctx: Context<DeleteChannelCtx>, channel_id: u64) -> Result<()> {
        instructions::delete_channel::delete_channel(ctx, channel_id)
    }

    pub fn create_profile(
        ctx: Context<CreateProfileCtx>,
        display_name: String,
        bio: String,
        avatar_uri: String,
    ) -> Result<()> {
        instructions::create_profile::create_profile(ctx, display_name, bio, avatar_uri)
    }

    pub fn get_profile(ctx: Context<GetProfileCtx>) -> Result<()> {
        instructions::get_profile::get_profile(ctx)
    }

    // Poll instructions
    pub fn create_poll(
        ctx: Context<CreatePollCtx>,
        channel_id: u64,
        poll_type: u8,
        question: String,
        options: Vec<String>,
        duration: i64,
    ) -> Result<()> {
        instructions::create_poll::create_poll(ctx, channel_id, poll_type, question, options, duration)
    }

    pub fn vote_poll(
        ctx: Context<VotePollCtx>,
        channel_id: u64,
        option_index: u64,
    ) -> Result<()> {
        instructions::vote_poll::vote_poll(ctx, channel_id, option_index)
    }

    pub fn end_poll(ctx: Context<EndPollCtx>) -> Result<()> {
        instructions::end_poll::end_poll(ctx)
    }

    pub fn delegate_poll(
        ctx: Context<DelegatePollCtx>,
        channel_id: u64,
        poll_index: u64,
    ) -> Result<()> {
        instructions::delegate_poll::delegate_poll(ctx, channel_id, poll_index)
    }

    pub fn undelegate_poll(ctx: Context<UndelegatePollCtx>) -> Result<()> {
        ctx.accounts.undelegate_poll()
    }
}