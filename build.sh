#!/bin/bash
# Build script: copy files to /docs for GitHub Pages deployment

set -e

DIST="docs"

# Clean and create output directory
rm -rf "$DIST"
mkdir -p "$DIST/data"

# Copy application files
cp index.html "$DIST/"
cp share.html "$DIST/"
cp style.css "$DIST/"
cp main.js "$DIST/"

# Copy data files
cp data/*.csv "$DIST/data/"

# CNAME for custom domain
echo "3d-surface-chart.dataviz.jp" > "$DIST/CNAME"

echo "Build complete -> $DIST/"
ls -lR "$DIST/"
