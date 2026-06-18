#!/usr/bin/env python3
"""Resize and compress images in files/ for web delivery."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

MAX_WIDTH = 1920
PNG_QUALITY = "65-85"
JPG_QUALITY = 80
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg"}


def run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, capture_output=True, text=True)


def image_size(path: Path) -> int:
    return path.stat().st_size


def get_width(path: Path) -> int | None:
    result = run(["sips", "-g", "pixelWidth", str(path)])
    if result.returncode != 0:
        return None
    for line in result.stdout.splitlines():
        if "pixelWidth" in line:
            return int(line.split()[-1])
    return None


def resize_if_needed(path: Path) -> bool:
    width = get_width(path)
    if width is None or width <= MAX_WIDTH:
        return False

    result = run(["sips", "--resampleWidth", str(MAX_WIDTH), str(path)])
    if result.returncode != 0:
        print(f"  resize failed: {path.name}: {result.stderr.strip()}", file=sys.stderr)
        return False
    return True


def compress_png(path: Path) -> bool:
    pngquant = shutil.which("pngquant")
    if not pngquant:
        print("pngquant not found", file=sys.stderr)
        return False

    tmp = path.with_suffix(".compressed.png")
    result = run(
        [
            pngquant,
            f"--quality={PNG_QUALITY}",
            "--skip-if-larger",
            "--force",
            "--output",
            str(tmp),
            str(path),
        ]
    )
    if result.returncode != 0:
        tmp.unlink(missing_ok=True)
        return False

    tmp.replace(path)
    return True


def compress_jpg(path: Path) -> bool:
    result = run(
        [
            "sips",
            "-s",
            "format",
            "jpeg",
            "-s",
            "formatOptions",
            str(JPG_QUALITY),
            str(path),
        ]
    )
    return result.returncode == 0


def compress_file(path: Path, root: Path) -> tuple[int, int]:
    before = image_size(path)
    resized = resize_if_needed(path)

    suffix = path.suffix.lower()
    if suffix == ".png":
        ok = compress_png(path)
    elif suffix in {".jpg", ".jpeg"}:
        ok = compress_jpg(path)
    else:
        ok = False

    after = image_size(path)
    tag = []
    if resized:
        tag.append("resized")
    if ok:
        tag.append("compressed")
    elif not resized:
        tag.append("skipped")

    label = ", ".join(tag) if tag else "unchanged"
    ratio = (1 - after / before) * 100 if before else 0
    print(f"  {path.relative_to(root.parent)}: {before // 1024}KB → {after // 1024}KB ({ratio:.0f}%) [{label}]")
    return before, after


def collect_images(root: Path, scene_filter: str | None) -> list[Path]:
    files: list[Path] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        if scene_filter and scene_filter not in str(path.parent):
            continue
        files.append(path)
    return files


def main() -> int:
    root = Path(__file__).resolve().parents[1] / "files"
    scene_filter = sys.argv[1] if len(sys.argv) > 1 else None

    if not root.is_dir():
        print(f"Missing directory: {root}", file=sys.stderr)
        return 1

    images = collect_images(root, scene_filter)
    if not images:
        print("No images found.")
        return 1

    label = scene_filter or "all scenes"
    print(f"Compressing {len(images)} images ({label})...\n")

    total_before = 0
    total_after = 0
    for path in images:
        before, after = compress_file(path, root)
        total_before += before
        total_after += after

    saved = total_before - total_after
    pct = saved / total_before * 100 if total_before else 0
    print(
        f"\nTotal: {total_before / 1024 / 1024:.1f} MB → {total_after / 1024 / 1024:.1f} MB "
        f"(saved {saved / 1024 / 1024:.1f} MB, {pct:.0f}%)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
