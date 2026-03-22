#!/bin/bash
# Build script: copy files to /docs for GitHub Pages deployment

set -e

DIST="docs"

# Clean and create output directory
rm -rf "$DIST"
mkdir -p "$DIST/data"

# Copy application files
cp index.html "$DIST/"
cp style.css "$DIST/"
cp main.js "$DIST/"

# Copy data files
cp jgbcm-all.csv "$DIST/"
cp data/*.csv "$DIST/data/"

echo "Build complete -> $DIST/"
ls -lR "$DIST/"
