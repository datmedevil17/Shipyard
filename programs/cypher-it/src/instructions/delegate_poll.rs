use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use ephemeral_rollups_sdk::cpi::DelegateConfig;

#[delegate]
#[derive(Accounts)]
pub struct DelegatePollCtx<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: The poll PDA to delegate
    #[account(mut, del)]
    pub poll: AccountInfo<'info>,
}

pub fn delegate_poll(
    ctx: Context<DelegatePollCtx>,
    channel_id: u64,
    poll_index: u64,
) -> Result<()> {
    ctx.accounts.delegate_poll(
        &ctx.accounts.payer,
        &[
            b"poll",
            channel_id.to_le_bytes().as_ref(),
            poll_index.to_le_bytes().as_ref(),
        ],
        DelegateConfig {
            commit_frequency_ms: 30_000,
            validator: Some(
                "MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57"
                    .parse::<Pubkey>()
                    .unwrap(),
            ),
            ..Default::default()
        },
    )?;
    msg!("Poll delegated for channel: {}, index: {}", channel_id, poll_index);
    Ok(())
}