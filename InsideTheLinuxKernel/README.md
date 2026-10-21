# Inside the Linux Kernel

*Inside the Linux Kernel* (v0.1) explains how the Linux kernel works at the level of its data structures, algorithms, locking rules, and design decisions. It covers **Linux 7.0.12** on **x86_64** and **ARM64**, with each mechanism traced through the kernel source on both architectures.

The book is published in two formats built from the same source:

| Format | Location | Best for |
|---|---|---|
| HTML | `html/index.html` | Reading in a browser, following cross-references, searching a single chapter |
| PDF | `build/inside-the-linux-kernel-v0.1.pdf` | Offline reading, printing, whole-book search |

## Contents

| | |
|---|---|
| Preface | Scope, audience, organization, and conventions |
| 1 | Introduction |
| 2 | Memory Addressing |
| 3 | Processes |
| 4 | Interrupts and Exceptions |
| 5 | Kernel Synchronization |
| 6 | Timing Measurements |
| 7 | Process Scheduling |
| 8 | Memory Management |
| 9 | Process Address Space |
| 10 | System Calls |
| 11 | Signals |
| 12 | The Virtual Filesystem |
| 13 | I/O Architecture and Device Drivers |
| 14 | Block Device Drivers |
| 15 | The Page Cache |
| 16 | Accessing Files |
| 17 | Page Frame Reclaiming |
| 18 | The Ext4 Filesystem |
| 19 | Process Communication |
| 20 | Program Execution |
| 21 | Power Management |
| 22 | Networking |
| 23 | The eBPF Subsystem |
| 24 | io_uring |
| 25 | Containers, Namespaces, and Cgroups |
| 26 | Rust in the Kernel |
| 27 | Kernel Security Infrastructure |
| 28 | Virtualization: KVM |
| 29 | Tracing, Debugging, and Kernel Diagnostics |
| A | System Startup |
| B | Kernel Modules |
| Source Trails | Per-chapter reading guide: which kernel source files to read, and what to look for in each |

## HTML version

The HTML book is a set of static pages in `html/` and needs no build step.

```
html/
├── index.html            cover and table of contents
├── preface.html
├── chapter-1.html … chapter-29.html
├── appendix-a.html, appendix-b.html
├── source-trails.html
└── assets/
    ├── style.css         shared stylesheet (screen and print)
    ├── tables.js         keeps short table labels on one line
    └── progress.js       reading-progress bar
```

### Reading

Open `html/index.html` in a browser, or serve the directory locally:

```sh
cd html
python3 -m http.server 8000
# then browse to http://localhost:8000/
```

Each chapter begins with its own table of contents. Section numbers (§N.M) and figure and table numbers (Figure N-M, Table N-M) are local to the chapter. Cross-chapter references are links. Diagrams are inline SVG, so they scale with the page and their text can be selected and searched.

The pages load the Inter, Merriweather, and JetBrains Mono web fonts from Google Fonts. Without network access the browser falls back to local fonts, and the content is unchanged.

## PDF version

The PDF is generated from the HTML by `tools/build_pdf.py` and written to `build/`. That directory is not tracked in git.

What the PDF contains:

- One continuous document of about 5,300 US-Letter pages with continuous page numbering.
- A bookmark outline (chapters → sections → subsections) that is shown when the file opens.
- Working cross-chapter links and per-chapter running headers.
- Figures, tables, and code blocks styled as in the browser. Any table or code block wider than the text column is scaled down to fit.

### Requirements

- Google Chrome or Chromium **131 or newer**, needed for `@page` margin boxes.
- Python 3 with `pypdf` and `websocket-client`.

```sh
python3 -m venv venv
venv/bin/pip install pypdf websocket-client
```

### Building

```sh
venv/bin/python tools/build_pdf.py
```

The script prints each page separately with headless Chrome (Chrome refuses a single print job of the whole book). It then merges the parts with pypdf, turns cross-page links into in-document jumps, and rebuilds the outline. A full build takes several minutes.

| Option | Default | Purpose |
|---|---|---|
| `-o`, `--output` | `build/inside-the-linux-kernel-v0.1.pdf` | Output file |
| `--pages` | all | Comma-separated subset to render, e.g. `chapter-5,appendix-b`, for a quick check of one change |
| `--depth` | `3` | Outline depth: 1 = chapters, 2 = + sections, 3 = + subsections |
| `--scale` | `0.864` | Print scale; the default gives 11 pt body text with the text column at its on-screen width |
| `--chrome` | `google-chrome` | Chrome or Chromium executable to use |
| `--keep-html` | off | Keep the per-page HTML and PDF intermediates in a temporary directory |

The script warns about any link it cannot resolve and any block still wider than the text column after fitting.

## Copyright

© 2026 Lianwei Wang. All rights reserved. See [LICENSE](LICENSE) and [COPYRIGHT](COPYRIGHT). Excerpts of Linux kernel source code quoted in the book remain under their original licenses (GPL-2.0).
