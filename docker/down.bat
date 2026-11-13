@echo off
setlocal

echo Removing existing Docker containers and volumes...
rem --volumes only removes this project's volumes. "docker volume prune" would act on every project's volumes instead.
docker compose down --volumes
