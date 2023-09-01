use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo}, 
    entrypoint, 
    entrypoint::ProgramResult, 
    msg, 
    program_error::ProgramError,
    pubkey::Pubkey,
};


#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Memo {
    pub data: [u8; 128],
}

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {

    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;
    if account.owner != program_id {
        msg!("Account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    if instruction_data.len() > 128 {
        msg!("Invalid UTF-8 len");
        return Err(ProgramError::InvalidInstructionData)
    }

    let memo = std::str::from_utf8(instruction_data).map_err(|err| {
        msg!("Invalid UTF-8, from byte {}", err.valid_up_to());
        ProgramError::InvalidInstructionData
    })?;

    let mut memo_data = Memo{
        data: [0; 128]
    };

    if memo != "clean" {
        let memo_bytes = memo.as_bytes();
        memo_data.data[..memo_bytes.len()].copy_from_slice(&memo_bytes);
        memo_data.serialize(&mut &mut account.data.borrow_mut()[..])?;
        msg!("Current memo is: {}", memo);
    } else {
        memo_data.serialize(&mut &mut account.data.borrow_mut()[..])?;
        msg!("Current memo is clean");
    }

    Ok(())
}
