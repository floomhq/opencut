# Contributing to OpenCut

Thank you for your interest in contributing to OpenCut! This document provides guidelines for reporting issues, submitting pull requests, and coding standards.

## How to Contribute

### Reporting Bugs

Before opening a new issue, please search existing issues to avoid duplicates.

When reporting a bug, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Your environment (Node.js version, OS, Remotion version)
- Relevant code snippets or error messages
- If applicable, a minimal reproducible example

### Suggesting Features

Feature requests are welcome! Please open an issue with:

- A clear description of the feature
- The problem it solves
- Any alternative solutions you've considered
- Mockups or examples if applicable

### Pull Requests

1. Fork the repository and create a new branch from `main`
2. Make your changes
3. Ensure all tests pass: `npm test`
4. Ensure type checking passes: `npm run typecheck`
5. Ensure linting passes: `npx eslint src/ --ext .ts,.tsx`
6. Update documentation if your changes affect the public API
7. Add tests for new functionality
8. Reference any related issues in your PR description

## Development Setup

```bash
git clone https://github.com/floomhq/opencut.git
cd opencut
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration test (requires Chrome/Chromium)
node --require ts-node/register --test src/engine/__tests__/integration.test.ts
```

### Code Style

- TypeScript with `strict: true`
- No explicit `any` types in production code
- All public functions must have explicit return types
- Prefer `const` and `let` over `var`
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

## Project Structure

- `src/engine/` — Reusable video components and animation utilities
- `src/cli/` — Command-line tools for init, validate, transcribe, and render
- `src/workflow/` — Project loading, validation, and file generation
- `src/examples/` — Example video projects demonstrating features
- `src/ai/` — AI integration (Gemini scene planner)
- `src/api/` — Express server for job queue rendering

## Questions?

Feel free to open a [GitHub Discussion](https://github.com/floomhq/opencut/discussions) or reach out via the issue tracker.
