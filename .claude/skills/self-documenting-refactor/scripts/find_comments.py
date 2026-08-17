#!/usr/bin/env python3

import os
import re
import sys
from pathlib import Path


SINGLE_LINE_COMMENT_PATTERN = re.compile(r"^\s*//")
BLOCK_COMMENT_START_PATTERN = re.compile(r"/\*")
BLOCK_COMMENT_END_PATTERN = re.compile(r"\*/")
TYPESCRIPT_EXTENSIONS = {".ts", ".tsx"}
EXCLUDED_DIRECTORIES = {"node_modules", ".next", "dist", "build", "coverage"}


def find_comments_in_file(filepath):
    comments = []
    in_block_comment = False
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line_num, line in enumerate(f, 1):
                stripped = line.strip()

                if in_block_comment:
                    comments.append((line_num, line.rstrip()))
                    if BLOCK_COMMENT_END_PATTERN.search(stripped):
                        in_block_comment = False
                    continue

                if BLOCK_COMMENT_START_PATTERN.search(stripped):
                    comments.append((line_num, line.rstrip()))
                    if not BLOCK_COMMENT_END_PATTERN.search(stripped):
                        in_block_comment = True
                    continue

                if SINGLE_LINE_COMMENT_PATTERN.match(stripped):
                    comments.append((line_num, line.rstrip()))

    except Exception as e:
        print(f"Error reading {filepath}: {e}", file=sys.stderr)
    return comments


def should_skip_directory(directory_name):
    return directory_name in EXCLUDED_DIRECTORIES


def is_typescript_file(filepath):
    return filepath.suffix in TYPESCRIPT_EXTENSIONS


def scan_directory(directory):
    directory = Path(directory)
    all_comments = {}

    for ts_file in directory.rglob("*"):
        if not is_typescript_file(ts_file):
            continue

        if any(should_skip_directory(part) for part in ts_file.parts):
            continue

        comments = find_comments_in_file(ts_file)
        if comments:
            all_comments[str(ts_file)] = comments

    return all_comments


def main():
    search_dir = sys.argv[1] if len(sys.argv) > 1 else "src"

    if not os.path.exists(search_dir):
        print(f"Directory not found: {search_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"Scanning {search_dir} for comments in TypeScript files...\n")

    results = scan_directory(search_dir)

    if not results:
        print("No comments found! Code is self-documenting.")
        sys.exit(0)

    print(f"Found comments in {len(results)} file(s):\n")

    total_comments = 0
    for filepath, comments in sorted(results.items()):
        print(f"{filepath}:")
        for line_num, line in comments:
            print(f"  Line {line_num}: {line}")
            total_comments += 1
        print()

    print(f"Total: {total_comments} comment(s) found")
    print("\nREMINDER: This project has a NO COMMENTS policy.")
    print("Refactor these comments into self-documenting code.")

    sys.exit(1)


if __name__ == "__main__":
    main()
