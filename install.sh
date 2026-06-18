#!/bin/bash

# Canaan Smart Group - Dependency Installation
# ---------------------------------------------
# This script installs all necessary dependencies for the project.

echo "📦 Installing project dependencies..."

# We use root-level installation as the project is currently in the root directory.
# If you move this to a monorepo, update the directory path below.
npm install

if [ $? -eq 0 ]; then
  echo "✅ Dependencies installed successfully."
  echo "🚀 Run 'npm run dev' to start the development server."
else
  echo "❌ Installation failed. Please check your network connection and try again."
  exit 1
fi
