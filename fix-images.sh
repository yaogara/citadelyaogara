#!/bin/bash

# Moves old Vue card art to new React UI folder
# while preserving Git history (so Git sees them as renames)

OLD_DIR="client/src/assets/cards"
NEW_DIR="ui/public/cards"

mkdir -p "$NEW_DIR"

for file in "$OLD_DIR"/*.jpg; do
  base=$(basename "$file")
  git mv "$file" "$NEW_DIR/$base"
done

echo "Move complete. Commit and push."