#!/usr/bin/env bash
# Quick HTTP server for the worker exercises.
# Workers can't load from file:// URLs.
cd "$(dirname "$0")"
echo "Serving lessons/02-workers/ at http://localhost:8080"
echo "Open http://localhost:8080/01-hello/ to start with exercise 1."
python3 -m http.server 8080
