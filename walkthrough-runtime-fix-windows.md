# Windows Runtime Fix Walkthrough

## What Failed
When running `npm.cmd run tauri dev`, the build process reached Rust compilation but failed with the following error:
> `icons/icon.ico not found; required for generating a Windows Resource file during tauri-build`

## Why it Failed
Tauri v2's `tauri-build` step looks for a Windows icon file (`src-tauri/icons/icon.ico`) by default to create a Windows Resource file for the desktop app. However, the `src-tauri/icons` folder was missing from the project, which caused the build script to crash.

## Files Inspected
- `package.json`: Verified correct setup of Tauri CLI commands (`"tauri": "tauri"` mapping to `@tauri-apps/cli`).
- `src-tauri/Cargo.toml`: Verified standard Tauri v2 configuration and plugin setup.
- `src-tauri/tauri.conf.json`: Verified correct version (v2 format with `app.windows`), identifier, and that it doesn't hardcode invalid icon paths.

## Files Changed/Created
- **[NEW]** `src-tauri/icons/icon.png` (Placeholder React image downloaded as source).
- **[NEW]** `src-tauri/icons/icon.ico` (Windows resource file required by `tauri-build`).
- **[NEW]** Other generated default icons for Tauri (`32x32.png`, `128x128.png`, `icon.icns`, etc.).

We generated these icons automatically using the Tauri CLI tool (`npm.cmd run tauri icon -- src-tauri\icons\icon.png`).

## Exact Command You Should Run Next
You can safely run the commands you specified:

```powershell
rmdir /s /q "src-tauri\target"
npm.cmd run tauri dev
```

> [!TIP]
> The first time you run `tauri dev` after clearing the target folder, Rust will do a full download and compilation of all dependencies, which may take several minutes.

## What Successful Output Should Look Like
You should see:
1. `vite` development server starting in the background.
2. A series of `Compiling ...` outputs from `cargo`.
3. Finally, `Finished dev [unoptimized + debuginfo] target(s) in X.Xs`.
4. The Director Cut desktop application window will open automatically.

## What to Do If Another Windows Build Error Appears
- If the error mentions missing C++ build tools or MSVC, ensure your Visual Studio Build Tools include the **Desktop development with C++** workload.
- If the error mentions a locked database or missing SQLite file, verify that `tauri-plugin-sql` dependencies are correctly resolving. 
- Always ensure you are running commands in a terminal with sufficient execution policies, or prefix them with `npm.cmd` instead of just `npm`.

## Frontend Syntax Error Fixes
During our checks, we found and fixed frontend build syntax errors where template literals inside TSX files (`BottomNav.tsx`, `StepWorkspace.tsx`) and database strings (`schema.ts`, `seed.ts`) had accidentally escaped backticks (\`) and dollar signs (\${). These issues were likely artifacts of LLM code generation and have now been corrected.
No stray markdown blocks were found in the source files.

## Windows File-Lock (OS Error 32) Cleanup
If you encounter a Rust file lock error (e.g. `error: failed to remove... The process cannot access the file because it is being used by another process. (os error 32)`), this is not a code bug. Our configuration checking confirmed we don't have duplicate dev watchers running in `package.json`. It usually means a background compiler process got stuck.

**Recommended manual cleanup:**
1. Close the Director Cut app window if it's open.
2. Close all Antigravity terminals or prompt instances running npm/cargo.
3. Run the following commands in your prompt to forcibly kill stuck processes:
```powershell
taskkill /F /IM cargo.exe
taskkill /F /IM rustc.exe
taskkill /F /IM node.exe
```
4. Remove the lock/target folder:
```powershell
rmdir /s /q "src-tauri\target"
```
5. Rerun the dev server:
```powershell
npm.cmd run tauri dev
```
