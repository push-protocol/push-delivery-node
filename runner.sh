#!/bin/bash
npm run build
cp .env build/.env
pm2 reload ecosystem.config.js --env production
pm2 logs
# EOF
