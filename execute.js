#!/usr/bin/env node

import { handler } from "./dist/main.js"

handler({
    accessToken: "...",
    repositoryName: "test-repo",
    repositoryBranch: "main",
    userPrompt: "test"
}, {}).catch()