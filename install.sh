#!/bin/bash

# Dependency Install Script for Canaan Smart Group Project
# This script ensures Node.js is present and installs all project dependencies.

echo "--- Starting Dependency Installation ---"

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "Error: npm is not installed. Please install Node.js first."
    exit 1
fi

echo "Installing existing dependencies from package.json..."
npm install

if [ $? -eq 0 ]; then
    echo "--- Installation Successful! ---"
    echo "You can now run 'npm run dev' to start the development server."
else
    echo "--- Installation Failed! ---"
    exit 1
fi
