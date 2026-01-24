fn main() {
    println!("cargo:rerun-if-changed=assets/");

    let assets = vec![
        "assets/pglite.wasi",
        "assets/pglite.cwasm",
        "assets/pgdata_seed.tar.zst",
        "assets/prefix.tar.zst",
    ];

    for asset in &assets {
        if !std::path::Path::new(asset).exists() {
            panic!(
                "Required asset not found: {}. Please ensure all assets are in the assets/ directory.",
                asset
            );
        }
    }

    println!("All required assets validated successfully.");
}
