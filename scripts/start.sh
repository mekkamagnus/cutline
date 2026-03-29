#!/bin/bash
# Start the Cutline development environment in tmux

SESSION_NAME="cutline"
BACKEND_WINDOW="api"
FRONTEND_WINDOW="web"
PROJECT_ROOT="/Users/mekael/Documents/programming/typescript/cutline"

# Create the cutline session if it doesn't exist
tmux new-session -d -s "$SESSION_NAME" 2>/dev/null || true

# Create backend API window if it doesn't exist
tmux new-window -d -t "$SESSION_NAME" -n "$BACKEND_WINDOW" 2>/dev/null || true

# Create frontend web window if it doesn't exist
tmux new-window -d -t "$SESSION_NAME" -n "$FRONTEND_WINDOW" 2>/dev/null || true

# Start the backend server
tmux send-keys -t "$SESSION_NAME:$BACKEND_WINDOW" "cd $PROJECT_ROOT/app/server && bun run dev" Enter

# Start the frontend dev server with --host for network access
tmux send-keys -t "$SESSION_NAME:$FRONTEND_WINDOW" "cd $PROJECT_ROOT/app/client && bun run dev --host" Enter

echo "✅ Cutline dev environment started in tmux session: $SESSION_NAME"
echo "🌐 Frontend: http://localhost:5173"
echo "🔌 API:      http://localhost:3001"
echo "📋 View frontend: tmux attach -t $SESSION_NAME:$FRONTEND_WINDOW"
echo "📋 View backend:  tmux attach -t $SESSION_NAME:$BACKEND_WINDOW"
