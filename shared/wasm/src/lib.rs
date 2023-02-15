use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub enum OperationType {
    Insert,
    Delete,
}

#[wasm_bindgen]
pub fn greet(operation_type: OperationType) -> JsValue {
    match operation_type {
        OperationType::Insert => JsValue::from(0),
        // OperationType::Insert => JsValue::from("delete operation"),
        _ => JsValue::from("others operation"),
    }
}
