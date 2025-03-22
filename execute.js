#!/usr/bin/env node

import { handler } from "./dist/main.js"

handler({
    hi: "hi"
}, {}).catch()