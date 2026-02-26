#!/bin/bash
set -e

echo "Restoring DB from custom dump..."
pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" /docker-entrypoint-initdb.d/02_seed.dump
echo "Restore done."