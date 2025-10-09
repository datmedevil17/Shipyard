use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

pub fn calculate_platform_fee(amount: u64, fee_percentage: u64) -> Result<(u64, u64)> {
    let platform_fee = amount
        .checked_mul(fee_percentage)
        .ok_or(ErrorCode::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(ErrorCode::ArithmeticOverflow)?;
    
    let creator_amount = amount
        .checked_sub(platform_fee)
        .ok_or(ErrorCode::ArithmeticOverflow)?;
    
    Ok((platform_fee, creator_amount))
}

pub fn safe_add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b).ok_or(ErrorCode::ArithmeticOverflow.into())
}

pub fn safe_sub(a: u64, b: u64) -> Result<u64> {
    a.checked_sub(b).ok_or(ErrorCode::ArithmeticOverflow.into())
}

pub fn safe_mul(a: u64, b: u64) -> Result<u64> {
    a.checked_mul(b).ok_or(ErrorCode::ArithmeticOverflow.into())
}