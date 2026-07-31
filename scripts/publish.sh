#!/usr/bin/env bash
# Quick publish for ink_blog (run on your machine, not in the sandbox).
# Usage:  ./scripts/publish.sh "commit message"
# Needs:  git remote already set; optionally INK_BLOG_PAT env for token push.
set -euo pipefail

MSG="${1:-chore: update posts}"
REPO="Kiuyor/ink_blog"
cd "$(dirname "$0")/.."

git add -A
if git diff --cached --quiet; then
  echo "nothing staged to commit"
else
  git commit -m "$MSG"
fi

PAT="${INK_BLOG_PAT:-}"
if [ -n "$PAT" ]; then
  git remote set-url origin "https://x-access-token:${PAT}@github.com/${REPO}.git"
  git push origin master
  git remote set-url origin "https://github.com/${REPO}.git"
else
  git push origin master
fi
echo "pushed -> Vercel will rebuild automatically"
