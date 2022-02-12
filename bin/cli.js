#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { patch } from "./../lib/pupPatch.js";

yargs(hideBin(process.argv))
  .command({
    command: "patch",
    desc: "patch Puppeteer",
    handler: (argv) => {
      patch();
    },
  })
  .command({
    command: "unpatch",
    desc: "unpatch Puppeteer",
    handler: (argv) => {
      patch();
    },
  })
  .demandCommand(1, "You need to invoke a command use -h to see commands")
  .help()
  .parse();
