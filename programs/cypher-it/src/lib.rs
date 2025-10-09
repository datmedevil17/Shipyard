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
    ) -> Result<()> {
        instructions::create_channel::create_channel(ctx, name, description, cost, is_private)
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
}