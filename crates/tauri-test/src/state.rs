use std::{
    any::{Any, TypeId},
    collections::HashMap,
    marker::PhantomData,
    pin::Pin,
    sync::{OnceLock, RwLock},
};

type StateMap = HashMap<TypeId, Pin<Box<dyn Any + Send + Sync>>>;

static REGISTRY: OnceLock<RwLock<StateMap>> = OnceLock::new();

fn registry() -> &'static RwLock<StateMap> {
    REGISTRY.get_or_init(|| RwLock::new(HashMap::new()))
}

/// Remove every registered state value.
pub fn clear() {
    let mut map = registry()
        .write()
        .expect("tauri_test: state registry poisoned");
    map.clear();
}

/// Register or replace a value of type `T` in the global state registry.
pub fn register<T: Any + Send + Sync + 'static>(value: T) {
    let mut map = registry()
        .write()
        .expect("tauri_test: state registry poisoned");
    map.insert(TypeId::of::<T>(), Box::pin(value));
}

/// Retrieve a registered value by reference.
pub fn get<T: Any + Send + Sync + 'static>() -> Result<&'static T, String> {
    let map = registry()
        .read()
        .expect("tauri_test: state registry poisoned");
    let value = map
        .get(&TypeId::of::<T>())
        .and_then(|entry| entry.downcast_ref::<T>())
        .ok_or_else(|| {
            format!(
                "tauri_test: no state registered for {}",
                std::any::type_name::<T>()
            )
        })?;

    Ok(unsafe { &*(value as *const T) })
}

/// Retrieve a registered value as `tauri::State<T>`.
pub fn get_tauri_state<T: Any + Send + Sync + 'static>() -> Result<tauri::State<'static, T>, String> {
    let value = get::<T>()?;
    Ok(unsafe {
        std::mem::transmute::<StateRepr<T>, tauri::State<'static, T>>(StateRepr(value, PhantomData))
    })
}

#[repr(C)]
struct StateRepr<'a, T: Send + Sync + 'static>(&'a T, PhantomData<&'a T>);
