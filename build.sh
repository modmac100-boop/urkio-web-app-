#!/bin/bash
echo "Starting build..."
npm install
npm run build
echo "Build complete. Checking dist folder..."
ls -R dist
