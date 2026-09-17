#!/bin/bash
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js не найден. Установите его с сайта nodejs.org и перезапустите компьютер."
  read -n 1 -s -r -p "Нажмите любую клавишу, чтобы закрыть..."
  exit 1
fi

node update.mjs

echo ""
read -n 1 -s -r -p "Нажмите любую клавишу, чтобы закрыть..."
