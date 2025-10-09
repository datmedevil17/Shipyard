use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, initialize_mint, mint_to, Mint, MintTo, Token, TokenAccount};
use crate::constants::{
    ANCHOR_DISCRIMINATOR_SIZE, 
    CHANNEL_SEED, 
    MEMBERSHIP_SEED,
    STATE_SEED
};
use crate::errors::ErrorCode;
use crate::states::{Channel, Config, Membership};

pub fn join_channel(ctx: Context<JoinChannelCtx>, channel_id: u64) -> Result<()> {
    let config = &ctx.accounts.config;
    let channel = &mut ctx.accounts.channel;
    let membership = &mut ctx.accounts.membership;
    let member = &ctx.accounts.member;
    let fee_recipient = &ctx.accounts.fee_recipient;

    // Validation
    if channel.id != channel_id {
        return Err(ErrorCode::ChannelNotFound.into());
    }

    if membership.joined {
        return Err(ErrorCode::AlreadyJoined.into());
    }

    let cost = channel.cost;
    if **member.to_account_info().lamports.borrow() < cost {
        return Err(ErrorCode::InsufficientFunds.into());
    }

    // Calculate fees
    let platform_fee_amount = cost
        .checked_mul(config.platform_fee)
        .ok_or(ErrorCode::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(ErrorCode::ArithmeticOverflow)?;
    
    let creator_amount = cost
        .checked_sub(platform_fee_amount)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    // Transfer platform fee to fee recipient
    if platform_fee_amount > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: member.to_account_info(),
                    to: fee_recipient.to_account_info(),
                },
            ),
            platform_fee_amount,
        )?;
    }

    // Transfer remaining amount to channel creator
    if creator_amount > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: member.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
            ),
            creator_amount,
        )?;
    }

    // Update membership first
    membership.channel_id = channel_id;
    membership.member = member.key();
    membership.joined = true;
    membership.joined_at = Clock::get()?.unix_timestamp;

    // Seeds for PDA signing
    let channel_id_bytes = channel_id.to_le_bytes();
    let member_key = member.key();
    let seeds = &[
        MEMBERSHIP_SEED,
        channel_id_bytes.as_ref(),
        member_key.as_ref(),
        &[ctx.bumps.membership],
    ];
    let signer = &[&seeds[..]];

    // Initialize the mint (decimals = 0, authority = membership)
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

    // Create associated token account for the member
    anchor_spl::associated_token::create(
        CpiContext::new(
            ctx.accounts.associated_token_program.to_account_info(),
            anchor_spl::associated_token::Create {
                payer: member.to_account_info(),
                associated_token: ctx.accounts.nft_token_account.to_account_info(),
                authority: member.to_account_info(),
                mint: ctx.accounts.nft_mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
           },
        ),
    )?;

    // Mint 1 NFT to the member's associated token account
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

    // Update channel member count
    channel.member_count = channel.member_count
        .checked_add(1)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    emit!(ChannelJoined {
        channel_id,
        member: member.key(),
        cost,
        platform_fee_amount,
        creator_amount,
        nft_mint: ctx.accounts.nft_mint.key(),
        joined_at: membership.joined_at,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(channel_id: u64)]
pub struct JoinChannelCtx<'info> {
    #[account(
        seeds = [STATE_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

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
        init,
        payer = member,
        space = ANCHOR_DISCRIMINATOR_SIZE + Membership::INIT_SPACE,
        seeds = [
            MEMBERSHIP_SEED,
            channel_id.to_le_bytes().as_ref(),
            member.key().as_ref()
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
    pub member: Signer<'info>,

    /// CHECK: Channel creator - validated by channel.creator
    #[account(
        mut,
        constraint = creator.key() == channel.creator
    )]
    pub creator: UncheckedAccount<'info>,

    /// CHECK: Fee recipient - validated by config.fee_recipient
    #[account(
        mut,
        constraint = fee_recipient.key() == config.fee_recipient
    )]
    pub fee_recipient: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[event]
pub struct ChannelJoined {
    pub channel_id: u64,
    pub member: Pubkey,
    pub cost: u64,
    pub platform_fee_amount: u64,
    pub creator_amount: u64,
    pub nft_mint: Pubkey,
    pub joined_at: i64,
}
