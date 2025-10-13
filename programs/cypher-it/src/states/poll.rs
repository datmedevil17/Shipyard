// states/poll.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub channel_id: u64,
    pub creator: Pubkey,
    #[max_len(200)]
    pub poll_question: String,
    pub poll_type: u8, // 0 = kick user, 1 = mute user, 2 = normal poll
    #[max_len(10, 100)]
    pub options: Vec<String>,
    #[max_len(10)]
    pub votes: Vec<u64>,
    pub total_votes: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub required_votes: u64,
    pub target: Option<Pubkey>, // Target user for kick/mute polls
    #[max_len(100)]
    pub voted: Vec<Pubkey>,
    pub ended: bool,
    pub bump: u8,
}

impl Poll {
    pub fn has_voted(&self, user: &Pubkey) -> bool {
        self.voted.contains(user)
    }

    pub fn can_vote(&self, current_time: i64) -> bool {
        !self.ended && current_time >= self.start_time && current_time <= self.end_time
    }

    pub fn add_vote(&mut self, user: Pubkey, option_index: u64) -> Result<()> {
        self.votes[option_index as usize] += 1;
        self.total_votes += 1;
        self.voted.push(user);
        Ok(())
    }
}