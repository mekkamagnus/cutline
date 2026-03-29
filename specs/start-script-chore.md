# Chore: Create start.sh Script and /start-server Skill

## Chore Description
Create a `start.sh` script and a `/start-server` skill that start the web application (server only) in a tmux session window named `cutline:web-server`. The script and skill must:
1. Create the `cutline` tmux session if it doesn't exist
2. Create the `web-server` window within the `cutline` session if it doesn't exist
3. Start the backend server (Bun/Elysia on port 3001)

## Relevant Files
Use these files to resolve the chore:

- `app/server/package.json` - Contains server start scripts (`bun run dev`)
- `app/client/package.json` - Contains client start scripts (for reference)
- `specs/start-script-chore.md` - This plan file

### New Files
- `scripts/start.sh` - The main start script to create
- `.claude/skills/start-server/SKILL.md` - The skill definition for /start-server
- `.claude/skills/start-server/references/tmux-commands.md` - Detailed tmux command reference

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Create scripts directory
- Create `scripts/` directory at project root if it doesn't exist

### 2. Create start.sh script
- Create `scripts/start.sh` with the following logic:
  - Define session name (`cutline`) and window name (`web-server`)
  - Check if `cutline` session exists, create if not with `tmux new-session -d -s cutline`
  - Check if `web-server` window exists in `cutline` session, create if not with `tmux new-window -d -t cutline -n web-server`
  - Send command to start backend server: `tmux send-keys -t cutline:web-server 'cd /Users/mekael/Documents/programming/typescript/cutline/app/server && bun run dev' Enter`
  - Print success message with URL (http://localhost:3001)

### 3. Make script executable
- Run `chmod +x scripts/start.sh`

### 4. Create skills directory structure
- Create `.claude/skills/start-server/` directory if it doesn't exist
- Create `.claude/skills/start-server/references/` directory if it doesn't exist

### 5. Create tmux-commands.md reference file
- Create `.claude/skills/start-server/references/tmux-commands.md` with detailed tmux documentation:

```markdown
# Tmux Command Reference

Comprehensive reference for tmux commands used in this project.
Consult `tmux --help` or `man tmux` for complete documentation.

## Session Commands

| Command | Description |
|---------|-------------|
| `tmux new-session -d -s <name>` | Create new detached session |
| `tmux new -d -s <name>` | Shorthand for new-session |
| `tmux list-sessions` | List all sessions |
| `tmux ls` | Alias for list-sessions |
| `tmux attach -t <name>` | Attach to session |
| `tmux a -t <name>` | Shorthand for attach |
| `tmux kill-session -t <name>` | Kill session |
| `tmux has-session -t <name>` | Check if session exists (returns 0 if exists, 1 if not) |

## Window Commands

| Command | Description |
|---------|-------------|
| `tmux new-window -d -t <session> -n <name>` | Create detached window |
| `tmux new-window -t <session> -n <name>` | Create window and switch to it |
| `tmux list-windows -t <session>` | List windows in session |
| `tmux kill-window -t <target>` | Kill window |
| `tmux rename-window -t <target> <name>` | Rename window |

## Pane Commands

| Command | Description |
|---------|-------------|
| `tmux send-keys -t <target> 'cmd' Enter` | Send command to pane |
| `tmux capture-pane -t <target> -p` | Print pane contents |
| `tmux capture-pane -t <target> -p -S -100` | Print last 100 lines |
| `tmux split-window -t <target>` | Split horizontally |
| `tmux split-window -h -t <target>` | Split vertically |
| `tmux kill-pane -t <target>` | Kill pane |

## Target Specification

Targets follow the format: `[session]:[window].[pane]`

Examples:
- `cutline` - Session named cutline
- `cutline:web-server` - Window web-server in session cutline
- `cutline:web-server.0` - First pane in web-server window

## Flags

| Flag | Description |
|------|-------------|
| `-d` | Detached (don't attach to new session/window) |
| `-s <name>` | Session name |
| `-t <target>` | Target session/window/pane |
| `-n <name>` | Window name |
| `-p` | Print to stdout (for capture-pane) |
| `-S -<num>` | Start from line -num (for capture-pane history) |

## Idempotent Patterns

Create session only if it doesn't exist:
```bash
tmux has-session -t cutline 2>/dev/null || tmux new-session -d -s cutline
```

Or suppress error and continue:
```bash
tmux new-session -d -s cutline 2>/dev/null || true
```

Create window only if it doesn't exist:
```bash
tmux new-window -d -t cutline -n web-server 2>/dev/null || true
```

## Common Workflows

### Start a service in a tmux window
```bash
tmux new-session -d -s myapp 2>/dev/null || true
tmux new-window -d -t myapp -n server 2>/dev/null || true
tmux send-keys -t myapp:server 'cd /path/to/app && npm start' Enter
```

### Check service output
```bash
tmux capture-pane -t myapp:server -p
```

### Kill a specific window
```bash
tmux kill-window -t myapp:server
```

### Kill entire session
```bash
tmux kill-session -t myapp
```
```

### 6. Create SKILL.md for /start-server skill
- Create `.claude/skills/start-server/SKILL.md` with proper YAML frontmatter:

```yaml
---
name: start-server
description: Start the Cutline web server in the cutline:web-server tmux session window. Use this skill when the user wants to start the server, run the dev server, boot up the backend, or launch the API. Creates the tmux session and window if they don't exist. Also use for checking server status or viewing server output.
---

# Start Server

Starts the Cutline backend server in development mode.

## Usage

Simply run `/start-server` to start the web server.

## What it does

1. Creates `cutline` tmux session if it doesn't exist
2. Creates `web-server` window if it doesn't exist
3. Starts the Bun/Elysia server on port 3001
4. Server runs at http://localhost:3001

## Tmux Command Reference

Consult `tmux --help` or `man tmux` for full documentation. Key commands:

### Session Management
```bash
tmux new-session -d -s <name>           # Create detached session
tmux list-sessions                      # List all sessions (alias: ls)
tmux attach -t <name>                   # Attach to session
tmux kill-session -t <name>             # Kill session
tmux has-session -t <name>              # Check if session exists (exit code 0/1)
```

### Window Management
```bash
tmux new-window -d -t <session> -n <name>   # Create detached window
tmux list-windows -t <session>              # List windows in session
tmux kill-window -t <session>:<window>      # Kill window
tmux rename-window -t <target> <name>       # Rename window
```

### Pane Interaction
```bash
tmux send-keys -t <target> 'command' Enter  # Send command to pane
tmux capture-pane -t <target> -p             # Capture pane output (print)
tmux split-window -t <target>                # Split pane horizontally
tmux split-window -h -t <target>             # Split pane vertically
```

### Target Specification
- Session: `cutline`
- Window: `cutline:web-server`
- Pane: `cutline:web-server.0`

### Common Patterns
```bash
# Idempotent session creation
tmux new-session -d -s cutline 2>/dev/null || true

# Idempotent window creation
tmux new-window -d -t cutline -n web-server 2>/dev/null || true

# Check if session exists before creating
tmux has-session -t cutline 2>/dev/null || tmux new-session -d -s cutline
```

## Implementation

Execute the start script:
```bash
./scripts/start.sh
```

Or manually:
```bash
tmux new-session -d -s cutline 2>/dev/null || true
tmux new-window -d -t cutline -n web-server 2>/dev/null || true
tmux send-keys -t cutline:web-server 'cd /Users/mekael/Documents/programming/typescript/cutline/app/server && bun run dev' Enter
```

## Verification

After starting, verify with:
```bash
tmux capture-pane -t cutline:web-server -p
```

Should show: `🚀 Cutline API server running on http://localhost:3001`

## Troubleshooting

If the server fails to start:
1. Check if port 3001 is already in use: `lsof -i :3001`
2. Check server output for errors: `tmux capture-pane -t cutline:web-server -p`
3. Verify dependencies: `cd app/server && bun install`
4. Check database: `ls -la app/server/data/cutline.db`
```

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `ls -la scripts/start.sh` - Verify script exists and is executable
- `bash -n scripts/start.sh` - Verify script has no syntax errors
- `ls -la .claude/skills/start-server/SKILL.md` - Verify skill file exists
- `ls -la .claude/skills/start-server/references/tmux-commands.md` - Verify reference file exists
- `cat .claude/skills/start-server/SKILL.md | head -5` - Verify skill has proper frontmatter with name and description
- `./scripts/start.sh` - Run the script and verify it creates session/window and starts the server
- `tmux list-windows -t cutline | grep web-server` - Verify web-server window exists in cutline session
- `tmux capture-pane -t cutline:web-server -p` - Verify server is running (should show startup message)

## Notes
- The script should be idempotent - running it multiple times should not create duplicate sessions/windows
- Use `-d` flag for tmux commands to create windows detached
- The server runs on port 3001 using Bun as the runtime
- The skill description should be "pushy" to ensure proper triggering - include phrases like "when the user wants to start the server"
- Skill name in frontmatter must match the directory name
