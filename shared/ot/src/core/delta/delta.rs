use crate::core::{operation::*, Attributes, Data, OperationTransformable};
use crate::error::OTError;
use anyhow::{Result, *};
use std::cmp::{min, Ordering};
use std::collections::HashMap;

#[derive(Debug, Default)]
pub struct DeltaLength {
    base_len: usize,
    target_len: usize,
}

#[derive(Debug, Default)]
pub struct Delta<D: Data, T: Attributes> {
    pub ops: Vec<Operation<D, T>>,
    pub len_map: HashMap<OperationScope, DeltaLength>,
}

impl<D: Data, T: Attributes> Delta<D, T> {
    fn is_len_equal<F>(&self, other: &Self, f: F) -> bool
    where
        F: FnMut(&DeltaLength, &DeltaLength) -> bool,
    {
        if self.len_map.len() != other.len_map.len() {
            return false;
        }

        self.len_map.iter().all(|(key, val)| {
            let other_val = other.len_map.get(key).unwrap_or(&DeltaLength::default());
            f(val, other_val)
        })
    }

    fn get_len_mut(&mut self, scope: OperationScope) -> &mut DeltaLength {
        if !self.len_map.contains_key(&scope) {
            self.len_map.insert(scope, DeltaLength::default());
        }

        self.len_map.get_mut(&scope).unwrap()
    }

    fn add_base_len(&mut self, scope: OperationScope, n: usize) {
        let val = self.get_len_mut(scope);
        val.base_len += n;
    }

    fn add_target_len(&mut self, scope: OperationScope, n: usize) {
        let val = self.get_len_mut(scope);
        val.target_len += n;
    }

    pub fn delete(&mut self, scope: OperationScope, delete: &Delete) -> Result<&mut Self> {
        let n = delete.0;
        if n == 0 {
            return Ok(self);
        }

        self.add_base_len(scope, n);

        match self.ops.last_mut() {
            Some(Operation::Delete(s, d)) if *s == scope => {
                d.0 += n;
            }
            _ => {
                let new_op = OperationBuilder::delete(scope, n).build();
                self.ops.push(new_op);
            }
        }

        Ok(self)
    }

    pub fn retain(&mut self, scope: OperationScope, retain: &Retain<T>) -> Result<&mut Self> {
        let n = retain.n;
        if n == 0 {
            return Ok(self);
        }

        self.add_base_len(scope, n);
        self.add_target_len(scope, n);

        match self.ops.last_mut() {
            Some(Operation::Retain(s, r)) if *s == scope => {
                r.n += n;
            }
            _ => {
                let new_op = OperationBuilder::retain(scope, n)
                    .attrs(retain.attrs.clone())
                    .build();
                self.ops.push(new_op);
            }
        }

        Ok(self)
    }

    pub fn insert(&mut self, scope: OperationScope, insert: &Insert<D, T>) -> Result<&mut Self> {
        if insert.data.is_empty() {
            return Ok(self);
        }

        let data = insert.data.clone();
        let attrs = insert.attrs.clone();
        self.add_target_len(scope, insert.data.len());

        match self.ops.as_mut_slice() {
            [.., Operation::Insert(s, i)]
            | [.., Operation::Insert(s, i), Operation::Delete(_, _)]
                if *s == scope =>
            {
                i.data.merge(data);
            }
            [.., last_op @ Operation::Delete(_, _)] => {
                let new_op = last_op.clone();
                *last_op = OperationBuilder::insert(scope, data).attrs(attrs).build();
                self.ops.push(new_op);
            }
            _ => {
                let new_op = OperationBuilder::insert(scope, data).attrs(attrs).build();
                self.ops.push(new_op);
            }
        }

        Ok(self)
    }

    pub fn add(&mut self, op: &Operation<D, T>) -> Result<()> {
        match op {
            Operation::Delete(s, delete) => self.delete(*s, delete)?,
            Operation::Retain(s, retain) => self.retain(*s, retain)?,
            Operation::Insert(s, insert) => self.insert(*s, insert)?,
        };

        Ok(())
    }
}

impl<D: Data, T: Attributes> OperationTransformable for Delta<D, T> {
    fn compose(&self, other: &Self) -> Result<Self> {
        if !self.is_len_equal(other, |val, other_val| val.target_len == other_val.base_len) {
            bail!(OTError::IncompatibleDeltaLength("target", "base"));
        }

        let mut new_delta = Self::default();

        let mut iter1 = self.ops.iter().cloned();
        let mut iter2 = other.ops.iter().cloned();

        let mut elem1 = iter1.next();
        let mut elem2 = iter1.next();

        loop {
            match (&elem1, &elem2) {
                (Some(op @ Operation::Delete(_, _)), _) => {
                    new_delta.add(op)?;
                    elem1 = iter1.next();
                    continue;
                }
                (_, Some(op @ Operation::Insert(_, _))) => {
                    new_delta.add(op)?;
                    elem2 = iter2.next();
                    continue;
                }
                (None, None) => break,
                (None, _) => bail!(OTError::IncompatibleOperationLength("first")),
                (_, None) => bail!(OTError::IncompatibleOperationLength("second")),
                (_, _) => {}
            }

            let op1 = elem1.as_ref().unwrap();
            let op2 = elem2.as_ref().unwrap();
            let scope1 = op1.get_scope();
            let scope2 = op2.get_scope();

            if scope1 != scope2 {
                bail!(OTError::IncompatibleOperationScope);
            }

            let len1 = op1.len();
            let len2 = op2.len();
            let min_len = min(len1, len2);
            let attrs1 = op1.get_attrs();
            let attrs2 = op2.get_attrs();

            match (op1, op2) {
                (Operation::Retain(_, _), Operation::Retain(_, _)) => {
                    new_delta.add(
                        &OperationBuilder::retain(scope1, min_len)
                            .attrs(attrs1.compose(&attrs2)?)
                            .build(),
                    )?;

                    match len1.cmp(&len2) {
                        Ordering::Greater => {
                            elem1 = Some(
                                OperationBuilder::retain(scope1, len1 - len2)
                                    .attrs(attrs1)
                                    .build(),
                            );
                            elem2 = iter2.next();
                        }
                        Ordering::Equal => {
                            elem1 = iter1.next();
                            elem2 = iter2.next();
                        }
                        Ordering::Less => {
                            elem1 = iter1.next();
                            elem2 = Some(
                                OperationBuilder::retain(scope1, len2 - len1)
                                    .attrs(attrs2)
                                    .build(),
                            );
                        }
                    }
                }
                (Operation::Retain(_, _), Operation::Delete(_, _)) => {
                    new_delta.add(&OperationBuilder::delete(scope1, min_len).build())?;

                    match len1.cmp(&len2) {
                        Ordering::Greater => {
                            elem1 = Some(
                                OperationBuilder::retain(scope1, len1 - len2)
                                    .attrs(attrs1)
                                    .build(),
                            );
                            elem2 = iter2.next();
                        }
                        Ordering::Equal => {
                            elem1 = iter1.next();
                            elem2 = iter2.next();
                        }
                        Ordering::Less => {
                            elem1 = iter1.next();
                            elem2 = Some(OperationBuilder::delete(scope1, len2 - len1).build());
                        }
                    }
                }
                (Operation::Insert(_, _), Operation::Delete(_, _)) => match len1.cmp(&len2) {
                    Ordering::Greater => {
                        elem1 = Some(
                            OperationBuilder::insert(scope1, op1.get_data().truncate_after(len2))
                                .attrs(attrs1)
                                .build(),
                        );
                        elem2 = iter2.next();
                    }
                    Ordering::Equal => {
                        elem1 = iter1.next();
                        elem2 = iter2.next();
                    }
                    Ordering::Less => {
                        elem1 = iter1.next();
                        elem2 = Some(OperationBuilder::delete(scope1, len2 - len1).build());
                    }
                },
                (Operation::Insert(_, _), Operation::Retain(_, _)) => {
                    new_delta.add(
                        &OperationBuilder::insert(scope1, op1.get_data().truncate_before(min_len))
                            .attrs(attrs1.compose(&attrs2)?)
                            .build(),
                    )?;

                    match len1.cmp(&len2) {
                        Ordering::Greater => {
                            elem1 = Some(
                                OperationBuilder::insert(
                                    scope1,
                                    op1.get_data().truncate_after(min_len),
                                )
                                .attrs(attrs1)
                                .build(),
                            );
                            elem2 = iter2.next();
                        }
                        Ordering::Equal => {
                            elem1 = iter1.next();
                            elem2 = iter2.next();
                        }
                        Ordering::Less => {
                            elem1 = iter1.next();
                            elem2 = Some(
                                OperationBuilder::retain(scope1, len2 - len1)
                                    .attrs(attrs2)
                                    .build(),
                            );
                        }
                    }
                }
                (_, _) => {
                    bail!(OTError::IncompatibleOperationType(
                        format!("{:?}", op1),
                        format!("{:?}", op2),
                    ));
                }
            }
        }

        Ok(new_delta)
    }

    fn transform(&self, other: &Self) -> Result<(Self, Self)> {
        let new_delta = Self::default();
        let new_other_delta = Self::default();

        if !self.is_len_equal(other, |val, other_val| val.base_len == other_val.base_len) {
            bail!(OTError::IncompatibleDeltaLength("base", "base"));
        }

        let mut iter1 = self.ops.iter().cloned();
        let mut iter2 = other.ops.iter().cloned();

        let mut elem1 = iter1.next();
        let mut elem2 = iter1.next();

        loop {
            match (&elem1, &elem2) {
                (Some(op @ Operation::Insert(scope, _)), _) => {
                    new_delta.add(op)?;
                    new_other_delta.add(
                        &OperationBuilder::retain(*scope, op.len())
                            .attrs(op.get_attrs())
                            .build(),
                    )?;
                    elem1 = iter1.next();
                    continue;
                }
                (_, Some(op @ Operation::Insert(scope, _))) => {
                    new_delta.add(
                        &OperationBuilder::retain(*scope, op.len())
                            .attrs(op.get_attrs())
                            .build(),
                    )?;
                    new_other_delta.add(op)?;
                    elem2 = iter2.next();
                    continue;
                }
                (None, None) => break,
                (None, _) => bail!(OTError::IncompatibleOperationLength("first")),
                (_, None) => bail!(OTError::IncompatibleOperationLength("second")),
                (_, _) => {}
            }

            let op1 = elem1.as_ref().unwrap();
            let op2 = elem2.as_ref().unwrap();
            let scope1 = op1.get_scope();
            let scope2 = op2.get_scope();

            if scope1 != scope2 {
                bail!(OTError::IncompatibleOperationScope);
            }

            let len1 = op1.len();
            let len2 = op2.len();
            let min_len = min(len1, len2);
            let attrs1 = op1.get_attrs();
            let attrs2 = op2.get_attrs();

            match (op1, op2) {
                (Operation::Retain(_, _), Operation::Retain(_, _)) => {
                    let new_op = OperationBuilder::retain(scope1, min_len)
                        .attrs(attrs1.transform(&attrs2)?.0)
                        .build();
                    new_delta.add(&new_op)?;
                    new_other_delta.add(&new_op)?;

                    match len1.cmp(&len2) {
                        Ordering::Less => {
                            elem1 = iter1.next();
                            elem2 = Some(
                                OperationBuilder::retain(scope1, len1 - len2)
                                    .attrs(attrs1)
                                    .build(),
                            );
                        }
                        Ordering::Equal => {
                            elem1 = iter1.next();
                            elem2 = iter2.next();
                        }
                        Ordering::Greater => {
                            elem1 = Some(
                                OperationBuilder::retain(scope2, len2 - len1)
                                    .attrs(attrs2)
                                    .build(),
                            );
                            elem2 = iter2.next();
                        }
                    }
                }
                (Operation::Delete(_, _), Operation::Delete(_, _)) => match len1.cmp(&len2) {
                    Ordering::Less => {}
                    Ordering::Equal => {}
                    Ordering::Greater => {}
                },
                (_, _) => {}
            }
        }

        Ok((new_delta, new_other_delta))
    }

    fn invert(&self, other: &Self) -> Self {
        let new_delta = Self::default();

        new_delta
    }
}
