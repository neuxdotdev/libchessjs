#!/bin/bash

# Direktori target
TARGET_DIR="src/lib/types"

find "$TARGET_DIR" -type f -name "*.d.ts" | while read -r file; do
  newfile="${file%.d.ts}.ts"
  echo "Renaming $file -> $newfile"
  mv "$file" "$newfile"
done

echo "✅ Semua file .d.ts di $TARGET_DIR telah diubah menjadi .ts"
