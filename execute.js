#!/usr/bin/env node

import { handler } from "./dist/main.js"

handler({
    accessToken: "...",
    repositoryName: "basic-next-app",
    repositoryBranch: "main",
    userPrompt: "test"
}, {}).catch()
