use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Program is already initialized")]
    AlreadyInitialized,

    #[msg("Channel name is too long")]
    ChannelNameTooLong,

    #[msg("Channel description is too long")]
    ChannelDescriptionTooLong,

    #[msg("Invalid channel cost amount")]
    InvalidChannelCost,

    #[msg("Channel not found")]
    ChannelNotFound,

    #[msg("User has already joined this channel")]
    AlreadyJoined,

    #[msg("Insufficient funds to join channel")]
    InsufficientFunds,

    #[msg("Only channel creator can update channel")]
    UnauthorizedChannelUpdate,

    #[msg("Only program owner can perform this action")]
    UnauthorizedOwner,

    #[msg("Platform fee cannot exceed maximum allowed percentage")]
    PlatformFeeExceedsMaximum,

    #[msg("Invalid withdrawal amount")]
    InvalidWithdrawalAmount,

    #[msg("Membership not found")]
    MembershipNotFound,

    #[msg("User is not a member of this channel")]
    NotChannelMember,

    #[msg("Channel is private")]
    PrivateChannel,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Transfer failed")]
    TransferFailed,
}