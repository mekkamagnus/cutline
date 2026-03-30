#!/bin/bash
set -e

# Start Cutline development environment
# Creates tmux sessions for frontend and backend servers

echo "🚀 Starting Cutline development environment..."

# Check if tmux is installed
if ! command -v tmux &>/dev/null; then
    echo "❌ tmux is not installed. Please install tmux first."
    exit 1
fi

# Kill existing session if present
tmux kill-session -t cutline 2>/dev/null || true

# Create new session with backend window
tmux new-session -d -s cutline -n api -d -c "cd $(dirname "$0")/app/server && bun run dev"

# Send command to start backend
tmux send-keys -t cutline:api "cd /Users/mekael/Documents/programming/typescript/cutline/app/server && bun run dev" Enter

# Create frontend window
tmux new-window -d -t cutline -n web

# Send command to start frontend  
tmux send-keys -t cutline:web "bun run dev" Enter

echo "✅ Servers started in tmux session 'cutline'"
echo ""
echo "📋 Commands:"
echo "  tmux attach -t cutline      # Attach to session"
echo "  tmux attach -t cutline:api  # View backend logs"
echo "  tmux attach -t cutline:web  # View frontend logs"
echo "  tmux kill-session -t cutline  # Stop servers"
