use crate::core::{operation::*, Attributes, Data};

pub struct OperationBuilder<D: Data, T: Attributes> {
    op: Operation<D, T>,
    attrs: T,
}

impl<D: Data, T: Attributes> OperationBuilder<D, T> {
    fn new(op: Operation<D, T>) -> Self {
        Self {
            op,
            attrs: T::default(),
        }
    }

    pub fn delete(scope: OperationScope, n: usize) -> Self {
        Self::new(Operation::Delete(scope, Delete(n)))
    }

    pub fn retain(scope: OperationScope, n: usize) -> Self {
        Self::new(Operation::Retain(
            scope,
            Retain {
                n,
                attrs: T::default(),
            },
        ))
    }

    pub fn insert(scope: OperationScope, data: D) -> Self {
        Self::new(Operation::Insert(
            scope,
            Insert {
                data,
                attrs: T::default(),
            },
        ))
    }

    pub fn attrs(mut self, attrs: T) -> Self {
        self.attrs = attrs;
        self
    }

    pub fn build(self) -> Operation<D, T> {
        let mut op = self.op;

        match &mut op {
            Operation::Delete(_, _) => {}
            Operation::Retain(_, retain) => retain.attrs = self.attrs,
            Operation::Insert(_, insert) => insert.attrs = self.attrs,
        }

        op
    }
}
