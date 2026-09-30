#!/usr/bin/env node
// The bin pnpm links at install, before the kit is built: a committed file that loads the built CLI.
import '../dist/cli.js';
