@echo off

REM The name of the output file
set "output_file=project_review_src.txt"

REM The directory to search in
set "search_dir=src"

REM Clear the output file if it already exists
if exist "%output_file%" del "%output_file%"

REM Check if the search directory exists
if not exist "%search_dir%" (
    echo Error: The '%search_dir%' directory was not found.
    exit /b 1
)

REM Find all .astro files and append them
for /r "%search_dir%" %%f in (*.astro) do (
    echo --- FILE: %%f --- >> "%output_file%"
    type "%%f" >> "%output_file%"
    echo. >> "%output_file%"
)

REM Find all .ts files and append them to the same file
for /r "%search_dir%" %%f in (*.ts) do (
    echo --- FILE: %%f --- >> "%output_file%"
    type "%%f" >> "%output_file%"
    echo. >> "%output_file%"
)

echo All .astro and .ts files from the '%search_dir%' folder have been combined into %output_file%