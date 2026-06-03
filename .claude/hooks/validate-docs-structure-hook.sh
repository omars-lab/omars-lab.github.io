#!/bin/bash
# PostToolUse hook for Edit|Write: WARN (never block) on docs-structure violations.
#
# The docs/ tree follows a topic-based IA contract (see the review-reader-experience
# skill's "Topic-folder contract" section + CLAUDE.md). The single highest-stakes rule
# is the URL-freeze guarantee: every doc must carry an ABSOLUTE `slug:` (`slug: /…`).
# A relative/missing slug silently re-couples the URL to the folder path, so a later
# move changes the URL with no build error (onBrokenLinks:'warn', no redirects plugin).
#
# This hook runs scripts/validate-docs-structure.js --error-only scoped to the changed
# file and surfaces any ERROR-tier finding (currently: absolute-slug). It is advisory:
# it exits 0 so the edit is NEVER blocked (mirrors validate-draft-hook.sh). The full
# warn-tier contract is checked by `make validate-structure`.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Scope: content markdown/MDX OR a sidebar `_category_.json`, under the blog's docs dir (the
# only place the contract applies). Docs get the full ERROR-tier slug check; `_category_.json`
# gets the emoji advisory (sidebar section labels lead with an emoji).
is_doc=false
is_category=false
case "$file_path" in
  *.md|*.mdx) is_doc=true ;;
  */_category_.json) is_category=true ;;
  *) exit 0 ;;
esac
case "$file_path" in
  */bytesofpurpose-blog/docs/*) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

# Locate the validator relative to the project dir (cwd from the hook payload).
proj="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty')}"
script="$proj/bytesofpurpose-blog/scripts/validate-docs-structure.js"
[ -f "$script" ] || exit 0   # not this repo / not set up → stay out of the way

# ERROR-tier slug check — docs only (the validator's scoped mode lints markdown/MDX, not JSON).
if [ "$is_doc" = true ]; then
  out=$(node "$script" "$file_path" --error-only 2>&1)
  rc=$?
  if [ "$rc" -eq 2 ]; then
    rel="${file_path##*/bytesofpurpose-blog/}"
    {
      echo "🏗  Docs structure: ERROR-tier issue in '$rel'"
      echo "$out"
      echo ""
      echo "   The whole IA relies on every doc carrying an ABSOLUTE slug (\`slug: /…\`):"
      echo "   a relative/missing slug re-couples the URL to the folder path, so a later"
      echo "   move silently 404s (onBrokenLinks:'warn', no redirects plugin)."
      echo "   (advice only — not blocking. Run \`make validate-structure\` for the full contract.)"
    } >&2
  fi
fi

# Emoji advisory: a sidebar section label should LEAD with an emoji (visual scanning). Fires
# when a `_category_.json` label, or a doc's resolved sidebar label (sidebar_label||title),
# has no leading emoji. Same emoji-range test as startsWithEmoji() in the validator — keep in
# lockstep. Advisory only; never blocks. (jq tests the first code point against the emoji ranges.)
emoji_label=""
if [ "$is_category" = true ]; then
  emoji_label=$(jq -r '.label // empty' "$file_path" 2>/dev/null)
elif [ "$is_doc" = true ]; then
  # resolved sidebar label = sidebar_label || title, pulled from YAML frontmatter
  emoji_label=$(awk '/^---[[:space:]]*$/{c++; next} c==1{print} c>=2{exit}' "$file_path" \
    | grep -iE '^(sidebar_label|title):' | sort -r | head -1 \
    | sed -E "s/^[a-zA-Z_]+:[[:space:]]*//; s/^[\"']//; s/[\"'][[:space:]]*$//")
fi
if [ -n "$emoji_label" ]; then
  # jq has no 0x literals → use decimal code points. Drop leading variation selectors
  # (U+FE0E=65038 / U+FE0F=65039), then test the first code point against the emoji ranges:
  # SMP planes (>=U+1F000=126976), symbols/arrows (U+2190..U+2BFF=8592..11263), dingbats
  # (U+2600..U+27BF=9728..10175), star (U+2B50=11088), sparkles (U+2728=10024).
  leads_emoji=$(printf '%s' "$emoji_label" | jq -Rr '
    explode
    | map(select(. != 65038 and . != 65039))
    | if length==0 then "no"
      else .[0] as $cp
        | if $cp>=126976 or ($cp>=8592 and $cp<=11263) or ($cp>=9728 and $cp<=10175) or $cp==11088 or $cp==10024
          then "yes" else "no" end
      end' 2>/dev/null)
  if [ "$leads_emoji" = "no" ]; then
    rel="${file_path##*/bytesofpurpose-blog/}"
    # Ask the shared emoji-map config what THIS folder resolves to. A standard folder
    # (known kind / learned override / root) yields a concrete emoji to prepend; a
    # non-standard folder yields nothing → point the author at /suggest-emoji so the
    # choice is made once for the folder and recorded back into emoji-map.json.
    rel_dir="${file_path#*/bytesofpurpose-blog/docs/}"
    rel_dir="${rel_dir%/*}"
    resolver="$proj/bytesofpurpose-blog/scripts/lib/emoji-map.js"
    suggested=""
    if [ -f "$resolver" ]; then
      suggested=$(node -e 'const{resolveFolderEmoji}=require(process.argv[1]);process.stdout.write(resolveFolderEmoji(process.argv[2])||"")' "$resolver" "$rel_dir" 2>/dev/null)
    fi
    {
      echo "🎨 Docs structure: sidebar label has no leading emoji in '$rel'"
      echo "   Label: \"$emoji_label\""
      if [ -n "$suggested" ]; then
        echo "   Suggested: prepend \"$suggested\" — the folder '$rel_dir' resolves to it"
        echo "   (kind-map / learned override). Add it to BOTH title and sidebar_label."
      else
        echo "   Folder '$rel_dir' is NON-STANDARD (no kind/learned/root match)."
        echo "   Run \`/suggest-emoji $rel_dir\` to pick a fitting emoji once for the folder;"
        echo "   it records the choice in emoji-map.json so siblings stay consistent."
      fi
      echo "   (Convention: every sidebar entry leads with one emoji so the sidebar scans"
      echo "   visually — see /definitions/emojis-for-activities. Advice only — not blocking.)"
    } >&2
  fi
fi

# Premium advisory: a `premium: true` doc ships its body ENCRYPTED to prod and is gated
# client-side (sign in with LinkedIn → Worker vends the key → in-browser decrypt). Two
# things to nudge at edit time (both warn-tier in the validator, surfaced here because the
# hook runs --error-only and these are worth seeing as you write):
#   1. premium + draft is contradictory — drafts are excluded from the prod build, so the
#      premium body would never be encrypted/gated. Pick one.
#   2. a premium doc with no `premium_teaser:` (and no `description:`) shows a bare lock
#      with no preview to entice sign-in.
# See the premium-content-gating design + the manage-premium-content skill. Advisory only.
if [ "$is_doc" = true ] && [ "$(head -1 "$file_path")" = "---" ]; then
  fm=$(awk '/^---[[:space:]]*$/{c++; next} c==1{print} c>=2{exit}' "$file_path")
  if printf '%s\n' "$fm" | grep -iqE '^premium:[[:space:]]*true[[:space:]]*$'; then
    rel="${file_path##*/bytesofpurpose-blog/}"
    if printf '%s\n' "$fm" | grep -iqE '^draft:[[:space:]]*true[[:space:]]*$'; then
      {
        echo "🔒 Premium gating: '$rel' is BOTH \`premium: true\` and \`draft: true\` — contradictory."
        echo "   Drafts are excluded from the production build, so the premium body would never"
        echo "   be encrypted/gated. Pick one: publish it as premium, or keep it a draft."
        echo "   (advice only — not blocking. See the premium-content-gating design.)"
      } >&2
    fi
    if ! printf '%s\n' "$fm" | grep -iqE '^(premium_teaser|description):[[:space:]]*\S'; then
      {
        echo "🔒 Premium gating: '$rel' has no \`premium_teaser:\` (nor a \`description:\`)."
        echo "   Anonymous readers would see a bare lock with no preview. Add a"
        echo "   \`premium_teaser:\` sneak-peek that entices sign-in. (advice only — not blocking.)"
      } >&2
    fi
  fi
fi

# Numeric-prefix advisory: flag if the changed doc lives under a folder whose NAME
# carries a numeric ordering prefix (e.g. docs/software-development/6-projects/…).
# WHY surface it here: folder renames happen via `git mv` (no Write/Edit hook fires),
# so a doc edit is the natural moment to nudge. The rule — order via _category_.json
# "position", never the folder name — keeps reordering history-clean (a 1-line position
# bump vs a path-rewriting rename). Advisory only; never blocks.
rel_docs="${file_path#*/bytesofpurpose-blog/docs/}"
if printf '%s' "$rel_docs" | grep -qE '(^|/)[0-9]+-[^/]+/'; then
  prefixed=$(printf '%s' "$rel_docs" | grep -oE '(^|/)[0-9]+-[^/]+/' | tr -d '/' | sort -u | paste -sd', ' -)
  {
    echo "🔢 Docs structure: numeric-prefixed folder(s) in this path: $prefixed"
    echo "   Convention: folder names carry NO numeric prefix — order via the"
    echo "   _category_.json \"position\" field instead. (A name prefix couples order to"
    echo "   identity: reordering then means a history-churning git mv, vs a 1-line"
    echo "   position bump.) Rename the folder (slugs are absolute, so URLs are safe) and"
    echo "   set positions. (advice only — not blocking.)"
  } >&2
fi

# WARN-only: always succeed so the edit is never blocked.
exit 0
