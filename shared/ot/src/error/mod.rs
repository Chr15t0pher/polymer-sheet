use crate::core::OperationScope;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum OTError {
    #[error(
        "the {0} length of the first delta has to equal to the {1} length of the second delta"
    )]
    IncompatibleDeltaLength(&'static str, &'static str),
    #[error("The operation's length of {0} delta's is too short")]
    IncompatibleOperationLength(&'static str),
    #[error("Operations with different scopes aren't compatible: {0:?} and {1:?}")]
    IncompatibleOperationScope(OperationScope, OperationScope),
    #[error("Operations with different types aren't compatible: {0} and {1}")]
    IncompatibleOperationType(&'static str, &'static str),
}
