#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json ignoreCommand): skip the build when
# nothing but docs/tooling changed since the last deployed commit.
# Vercel reads only two exit codes: 0 = skip, 1 = build; anything else (git's
# 128 for an unknown or empty SHA, e.g. a branch's first preview) fails the
# deployment. So every error here means "build".
prev="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -n "$prev" ] && git cat-file -e "$prev" 2>/dev/null &&
  git diff --quiet "$prev" HEAD -- . ':!docs' ':!.design' ':!openspec' ':!.impeccable' \
    ':!.agents' ':!.claude' ':!.github' ':(exclude,glob)*.md'; then
  exit 0
fi
exit 1
