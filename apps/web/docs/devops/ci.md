name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - '*'
  workflow_dispatch:

jobs:
  lint-typecheck:
    name: Lint and Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18.20"
          
      - name: Setup PNPM
        uses: pnpm/action-setup@v3
        with:
          version: 9.0.0
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Lint
        run: pnpm lint
        
      - name: Type check
        run: pnpm check-types
        
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18.20"
          
      - name: Setup PNPM
        uses: pnpm/action-setup@v3
        with:
          version: 9.0.0
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run tests
        run: pnpm --filter rathburn-app test