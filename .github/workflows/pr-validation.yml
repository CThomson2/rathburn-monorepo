name: PR Validation

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  validate-pr:
    name: Validate Pull Request
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Check commit messages
        run: |
          # Get all commit messages from PR
          COMMIT_MSGS=$(git log --pretty=format:"%s" origin/${{ github.base_ref }}..HEAD)
          
          # Basic validation of commit messages
          if echo "$COMMIT_MSGS" | grep -i -E "(wip|fixup|todo|temp|debug)" > /dev/null; then
            echo "::error::PR contains work-in-progress commit messages. Please squash or rewrite these commits."
            exit 1
          fi
      
      - name: Check PR for large files
        run: |
          git diff --name-only --diff-filter=A origin/${{ github.base_ref }}..HEAD | \
          xargs -I{} sh -c 'if [ -f "{}" ] && [ $(stat -c%s "{}") -gt 5000000 ]; then echo "::error::File {} is too large (>5MB). Consider Git LFS."; exit 1; fi'
      
      - name: Check for sensitive information
        run: |
          git diff origin/${{ github.base_ref }}..HEAD | \
          grep -i -E '(password|secret|token|key|credential).*[=:].{6,}' && \
          echo "::error::Potential sensitive information detected in changes. Please review." && exit 1 || echo "No obvious sensitive information detected."