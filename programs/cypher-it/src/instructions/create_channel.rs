use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, initialize_mint, mint_to, Mint, MintTo, Token, TokenAccount};
use crate::constants::{
    ANCHOR_DISCRIMINATOR_SIZE, 
    CHANNEL_SEED,
    MEMBERSHIP_SEED,
    STATE_SEED,
    MAX_CHANNEL_NAME_LENGTH,
    MAX_CHANNEL_DESCRIPTION_LENGTH,
    MIN_CHANNEL_COST
};
use crate::errors::ErrorCode;
use crate::states::{Channel, Config, Membership};

pub fn create_channel(
    ctx: Context<CreateChannelCtx>,
    name: String,
    description: String,
    img_url: String,
    cost: u64,
    is_private: bool,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let channel = &mut ctx.accounts.channel;
    let membership = &mut ctx.accounts.membership;
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
    channel.member_count = 1; // Creator is automatically a member
    channel.created_at = current_time;
    channel.updated_at = current_time;
    channel.img_url = img_url.clone();

    // Initialize creator's membership
    membership.channel_id = channel_id;
    membership.member = creator.key();
    membership.joined = true;
    membership.joined_at = current_time;

    // Seeds for PDA signing
    let channel_id_bytes = channel_id.to_le_bytes();
    let creator_key = creator.key();
    let seeds = &[
        MEMBERSHIP_SEED,
        channel_id_bytes.as_ref(),
        creator_key.as_ref(),
        &[ctx.bumps.membership],
    ];
    let signer = &[&seeds[..]];

    // Initialize the NFT mint (decimals = 0, authority = membership)
    initialize_mint(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::InitializeMint {
                mint: ctx.accounts.nft_mint.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        0, // decimals
        &membership.key(),
        Some(&membership.key()),
    )?;

    // Create associated token account for the creator
    anchor_spl::associated_token::create(
        CpiContext::new(
            ctx.accounts.associated_token_program.to_account_info(),
            anchor_spl::associated_token::Create {
                payer: creator.to_account_info(),
                associated_token: ctx.accounts.nft_token_account.to_account_info(),
                authority: creator.to_account_info(),
                mint: ctx.accounts.nft_mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
           },
        ),
    )?;

    // Mint 1 NFT to the creator's associated token account
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.nft_mint.to_account_info(),
                to: ctx.accounts.nft_token_account.to_account_info(),
                authority: membership.to_account_info(),
            },
            signer,
        ),
        1,
    )?;

    // Update membership with NFT mint address
    membership.nft_mint = Some(ctx.accounts.nft_mint.key());

    emit!(ChannelCreated {
        channel_id,
        name,
        description,
        cost,
        creator: creator.key(),
        is_private,
        created_at: current_time,
        nft_mint: ctx.accounts.nft_mint.key(),
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String, description: String, img_url: String, cost: u64, is_private: bool)]
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

    #[account(
        init,
        payer = creator,
        space = ANCHOR_DISCRIMINATOR_SIZE + Membership::INIT_SPACE,
        seeds = [
            MEMBERSHIP_SEED,
            (config.total_channels + 1).to_le_bytes().as_ref(),
            creator.key().as_ref()
        ],
        bump
    )]
    pub membership: Account<'info, Membership>,

    /// Mint will be created via CPI
    #[account(mut)]
    pub nft_mint: Account<'info, Mint>,

    /// Token account will be created via CPI
    #[account(mut)]
    pub nft_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
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
    pub nft_mint: Pubkey,
}