# PGLite Build Scripts

This directory contains Elixir scripts and modules for building and managing PGLite assets.

## Quick Build Module

The `build_assets.ex` file contains a standalone Elixir module that can be used to build optimized PGLite assets. This module is designed to be used in mix aliases and can be easily integrated into your build process.

## Usage

### Mix Aliases

The project now includes mix aliases for building assets:

```bash
# Build optimized assets
mix build.assets

# Clean and rebuild assets
mix build.assets.clean
```

### Direct Module Usage

You can also use the module directly in your Elixir code:

```elixir
# Load the module
Code.require_file("scripts/build_assets.ex")

# Build optimized assets
Pglite.BuildAssets.build_and_move()

# Or just build
Pglite.BuildAssets.build()

# Clean build
Pglite.BuildAssets.clean_build()
```



## What It Does

1. **Checks Dependencies**: Verifies that `bun` is available
2. **Builds Bundle**: Creates a highly optimized TypeScript bundle using bun with:
   - Minification (`--minify`)
   - Compression (`--compress`)
   - Code splitting (`--splitting`)
   - Tree shaking (`--tree-shaking`)
   - External bundling (`--external bun:*`)
3. **Builds Directly**: Outputs the bundle directly to `priv/pglite/pglite_socket_server.js`
4. **Copies WebAssembly**: Copies required `.wasm` and `.data` files to `priv/pglite/`
5. **Error Handling**: Uses Elixir's `with` construct for proper error handling

## Asset Structure

After building, your `priv/pglite/` directory will contain:

- `pglite_socket_server.js` - The optimized JavaScript bundle
- `pglite.wasm` - WebAssembly file
- `pglite.data` - Data file

## Optimized Build Process

The build process is streamlined for maximum efficiency:
- Builds directly to the target location (`priv/pglite/`)
- No temporary files or intermediate steps
- Uses bun's fastest optimization settings

## Integration

This module is designed to be:
- **Standalone**: Can be used outside of the main library
- **Mix-friendly**: Easy to integrate with mix aliases
- **Production-ready**: Includes proper error handling and logging
- **Maintainable**: Clean, documented code following Elixir best practices
