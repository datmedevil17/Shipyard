// instructions/undelegate_poll.rs
use anchor_lang::prelude::*;
use crate::states::Poll;
use ephemeral_rollups_sdk::anchor::commit;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;

#[commit]
#[derive(Accounts)]
pub struct UndelegatePollCtx<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(mut)]
    pub poll: Account<'info, Poll>,
}

impl<'info> UndelegatePollCtx<'info> {
    pub fn undelegate_poll(&self) -> Result<()> {
        commit_and_undelegate_accounts(
            &self.payer,
            vec![&self.poll.to_account_info()],
            &self.magic_context,
            &self.magic_program,
        )?;
        
        msg!("Poll undelegated and committed");
        Ok(())
    }
}