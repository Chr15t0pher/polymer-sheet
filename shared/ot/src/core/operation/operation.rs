use crate::core::{Attributes, Data};
use std::hash::Hash;

#[derive(Debug, Copy, Clone, Eq, PartialEq, Hash)]
pub struct Position {
    x: usize,
    y: usize,
}

#[derive(Debug, Copy, Clone, Eq, PartialEq, Hash)]
pub enum OperationScope {
    Cell(Position),
    Column,
    Row,
}

#[derive(Debug, Clone)]
pub struct Delete(pub usize);

#[derive(Debug, Clone)]
pub struct Retain<T: Attributes> {
    pub n: usize,
    pub attrs: T,
}

#[derive(Debug, Clone)]
pub struct Insert<D: Data, T: Attributes> {
    pub data: D,
    pub attrs: T,
}

#[derive(Debug, Clone)]
pub enum Operation<D: Data, T: Attributes> {
    Delete(OperationScope, Delete),
    Retain(OperationScope, Retain<T>),
    Insert(OperationScope, Insert<D, T>),
}

impl<T: Attributes, D: Data> Operation<D, T> {
    pub fn get_scope(&self) -> OperationScope {
        match *self {
            Operation::Delete(scope, _) => scope,
            Operation::Retain(scope, _) => scope,
            Operation::Insert(scope, _) => scope,
        }
    }

    pub fn get_data(&self) -> D {
        match self {
            Operation::Delete(_, _) => D::default(),
            Operation::Retain(_, _) => D::default(),
            Operation::Insert(_, insert) => insert.data.clone(),
        }
    }

    pub fn get_attrs(&self) -> T {
        match self {
            Operation::Delete(_, _) => T::default(),
            Operation::Retain(_, _) => T::default(),
            Operation::Insert(_, insert) => insert.attrs.clone(),
        }
    }

    pub fn has_attrs(&self) -> bool {
        !self.get_attrs().is_empty()
    }

    pub fn len(&self) -> usize {
        match self {
            Operation::Delete(_, delete) => delete.0,
            Operation::Retain(_, retain) => retain.n,
            Operation::Insert(_, insert) => insert.data.len(),
        }
    }
}
