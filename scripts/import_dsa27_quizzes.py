#!/usr/bin/env python3
"""Build the DSA27 self-check quizzes from the course question bank.

Reads Part A (multiple choice) and Part B (short answer and essay) of
docs/question-bank/weekNN-questions.md and the matching weekNN-answers.md in a local clone of
helghareeb/DSA27, and writes src/data/quizzes/dsa27/weekNN.json: each multiple-choice question
with its four options, the correct option and the explanation, and each essay question with its
marks and model answer (the marking points), all already rendered to HTML.

    python scripts/import_dsa27_quizzes.py ../DSA27
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "src" / "data" / "quizzes" / "dsa27"

QUESTION_RE = re.compile(r"^\*\*(W\d+-M\d+)\*\*\s*(?:\[(what|how|why)\])?\s*(.*)$")
OPTION_RE = re.compile(r"^- \*\*([a-d])\)\*\*\s*(.*)$")
ANSWER_RE = re.compile(r"^\*\*(W\d+-M\d+) — ([a-d])\.\*\*\s*(.*)$")
ESSAY_RE = re.compile(r"^\*\*(W\d+-E\d+)\*\*\s*(?:\[(what|how|why)\])?\s*\*\((\d+) marks?\)\*\s*(.*)$")
ESSAY_ANSWER_RE = re.compile(r"^\*\*(W\d+-E\d+)\*\*\s*\*\((\d+)\)\*\s*(.*)$")

LATEX_SYMBOLS = {
    r"\Theta": "Θ",
    r"\Omega": "Ω",
    r"\alpha": "α",
    r"\varphi": "φ",
    r"\rightarrow": "→",
    r"\to": "→",
    r"\dots": "…",
    r"\cdots": "⋯",
    r"\ldots": "…",
    r"\cdot": "·",
    r"\times": "×",
    r"\le": "≤",
    r"\ge": "≥",
    r"\approx": "≈",
    r"\lfloor": "⌊",
    r"\rfloor": "⌋",
    r"\lceil": "⌈",
    r"\rceil": "⌉",
    r"\sum": "Σ",
    r"\log": "log",
    r"\deg": "deg",
    r"\max": "max",
    r"\bigl": "",
    r"\bigr": "",
    r"\,": "\u2009",
}


def part_a(text: str) -> list[str]:
    start = text.index("# Part A")
    end = text.index("# Part B", start)
    return text[start:end].splitlines()[1:]


def part_b(text: str) -> list[str]:
    start = text.index("# Part B")
    following = re.search(r"^# Part ", text[start + 1:], re.M)
    end = start + 1 + following.start() if following else len(text)
    return text[start:end].splitlines()[1:]


def render_math(source: str) -> str:
    """Render the small LaTeX subset used in the question bank as HTML."""
    value = source
    value = re.sub(r"\\t?frac\{([^{}]*)\}\{([^{}]*)\}", r"\1/\2", value)
    value = re.sub(r"\\t?frac(\d)(\d)", r"\1/\2", value)
    value = re.sub(r"\\text\{([^{}]*)\}", r"\1", value)
    value = re.sub(r"\\sqrt\{([^{}]*)\}", lambda m: "√" + (m[1] if len(m[1]) == 1 else f"({m[1]})"), value)
    for command in sorted(LATEX_SYMBOLS, key=len, reverse=True):
        boundary = r"(?![a-zA-Z])" if command[-1].isalpha() else ""
        value = re.sub(re.escape(command) + boundary, LATEX_SYMBOLS[command], value)
    if "\\" in value:
        raise ValueError(f"unhandled LaTeX in ${source}$")
    value = html.escape(value, quote=False)
    value = re.sub(r"\^\{([^{}]*)\}|\^(\w)", lambda m: f"<sup>{m[1] or m[2]}</sup>", value)
    value = re.sub(r"_\{([^{}]*)\}|_(\w)", lambda m: f"<sub>{m[1] or m[2]}</sub>", value)
    return f'<span class="quiz-math">{value}</span>'


def render_inline(text: str) -> str:
    slots: list[str] = []

    def keep(fragment: str) -> str:
        slots.append(fragment)
        return f"\x00{len(slots) - 1}\x00"

    text = re.sub(r"`([^`]+)`", lambda m: keep(f"<code>{html.escape(m[1], quote=False)}</code>"), text)
    text = re.sub(r"(?<![\\$])\$([^$\n]+)\$", lambda m: keep(render_math(m[1])), text)
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", text)
    return re.sub(r"\x00(\d+)\x00", lambda m: slots[int(m[1])], text)


def render_block(lines: list[str]) -> str:
    """Render paragraphs and fenced code blocks."""
    parts: list[str] = []
    paragraph: list[str] = []
    code: list[str] | None = None

    def flush() -> None:
        if paragraph:
            parts.append(f"<p>{render_inline(' '.join(paragraph))}</p>")
            paragraph.clear()

    for line in lines:
        if line.strip().startswith("```"):
            if code is None:
                flush()
                code = []
            else:
                parts.append(f"<pre><code>{html.escape(chr(10).join(code), quote=False)}</code></pre>")
                code = None
            continue
        if code is not None:
            code.append(line)
        elif not line.strip() or line.strip() == "---":
            flush()
        else:
            paragraph.append(line.strip())
    flush()
    if code is not None:
        raise ValueError("unclosed code fence")
    return "".join(parts)


def render_rich(lines: list[str]) -> str:
    """Render the model answers: paragraphs, bullet and numbered lists, tables and code."""
    parts: list[str] = []
    paragraph: list[str] = []
    items: list[list[str]] = []
    ordered = False
    table: list[str] = []
    code: list[str] | None = None

    def flush() -> None:
        nonlocal items, table
        if paragraph:
            parts.append(f"<p>{render_inline(' '.join(paragraph))}</p>")
            paragraph.clear()
        if items:
            tag = "ol" if ordered else "ul"
            parts.append(f"<{tag}>" + "".join(f"<li>{render_inline(' '.join(item))}</li>" for item in items) + f"</{tag}>")
            items = []
        if table:
            rows = [[cell.strip() for cell in row.strip().strip("|").split("|")] for row in table]
            body = [row for row in rows[1:] if not all(re.fullmatch(r":?-+:?", cell) for cell in row)]
            head = "".join(f"<th>{render_inline(cell)}</th>" for cell in rows[0])
            cells = "".join("<tr>" + "".join(f"<td>{render_inline(cell)}</td>" for cell in row) + "</tr>" for row in body)
            parts.append(f'<div class="quiz-table"><table><thead><tr>{head}</tr></thead><tbody>{cells}</tbody></table></div>')
            table = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            if code is None:
                flush()
                code = []
            else:
                parts.append(f"<pre><code>{html.escape(chr(10).join(code), quote=False)}</code></pre>")
                code = None
            continue
        if code is not None:
            code.append(line[2:] if line.startswith("  ") and items else line)
            continue
        bullet = re.match(r"^(-|\d+\.)\s+(.*)$", line)
        if bullet:
            if paragraph or table or (items and ordered != (bullet[1] != "-")):
                flush()
            ordered = bullet[1] != "-"
            items.append([bullet[2]])
        elif stripped.startswith("|"):
            if not table:
                flush()
            table.append(stripped)
        elif not stripped or stripped == "---":
            flush()
        elif items and line.startswith(" "):
            items[-1].append(stripped)
        else:
            if items or table:
                flush()
            paragraph.append(stripped)
    flush()
    if code is not None:
        raise ValueError("unclosed code fence")
    return "".join(parts)


def parse_essays(lines: list[str]) -> list[dict]:
    essays: list[dict] = []
    current: dict | None = None
    for line in lines:
        match = ESSAY_RE.match(line)
        if match:
            current = {"id": match[1], "level": match[2] or "", "marks": int(match[3]), "stem": [match[4]]}
            essays.append(current)
        elif re.match(r"^\*\*W\d+-[A-Z]\d+\*\*", line):
            current = None
        elif current is not None:
            current["stem"].append(line)
    return [{**essay, "stem": render_rich(essay["stem"])} for essay in essays]


def parse_essay_answers(lines: list[str]) -> dict[str, tuple[int, str]]:
    answers: dict[str, tuple[int, list[str]]] = {}
    current: str | None = None
    for line in lines:
        match = ESSAY_ANSWER_RE.match(line)
        if match:
            current = match[1]
            answers[current] = (int(match[2]), [match[3]])
        elif re.match(r"^\*\*W\d+-[A-Z]\d+\*\*", line):
            current = None
        elif current:
            answers[current][1].append(line)
    return {key: (marks, render_rich(body)) for key, (marks, body) in answers.items()}


def parse_questions(lines: list[str]) -> list[dict]:
    questions: list[dict] = []
    current: dict | None = None
    for line in lines:
        match = QUESTION_RE.match(line)
        if match:
            current = {"id": match[1], "level": match[2] or "", "stem": [match[3]], "options": {}}
            questions.append(current)
            continue
        if current is None:
            continue
        option = OPTION_RE.match(line)
        if option:
            current["options"][option[1]] = [option[2]]
            current["last"] = option[1]
        elif current["options"] and line.startswith("  ") and line.strip():
            current["options"][current["last"]].append(line.strip())
        elif not current["options"]:
            current["stem"].append(line)

    result = []
    for question in questions:
        if sorted(question["options"]) != ["a", "b", "c", "d"]:
            raise ValueError(f"{question['id']}: expected options a-d, found {sorted(question['options'])}")
        result.append(
            {
                "id": question["id"],
                "level": question["level"],
                "stem": render_block(question["stem"]),
                "options": [render_inline(" ".join(question["options"][key])) for key in "abcd"],
            }
        )
    return result


def parse_answers(lines: list[str]) -> dict[str, tuple[str, str]]:
    answers: dict[str, tuple[str, list[str]]] = {}
    current: str | None = None
    for line in lines:
        match = ANSWER_RE.match(line)
        if match:
            current = match[1]
            answers[current] = (match[2], [match[3]])
        elif current:
            answers[current][1].append(line)
    return {key: (letter, render_block(body)) for key, (letter, body) in answers.items()}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("dsa27", nargs="?", default=str(ROOT.parent / "DSA27"))
    args = parser.parse_args()

    bank = Path(args.dsa27) / "docs" / "question-bank"
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = 0
    for questions_path in sorted(bank.glob("week[0-9][0-9]-questions.md")):
        week = int(questions_path.name[4:6])
        questions_text = questions_path.read_text(encoding="utf-8")
        answers_text = (bank / f"week{week:02d}-answers.md").read_text(encoding="utf-8")

        subtitle = re.search(r'^subtitle:\s*"(.*)"', questions_text, re.M)
        title = re.sub(r"\s*—\s*Questions$", "", subtitle[1]) if subtitle else f"Week {week}"

        questions = parse_questions(part_a(questions_text))
        answers = parse_answers(part_a(answers_text))
        if {q["id"] for q in questions} != set(answers):
            raise ValueError(f"week {week}: questions and answers do not match")
        for question in questions:
            letter, explanation = answers[question["id"]]
            question["answer"] = "abcd".index(letter)
            question["explanation"] = explanation

        essays = parse_essays(part_b(questions_text))
        essay_answers = parse_essay_answers(part_b(answers_text))
        if {e["id"] for e in essays} != set(essay_answers):
            raise ValueError(f"week {week}: essay questions and answers do not match")
        for essay in essays:
            marks, answer = essay_answers[essay["id"]]
            if marks != essay["marks"]:
                raise ValueError(f"{essay['id']}: {essay['marks']} marks in the question, {marks} in the answer")
            essay["answer"] = answer

        out = OUT_DIR / f"week{week:02d}.json"
        out.write_text(
            json.dumps({"week": week, "title": title, "questions": questions, "essays": essays}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        total += len(questions)
        print(f"week {week:02d}: {len(questions)} questions, {len(essays)} essays -> {out.relative_to(ROOT)}")

    print(f"{total} questions")
    return 0


if __name__ == "__main__":
    sys.exit(main())
