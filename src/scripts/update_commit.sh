#!/usr/bin/env bash



# -----------------------------------------------------------------------------
# Step 4: check for changed files and create respective commit messages
# -----------------------------------------------------------------------------

commit_maybe () {
  commit_message=$1
  shift
  file_names=""

  for var in "$@"
  do
    found=$(git diff --name-only --diff-filter=M | grep -c ${var})
    if [ "$found" -ge 1 ]; then
      file_names="${file_names} ${var}"
    fi
  done

  if [ ! -z "$file_names" ]; then
    git commit ${file_names} -m "${commit_message}"
    # echo "git commit ${file_names} -m \"${commit_message}\""
  fi
}

# commit new meteor release version

NEW_METEOR_VERSION=$(cat ./.meteor/release | cut -d'@' -f2 )
commit_maybe "meteor core updated to ${NEW_METEOR_VERSION}" .meteor/release .meteor/.finished-upgraders
commit_maybe "meteor packages updated" .meteor/packages .meteor/versions
commit_maybe "npm packages updated" package.json package-lock.json
