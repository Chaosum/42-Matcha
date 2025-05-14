#!/usr/bin/env bash

# Stop the database
docker compose rm -svf db
docker volume rm -f matcha_db 

# Delete image folder
rm -rf ./images