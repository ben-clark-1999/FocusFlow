import os

# Only include these top-level folders/files
INCLUDE_ITEMS = {
    "assets", "dist", "scripts", "src", "tests",
    ".gitattributes", ".gitignore",  "package-lock.json", 
    "package.json", 
}

# Skip this folder anywhere it appears
EXCLUDE_FOLDERS = {"node_modules"}

with open("structure.txt", "w") as f:
    for root, dirs, files in os.walk(".", topdown=True):
        # Filter out excluded folders
        dirs[:] = [d for d in dirs if d not in EXCLUDE_FOLDERS]

        # Figure out the relative path
        rel_path = os.path.relpath(root, ".")
        if rel_path == ".":
            # At root — only include certain folders/files
            dirs[:] = [d for d in dirs if d in INCLUDE_ITEMS]
            files = [file for file in files if file in INCLUDE_ITEMS]

        # Write folder name
        level = root.count(os.sep)
        indent = "    " * level
        f.write(f"{indent}{os.path.basename(root)}/\n")

        # Write file names
        subindent = "    " * (level + 1)
        for name in files:
            f.write(f"{subindent}{name}\n")
