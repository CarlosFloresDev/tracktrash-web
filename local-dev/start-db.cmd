@echo off
rem Starts the local portable PostgreSQL (data lives on D:) on port 54329.
set PGBIN=D:\DevTools\postgres\pgsql\bin
"%PGBIN%\pg_ctl.exe" -D D:\DevTools\postgres\data -o "-p 54329" -l D:\DevTools\postgres\pg.log start
