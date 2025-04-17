# Code Pointers - VS Code Extension

Save and revisit important lines of code with ease.

**Code Pointers** is a simple yet powerful VS Code extension that lets you bookmark specific lines in your codebase with one right-click. Perfect for debugging, code reviews, or tracking important sections across sessions.

## ✨ Features

- 📍 Right-click any line and **Save Code Pointer** — stores file path, line number, and line content
- 🕒 Automatically saves the **timestamp**
- 🔗 Saves pointers as **clickable links** in a Markdown file
- 🧭 Use **Show Code Pointers** command to jump back to saved lines
- 📁 Stores all pointers in a file called `code_book.md` in the root of your workspace
- ✅ Duplicate line prevention
- 📖 Works across all file types

## Limitation

Code pointers are static: Saved pointers capture the file path, line number, and line content at the time of saving. If the file is later modified (e.g. lines are added or removed), the saved line number may no longer point to the intended code, and the content in code_book.md will not reflect the changes.

**Enjoy!**
