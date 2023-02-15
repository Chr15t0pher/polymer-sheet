mod delta;
mod operation;
use anyhow::Result;
use std::fmt::Debug;
use std::slice::SliceIndex;

pub use delta::*;
pub use operation::*;

pub trait OperationTransformable {
    /// Merge two operations into one where
    /// ```ignore
    /// apply(apply(S, A), B) = apply(S, compose(A, B))
    /// ```
    /// must hold
    fn compose(&self, other: &Self) -> Result<Self>
    where
        Self: Sized;

    /// Transform two operations and produce another two operations where
    /// ```ignore
    /// (a', b') = a.transform(b)
    /// a.compose(b') = b.compose(a')
    /// ```
    /// must hold
    fn transform(&self, other: &Self) -> Result<(Self, Self)>
    where
        Self: Sized;

    /// Invert an operation with another operation where
    /// ```ignore
    /// new_a = a.compose(b)
    /// undo = b.invert(a)
    /// a = new_a.compose(undo)
    /// ```
    /// must hold
    fn invert(&self, other: &Self) -> Self;
}

pub trait Attributes: Default + Debug + Clone + OperationTransformable + PartialEq + Eq {
    fn is_empty(&self) -> bool;

    fn remove_empty(&mut self);

    fn extend_other(&mut self, other: &Self);
}

pub trait Data: Default + Debug + Clone + PartialEq + Eq {
    fn len(&self) -> usize;

    fn is_empty(&self) -> bool;

    fn merge(&mut self, other: Self);

    fn truncate_before(&self, index: usize) -> Self;
    fn truncate_after(&self, index: usize) -> Self;
}
