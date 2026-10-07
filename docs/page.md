---
order: 1
title: "Introduction"
description: "What Onus does, how to install it, and where to find each topic."
icon: "book"
---

# Introduction

Onus turns a pull request into a short report of changes in meaning: new external services, contract changes, new relationships between components, weakened tests, broken rules. Every row is computed from the code by deterministic analysis, never generated, and links to the files and lines behind it. Onus only reads files: it never installs or runs the code it analyzes.

## Install

With Homebrew, on macOS or Linux:

```sh
brew install onushq/tap/onus
```

Or with the installer, which checks the download's SHA-256 and puts `onus` in `~/.local/bin`:

```sh
curl -fsSL https://onushq.com/install.sh | sh
```

Then, in a git repository:

```sh
onus report --base main --head HEAD
```

Archives for macOS, Linux and Windows are on the [releases page](https://github.com/onushq/onus/releases), and the GitHub Action reports on every pull request (see [CI](/docs/ci)).

## The guide

These pages are the guide that ships inside the `onus` binary: `onus help <topic>` prints any of them in the terminal, offline.

| Topic | What it covers |
| --- | --- |
| [getting-started](/docs/getting-started) | Install Onus, build a map and read your first report |
| [commands](/docs/commands) | Every command and flag, with examples and exit codes |
| [reports](/docs/reports) | Reading a report: rows, ranking, evidence and the JSON |
| [changes](/docs/changes) | Every kind and subkind of change Onus reports |
| [configuration](/docs/configuration) | The onus.yaml reference: components, rules, labels, extractors |
| [intent](/docs/intent) | Checking a change against its stated intent |
| [ci](/docs/ci) | Running Onus on every pull request |
| [plugins](/docs/plugins) | New languages and frameworks, SCIP indexes, language servers, trusted mode |
| [how-it-works](/docs/how-it-works) | How maps are built and compared |
| [troubleshooting](/docs/troubleshooting) | Map confidence notes, common questions and current limits |

The source is in the [onus repository](https://github.com/onushq/onus/tree/main/crates/onus-cli/guide).
