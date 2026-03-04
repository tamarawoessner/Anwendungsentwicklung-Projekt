#!/bin/bash
set -e

echo "Restoring DB from custom dump..."
pg_restore \
	-U "$POSTGRES_USER" \
	-d "$POSTGRES_DB" \
	--clean \
	--if-exists \
	--no-owner \
	--no-privileges \
	--exit-on-error \
	/docker-entrypoint-initdb.d/01_seed.dump
echo "Restore done."