@echo off
title Greenhouse Local AI Model Agent (Qwen 4B Llamafile)
color 0B

echo ======================================================================
echo    GREENHOUSE LOCAL AI MODEL AGENT (QWEN 4B LLAMAFILE)
echo ======================================================================
echo.
echo Model:   qwen3-4b-thinking-2507.Q4_K_M.gguf
echo Server:  http://127.0.0.1:8080
echo.
echo Loading weights into memory... please wait 15-30 seconds.
echo When ready, it will say "HTTP server listening on http://127.0.0.1:8080"
echo Keep this window open while using the local LLM!
echo ======================================================================
echo.

.\llamafile-0.10.5.exe --server --model qwen3-4b-thinking-2507.Q4_K_M.gguf --host 127.0.0.1 --port 8080 --nobrowser

pause
