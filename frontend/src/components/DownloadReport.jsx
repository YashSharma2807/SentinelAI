import React, { useState } from "react";
import { jsPDF } from "jspdf";

/* =============================================================================
   SentinelAI — DownloadReport.jsx
   Generates a professional, multi-page, enterprise-grade cybersecurity
   incident report PDF (Defender / CrowdStrike / Splunk style) using jsPDF.
============================================================================= */

/* ---------------------------------- THEME ---------------------------------- */

const THEME = {
  purple: [88, 28, 135],       // deep purple  (headers)
  purpleAccent: [124, 58, 237], // vibrant purple (accents / dividers)
  purpleLight: [237, 233, 254], // pale purple (info boxes bg)
  purpleBorder: [196, 181, 253],
  ink: [30, 27, 46],           // near-black text
  slate: [71, 85, 105],        // secondary text
  muted: [148, 163, 184],      // captions
  white: [255, 255, 255],
  divider: [226, 232, 240],
  cardBg: [250, 250, 252],
  cardBorder: [228, 224, 245],
};

const SEVERITY_STYLES = {
  CRITICAL: { bg: [220, 38, 38], text: [255, 255, 255], label: "CRITICAL" },
  HIGH: { bg: [249, 115, 22], text: [255, 255, 255], label: "HIGH" },
  MEDIUM: { bg: [234, 179, 8], text: [54, 43, 5], label: "MEDIUM" },
  LOW: { bg: [34, 197, 94], text: [255, 255, 255], label: "LOW" },
  INFO: { bg: [100, 116, 139], text: [255, 255, 255], label: "INFO" },
};

const SEVERITY_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };

const PAGE = { width: 595.28, height: 841.89, margin: 42 };

/* ------------------------------- HELPERS ------------------------------- */

function normalizeSeverity(sev) {
  if (!sev) return "INFO";
  const s = String(sev).trim().toUpperCase();
  if (SEVERITY_STYLES[s]) return s;
  return "INFO";
}

function computeOverallSeverity(detections = []) {
  let top = "LOW";
  let topRank = -1;
  detections.forEach((d) => {
    const s = normalizeSeverity(d.severity);
    const r = SEVERITY_RANK[s] ?? 0;
    if (r > topRank) {
      topRank = r;
      top = s;
    }
  });
  return detections.length ? top : "LOW";
}

function formatDate(d) {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(d) {
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function fileNameSafeDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Generates an incident report identifier in the form SIR-YYYY-XXXX. */
function generateReportId(d) {
  const year = d.getFullYear();
  const seed =
    (d.getMonth() + 1) * 3671 +
    d.getDate() * 131 +
    d.getHours() * 17 +
    d.getMinutes() * 7 +
    d.getSeconds();
  const seq = String(seed % 10000).padStart(4, "0");
  return `SIR-${year}-${seq}`;
}

/**
 * jsPDF's built-in Helvetica/Courier fonts only support the WinAnsi/Latin-1
 * glyph set. Smart quotes, em/en dashes, ellipses, and bullet glyphs commonly
 * returned by LLMs fall outside that set and can make jsPDF mis-measure and
 * mis-space text (the "T h i s   i s" artifact). Normalize everything to
 * plain ASCII equivalents before it ever reaches doc.text().
 */
function sanitizeForPDF(text) {
  return String(text)
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2012]/g, "-")
    .replace(/\u2014/g, " - ")
    .replace(/\u2026/g, "...")
    .replace(/[\u2022\u25CF\u25AA\u25E6\u2043]/g, "-")
    .replace(/[\u00A0\u2000-\u200B\u202F]/g, " ")
    .replace(/[\u2192\u2794]/g, "->")
    // Strip any remaining character outside printable ASCII (e.g. emoji)
    // rather than let an unsupported glyph corrupt line-width calculations.
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

/* Strip stray markdown symbols from inline text (bold/italic/code markers). */
function cleanInline(text) {
  return sanitizeForPDF(text)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^#+\s*/, "")
    .replace(/_/g, " ")
    .trim();
}

/**
 * If a single "word" (no spaces) is wider than maxWidth, force-breaks it into
 * space-joined chunks so jsPDF's line splitter can wrap it. This is essential
 * for long unbroken tokens such as Base64-encoded PowerShell commands.
 */
function breakLongToken(doc, token, maxWidth) {
  // Guard against degenerate widths and short tokens: never let this fall
  // back to per-character splitting, which is what produces spaced-out
  // text like "T h i s". Only long unbroken strings (Base64, hashes, URLs)
  // are eligible for forced breaking, and only when there's real room.
  if (!maxWidth || maxWidth < 24 || token.length < 18) return token;
  if (doc.getTextWidth(token) <= maxWidth) return token;

  const pieces = [];
  let current = "";
  for (const char of token) {
    const candidate = current + char;
    if (doc.getTextWidth(candidate) > maxWidth && current) {
      pieces.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }
  if (current) pieces.push(current);
  return pieces.join(" ");
}

/** Prepares arbitrary text (including long unbroken strings) for clean PDF wrapping. */
function prepareWrappableText(doc, text, maxWidth) {
  return String(text)
    .split(" ")
    .map((token) => breakLongToken(doc, token, maxWidth))
    .join(" ");
}

/** True if a line looks like a markdown table row, e.g. "| Col A | Col B |". */
function isTableRow(line) {
  return /\|/.test(line) && line.trim().replace(/\|/g, "").trim().length >= 0 && line.includes("|");
}

/** True if a line is a markdown table separator row, e.g. "|---|:---:|---|". */
function isTableSeparator(line) {
  const cells = line.trim().replace(/^\||\|$/g, "").split("|");
  return (
    cells.length > 0 &&
    cells.every((c) => /^\s*:?-{2,}:?\s*$/.test(c))
  );
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cleanInline(cell.trim()));
}

/* Map a raw heading string to one of the canonical report sections, if it matches. */
const CANONICAL_SECTIONS = [
  { key: "EXECUTIVE SUMMARY", match: /executive\s*summary/i },
  { key: "SEVERITY", match: /^severity/i },
  { key: "MITRE ATT&CK", match: /mitre|att&ck|attack\s*technique/i },
  { key: "TECHNICAL ANALYSIS", match: /technical\s*analysis/i },
  { key: "RECOMMENDATIONS", match: /recommendation/i },
  { key: "CONFIDENCE SCORE", match: /confidence\s*score|confidence\s*level/i },
];

function canonicalHeading(raw) {
  const cleaned = cleanInline(raw).replace(/^#+\s*/, "").trim();
  for (const section of CANONICAL_SECTIONS) {
    if (section.match.test(cleaned)) return section.key;
  }
  return cleaned;
}

/**
 * Parses a loosely-formatted markdown AI report into structured blocks:
 * [{ type: 'heading', text }, { type: 'bullet', text }, { type: 'paragraph', text }]
 */
function parseAIReport(raw) {
  if (!raw || typeof raw !== "string") return [];

  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push({ type: "spacer" });
      i += 1;
      continue;
    }

    // Fenced code block: ```...``` — rendered in Courier, never treated as prose
    if (/^```/.test(trimmed)) {
      const codeLines = [];
      let j = i + 1;
      while (j < lines.length && !/^```/.test(lines[j].trim())) {
        codeLines.push(sanitizeForPDF(lines[j]));
        j += 1;
      }
      blocks.push({ type: "codeblock", lines: codeLines });
      i = j + 1; // skip the closing fence
      continue;
    }

    // Markdown table: a row followed by a separator row (|---|---|)
    if (
      isTableRow(trimmed) &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const headers = splitTableRow(trimmed);
      const rows = [];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j]) && lines[j].trim()) {
        rows.push(splitTableRow(lines[j]));
        j += 1;
      }
      blocks.push({ type: "table", headers, rows });
      i = j;
      continue;
    }

    // Markdown heading: #, ##, ###
    if (/^#{1,6}\s+/.test(trimmed)) {
      blocks.push({ type: "heading", text: canonicalHeading(trimmed) });
      i += 1;
      continue;
    }

    // Bold-only line used as a pseudo heading: **Heading**
    if (/^\*\*(.+)\*\*:?$/.test(trimmed)) {
      blocks.push({ type: "heading", text: canonicalHeading(trimmed) });
      i += 1;
      continue;
    }

    // Line matching a canonical section name directly (e.g. "Severity: High")
    const directMatch = CANONICAL_SECTIONS.find((s) => s.match.test(trimmed));
    if (directMatch && trimmed.length < 60 && /:?\s*$|:/.test(trimmed)) {
      const parts = trimmed.split(":");
      blocks.push({ type: "heading", text: directMatch.key });
      if (parts.length > 1 && parts.slice(1).join(":").trim()) {
        blocks.push({ type: "paragraph", text: cleanInline(parts.slice(1).join(":")) });
      }
      i += 1;
      continue;
    }

    // Bullet points
    if (/^[-*•]\s+/.test(trimmed)) {
      blocks.push({ type: "bullet", text: cleanInline(trimmed.replace(/^[-*•]\s+/, "")) });
      i += 1;
      continue;
    }

    // Numbered list
    if (/^\d+[.)]\s+/.test(trimmed)) {
      blocks.push({ type: "bullet", text: cleanInline(trimmed.replace(/^\d+[.)]\s+/, "")) });
      i += 1;
      continue;
    }

    blocks.push({ type: "paragraph", text: cleanInline(trimmed) });
    i += 1;
  }

  return blocks;
}

/**
 * Resolves the AI report text from the backend payload, tolerating a few
 * common shape/naming variations so a mismatched key doesn't silently
 * produce an empty "No AI analysis" page.
 */
function resolveAIReportText(data) {
  if (!data) return "";

  const candidates = [
    data.ai_report,
    data.aiReport,
    data.report,
    data.analysis,
    data.ai_analysis,
    data.aiAnalysis,
    data.summary,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
    if (candidate && typeof candidate === "object") {
      const nested = candidate.text || candidate.content || candidate.analysis || candidate.summary;
      if (typeof nested === "string" && nested.trim()) {
        return nested;
      }
    }
  }

  if (typeof window !== "undefined" && window.console) {
    // eslint-disable-next-line no-console
    console.warn(
      "[SentinelAI] No AI report text found on the response payload. " +
        "Checked keys: ai_report, aiReport, report, analysis, ai_analysis, aiAnalysis, summary. " +
        "Received payload:",
      data
    );
  }

  return "";
}

/* ============================================================================
   PDF BUILDER
============================================================================ */

function buildIncidentReportPDF(data) {
  const {
    filename = "N/A",
    detections = [],
    total_detections = detections.length || 0,
  } = data || {};
  const ai_report = resolveAIReportText(data);

  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  // Typography baseline: Helvetica everywhere by default, no extra glyph
  // spacing. Courier is opted into explicitly only for command/code text.
  doc.setFont("helvetica", "normal");
  if (typeof doc.setCharSpace === "function") doc.setCharSpace(0);

  const now = new Date();
  const overallSeverity = computeOverallSeverity(detections);
  const reportId = generateReportId(now);

  let cursorY = 0;
  let pageIndex = 1;

  /* ------------------------------ low-level draw utils ------------------------------ */

  const setFill = (rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

  function drawWatermark() {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.07 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(64);
    setText(THEME.ink);
    doc.text("CONFIDENTIAL", PAGE.width / 2, PAGE.height / 2, {
      align: "center",
      angle: 40,
    });
    doc.restoreGraphicsState();
  }

  function drawFooterPlaceholder() {
    // Footer text is finalized in a second pass once total page count is known.
  }

  function newPage() {
    doc.addPage();
    pageIndex += 1;
    drawWatermark();
    cursorY = PAGE.margin;
  }

  function ensureSpace(neededHeight) {
    if (cursorY + neededHeight > PAGE.height - 70) {
      newPage();
      return true;
    }
    return false;
  }

  /**
   * Like ensureSpace, but for headings / section starts: also requires enough
   * room for a minimum amount of following content so a heading is never left
   * alone at the bottom of a page with nothing underneath it.
   */
  function ensureSpaceForSection(ownHeight, minFollowingContent = 44) {
    return ensureSpace(ownHeight + minFollowingContent);
  }

  function drawRoundedRect(x, y, w, h, r, fillRgb, strokeRgb) {
    if (fillRgb) setFill(fillRgb);
    if (strokeRgb) setDraw(strokeRgb);
    const style = fillRgb && strokeRgb ? "FD" : fillRgb ? "F" : "D";
    doc.setLineWidth(0.75);
    doc.roundedRect(x, y, w, h, r, r, style);
  }

  function severityBadge(x, y, severityKey, small = false) {
    const style = SEVERITY_STYLES[severityKey] || SEVERITY_STYLES.INFO;
    const label = style.label;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(small ? 8 : 9.5);
    const paddingX = small ? 7 : 9;
    const textWidth = doc.getTextWidth(label);
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = small ? 14 : 17;
    setFill(style.bg);
    doc.roundedRect(x, y, boxWidth, boxHeight, boxHeight / 2, boxHeight / 2, "F");
    setText(style.text);
    doc.text(label, x + boxWidth / 2, y + boxHeight / 2 + (small ? 2.7 : 3.2), {
      align: "center",
    });
    return boxWidth;
  }

  /* ------------------------------ PAGE 1: COVER ------------------------------ */

  drawWatermark();

  // Header band
  const headerHeight = 132;
  setFill(THEME.purple);
  doc.rect(0, 0, PAGE.width, headerHeight, "F");

  // Accent stripe
  setFill(THEME.purpleAccent);
  doc.rect(0, headerHeight - 5, PAGE.width, 5, "F");

  // Shield-style monogram badge
  const badgeCx = PAGE.margin + 22;
  const badgeCy = 46;
  setFill(THEME.white);
  doc.circle(badgeCx, badgeCy, 20, "F");
  setText(THEME.purple);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("S", badgeCx, badgeCy + 5.5, { align: "center" });

  setText(THEME.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("SentinelAI Incident Report", badgeCx + 34, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.5);
  setText([224, 214, 250]);
  doc.text("AI-Powered Security Log Analyzer", badgeCx + 34, 62);

  doc.setFontSize(9);
  setText([214, 200, 245]);
  doc.text(
    `Report Generated: ${formatDate(now)}  •  ${formatTime(now)}`,
    badgeCx + 34,
    82
  );

  cursorY = headerHeight + 34;

  // Section title: Incident Overview
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setText(THEME.purple);
  doc.text("INCIDENT OVERVIEW", PAGE.margin, cursorY);
  setDraw(THEME.purpleAccent);
  doc.setLineWidth(1.2);
  doc.line(PAGE.margin, cursorY + 6, PAGE.margin + 90, cursorY + 6);

  cursorY += 24;

  // Info grid: rounded info boxes (2 columns)
  const infoItems = [
    { label: "REPORT ID", value: reportId },
    { label: "CLASSIFICATION", value: "CONFIDENTIAL", isClassification: true },
    { label: "GENERATED DATE", value: formatDate(now) },
    { label: "GENERATED TIME", value: formatTime(now) },
    { label: "SOURCE FILENAME", value: sanitizeForPDF(String(filename)) },
    { label: "TOTAL DETECTIONS", value: String(total_detections) },
    { label: "OVERALL SEVERITY", value: overallSeverity, isSeverity: true },
    { label: "ANALYSIS ENGINE", value: "Groq AI / SentinelAI Core" },
  ];

  const gridCols = 2;
  const gridGap = 14;
  const boxWidth = (PAGE.width - PAGE.margin * 2 - gridGap) / gridCols;
  const boxHeight = 52;

  infoItems.forEach((item, idx) => {
    const col = idx % gridCols;
    const row = Math.floor(idx / gridCols);
    const x = PAGE.margin + col * (boxWidth + gridGap);
    const y = cursorY + row * (boxHeight + gridGap);

    drawRoundedRect(x, y, boxWidth, boxHeight, 8, THEME.purpleLight, THEME.purpleBorder);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(THEME.purple);
    doc.text(item.label, x + 14, y + 18);

    if (item.isSeverity) {
      severityBadge(x + 14, y + 26, normalizeSeverity(item.value));
    } else if (item.isClassification) {
      setFill(THEME.purple);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      const label = item.value;
      const padX = 9;
      const bw = doc.getTextWidth(label) + padX * 2;
      doc.roundedRect(x + 14, y + 26, bw, 17, 8.5, 8.5, "F");
      setText(THEME.white);
      doc.text(label, x + 14 + bw / 2, y + 26 + 11.7, { align: "center" });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      setText(THEME.ink);
      const wrapped = doc.splitTextToSize(item.value || "N/A", boxWidth - 28);
      doc.text(wrapped.slice(0, 2), x + 14, y + 36);
    }
  });

  cursorY += Math.ceil(infoItems.length / gridCols) * (boxHeight + gridGap) + 14;

  // Threat summary section heading
  ensureSpaceForSection(20, 90);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setText(THEME.purple);
  doc.text("THREAT SUMMARY", PAGE.margin, cursorY);
  setDraw(THEME.purpleAccent);
  doc.line(PAGE.margin, cursorY + 6, PAGE.margin + 90, cursorY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(THEME.slate);
  doc.text(`${detections.length} detection(s) identified`, PAGE.width - PAGE.margin, cursorY, {
    align: "right",
  });

  cursorY += 20;

  /* ------------------------------ DETECTION CARDS ------------------------------ */

  const fieldMap = [
    { key: "attack_name", label: "ATTACK NAME" },
    { key: "attack", label: "ATTACK NAME" },
    { key: "source_ip", label: "SOURCE IP" },
    { key: "user", label: "USER" },
    { key: "username", label: "USER" },
    { key: "command", label: "COMMAND" },
    { key: "failed_attempts", label: "FAILED ATTEMPTS" },
    { key: "matched_pattern", label: "MATCHED PATTERN" },
    { key: "pattern", label: "MATCHED PATTERN" },
  ];

  if (!detections.length) {
    ensureSpace(50);
    drawRoundedRect(PAGE.margin, cursorY, PAGE.width - PAGE.margin * 2, 44, 8, THEME.cardBg, THEME.cardBorder);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    setText(THEME.slate);
    doc.text("No threat detections were identified in this log analysis.", PAGE.margin + 14, cursorY + 26);
    cursorY += 60;
  }

  detections.forEach((det, i) => {
    const severity = normalizeSeverity(det.severity);
    const attackName = sanitizeForPDF(det.attack_name || det.attack || det.title || "Unclassified Activity");

    // Collect only present fields (skip attack name / severity, already shown)
    const rows = [];
    const seenLabels = new Set(["ATTACK NAME"]);
    fieldMap.forEach(({ key, label }) => {
      if (
        det[key] !== undefined &&
        det[key] !== null &&
        det[key] !== "" &&
        !seenLabels.has(label)
      ) {
        rows.push({ label, value: sanitizeForPDF(String(det[key])) });
        seenLabels.add(label);
      }
    });

    const lineHeight = 13;
    const contentPadding = 16;
    const headerBlockHeight = 30;
    const valueColumnX = 150;
    const valueColumnWidth = PAGE.width - PAGE.margin * 2 - valueColumnX - 18;

    // Pre-measure row heights (values may wrap; long unbroken tokens such as
    // Base64-encoded PowerShell commands are force-broken so they never overflow)
    let measuredHeight = headerBlockHeight + contentPadding;
    const measuredRows = rows.map((row) => {
      doc.setFont(row.label === "COMMAND" ? "courier" : "helvetica", "normal");
      doc.setFontSize(9.5);
      const safeValue = prepareWrappableText(doc, row.value, valueColumnWidth);
      const wrapped = doc.splitTextToSize(safeValue, valueColumnWidth);
      const h = Math.max(lineHeight, wrapped.length * lineHeight);
      measuredHeight += h + 4;
      return { ...row, wrapped, h };
    });
    measuredHeight += 10;

    ensureSpace(measuredHeight + 12);

    const cardX = PAGE.margin;
    const cardWidth = PAGE.width - PAGE.margin * 2;
    const cardTop = cursorY;

    drawRoundedRect(cardX, cardTop, cardWidth, measuredHeight, 9, THEME.cardBg, THEME.cardBorder);

    // Left severity accent bar
    setFill(SEVERITY_STYLES[severity].bg);
    doc.roundedRect(cardX, cardTop, 5, measuredHeight, 2.5, 2.5, "F");

    // Header row: index + attack name + severity badge
    let rowY = cardTop + 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    setText(THEME.ink);
    doc.text(`${String(i + 1).padStart(2, "0")}.  ${attackName}`, cardX + 18, rowY);

    const badgeWidth = doc.getTextWidth(SEVERITY_STYLES[severity].label) + 18;
    severityBadge(cardX + cardWidth - badgeWidth - 14, cardTop + 11, severity, true);

    rowY += 14;
    setDraw(THEME.divider);
    doc.setLineWidth(0.6);
    doc.line(cardX + 18, rowY, cardX + cardWidth - 18, rowY);
    rowY += 14;

    // Field rows (label / value)
    measuredRows.forEach((row) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.3);
      setText(THEME.purple);
      doc.text(row.label, cardX + 18, rowY);

      doc.setFont(row.label === "COMMAND" ? "courier" : "helvetica", "normal");
      doc.setFontSize(9.5);
      setText(THEME.slate);
      doc.text(row.wrapped, cardX + valueColumnX, rowY);

      rowY += row.h + 4;
    });

    cursorY = cardTop + measuredHeight + 12;
  });

  /* ------------------------------ AI ANALYSIS SECTION ------------------------------ */

  // Only force a fresh page if the current page doesn't have reasonable room
  // for the section header plus the start of its content — this is what
  // avoids leaving a mostly-empty page behind after the last detection card.
  const AI_SECTION_MIN_SPACE = 170;
  if (cursorY + AI_SECTION_MIN_SPACE > PAGE.height - 70) {
    newPage();
  } else {
    cursorY += 28;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  setText(THEME.purple);
  doc.text("AI INCIDENT ANALYSIS", PAGE.margin, cursorY + 6);
  setDraw(THEME.purpleAccent);
  doc.setLineWidth(1.2);
  doc.line(PAGE.margin, cursorY + 14, PAGE.margin + 140, cursorY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setText(THEME.slate);
  doc.text(
    "Automated analysis generated by Groq AI based on detected log activity.",
    PAGE.margin,
    cursorY + 30
  );

  cursorY += 52;

  const blocks = parseAIReport(ai_report);
  const contentWidth = PAGE.width - PAGE.margin * 2;

  if (!blocks.length) {
    drawRoundedRect(PAGE.margin, cursorY, contentWidth, 46, 8, THEME.cardBg, THEME.cardBorder);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    setText(THEME.slate);
    doc.text("No AI analysis was returned for this report.", PAGE.margin + 14, cursorY + 27);
    cursorY += 60;
  }

  blocks.forEach((block) => {
    if (block.type === "spacer") {
      cursorY += 6;
      return;
    }

    if (block.type === "codeblock") {
      const codeFontSize = 8.6;
      const codeLineHeight = 11.5;
      const codePaddingX = 12;
      const codePaddingY = 10;

      doc.setFont("courier", "normal");
      doc.setFontSize(codeFontSize);
      const codeMaxWidth = contentWidth - codePaddingX * 2;

      const wrappedLines = [];
      (block.lines.length ? block.lines : [""]).forEach((rawLine) => {
        const safe = prepareWrappableText(doc, rawLine, codeMaxWidth);
        const wrapped = doc.splitTextToSize(safe || " ", codeMaxWidth);
        wrappedLines.push(...wrapped);
      });

      const blockHeight = wrappedLines.length * codeLineHeight + codePaddingY * 2;
      ensureSpace(blockHeight + 10);

      setFill([245, 244, 250]);
      setDraw(THEME.cardBorder);
      doc.setLineWidth(0.6);
      doc.roundedRect(PAGE.margin, cursorY - 4, contentWidth, blockHeight, 6, 6, "FD");

      doc.setFont("courier", "normal");
      doc.setFontSize(codeFontSize);
      setText(THEME.ink);
      doc.text(wrappedLines, PAGE.margin + codePaddingX, cursorY - 4 + codePaddingY + 8);

      cursorY += blockHeight + 12;
      return;
    }

    if (block.type === "heading") {
      // Keep heading with at least the start of its following content —
      // never leave a heading orphaned alone at the bottom of a page.
      ensureSpaceForSection(26, 46);
      cursorY += 18;
      setFill(THEME.purpleLight);
      doc.roundedRect(PAGE.margin, cursorY - 15, contentWidth, 27, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      setText(THEME.purple);
      doc.text(block.text.toUpperCase(), PAGE.margin + 12, cursorY + 3);
      cursorY += 28;
      return;
    }

    if (block.type === "table") {
      const colCount = block.headers.length || 1;
      const colWidth = contentWidth / colCount;
      const cellPaddingX = 8;
      const cellLineHeight = 12;

      doc.setFontSize(8.6);

      function measureRow(cells, bold) {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        let maxLines = 1;
        const wrappedCells = cells.map((cell) => {
          const safe = prepareWrappableText(doc, cell, colWidth - cellPaddingX * 2);
          const wrapped = doc.splitTextToSize(safe, colWidth - cellPaddingX * 2);
          maxLines = Math.max(maxLines, wrapped.length);
          return wrapped;
        });
        return { wrappedCells, rowHeight: maxLines * cellLineHeight + 10 };
      }

      function drawRow(cells, y, rowHeight, opts) {
        const { bold = false, fillRgb = null, textRgb = THEME.ink } = opts || {};
        if (fillRgb) {
          setFill(fillRgb);
          doc.rect(PAGE.margin, y, contentWidth, rowHeight, "F");
        }
        setDraw(THEME.cardBorder);
        doc.setLineWidth(0.5);
        doc.rect(PAGE.margin, y, contentWidth, rowHeight, "S");

        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(8.6);
        setText(textRgb);
        cells.forEach((wrappedCell, colIdx) => {
          const cellX = PAGE.margin + colIdx * colWidth;
          if (colIdx > 0) {
            doc.setDrawColor(THEME.cardBorder[0], THEME.cardBorder[1], THEME.cardBorder[2]);
            doc.line(cellX, y, cellX, y + rowHeight);
          }
          doc.text(wrappedCell, cellX + cellPaddingX, y + 14);
        });
      }

      // Header row (kept together with at least its first data row)
      const headerMeasured = measureRow(block.headers, true);
      const firstDataMeasured = block.rows[0]
        ? measureRow(block.rows[0], false)
        : { rowHeight: 0 };
      ensureSpace(headerMeasured.rowHeight + firstDataMeasured.rowHeight + 4);
      cursorY += 4;

      drawRow(headerMeasured.wrappedCells, cursorY, headerMeasured.rowHeight, {
        bold: true,
        fillRgb: THEME.purple,
        textRgb: THEME.white,
      });
      cursorY += headerMeasured.rowHeight;

      block.rows.forEach((rowCells, rIdx) => {
        const { wrappedCells, rowHeight } = measureRow(rowCells, false);
        ensureSpace(rowHeight);
        drawRow(wrappedCells, cursorY, rowHeight, {
          fillRgb: rIdx % 2 === 0 ? THEME.white : THEME.cardBg,
        });
        cursorY += rowHeight;
      });

      cursorY += 12;
      return;
    }

    if (block.type === "bullet") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.8);
      const safeText = prepareWrappableText(doc, block.text, contentWidth - 26);
      const wrapped = doc.splitTextToSize(safeText, contentWidth - 26);
      const h = wrapped.length * 13;
      ensureSpace(h + 6);

      setFill(THEME.purpleAccent);
      doc.circle(PAGE.margin + 8, cursorY - 3.5, 1.7, "F");
      setText(THEME.ink);
      doc.text(wrapped, PAGE.margin + 18, cursorY);
      cursorY += h + 5;
      return;
    }

    // paragraph
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.8);
    const safeParagraph = prepareWrappableText(doc, block.text, contentWidth);
    const wrapped = doc.splitTextToSize(safeParagraph, contentWidth);
    const h = wrapped.length * 13;
    ensureSpace(h + 8);
    setText(THEME.ink);
    doc.text(wrapped, PAGE.margin, cursorY);
    cursorY += h + 8;
  });

  /* ------------------------------ FINAL PAGE: END OF REPORT ------------------------------ */

  newPage();

  const centerX = PAGE.width / 2;
  const centerY = PAGE.height / 2 - 40;

  setDraw(THEME.purpleAccent);
  doc.setLineWidth(1.4);
  doc.line(centerX - 60, centerY - 26, centerX + 60, centerY - 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setText(THEME.purple);
  doc.text("END OF REPORT", centerX, centerY, { align: "center" });

  doc.setDrawColor(THEME.purpleAccent[0], THEME.purpleAccent[1], THEME.purpleAccent[2]);
  doc.line(centerX - 60, centerY + 14, centerX + 60, centerY + 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setText(THEME.purple);
  doc.text(`Report ${reportId}  •  CONFIDENTIAL`, centerX, centerY + 40, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setText(THEME.slate);
  doc.text(
    "This document contains confidential security information intended solely for authorized personnel.",
    centerX,
    centerY + 58,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(THEME.ink);
  doc.text("Generated by SentinelAI", centerX, centerY + 90, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setText(THEME.muted);
  doc.text("AI-Powered Security Log Analyzer", centerX, centerY + 106, { align: "center" });

  /* ------------------------------ FINAL PASS: FOOTERS ------------------------------ */

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);

    setDraw(THEME.divider);
    doc.setLineWidth(0.6);
    doc.line(PAGE.margin, PAGE.height - 46, PAGE.width - PAGE.margin, PAGE.height - 46);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setText(THEME.purple);
    doc.text("Generated by SentinelAI", PAGE.margin, PAGE.height - 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    setText(THEME.muted);
    doc.text("AI-Powered Security Log Analyzer", PAGE.margin, PAGE.height - 19);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setText(THEME.slate);
    doc.text(`Page ${p} of ${totalPages}`, PAGE.width - PAGE.margin, PAGE.height - 24, {
      align: "right",
    });
  }

  return doc;
}

/* ============================================================================
   REACT COMPONENT
============================================================================ */

export default function DownloadReport({ data, disabled = false, className = "" }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const hasData = Boolean(
    data && (data.detections?.length || resolveAIReportText(data))
  );

  async function handleDownload() {
    if (!data) {
      setError("No report data available to generate a PDF.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 30)); // allow UI to paint
      const doc = buildIncidentReportPDF(data);
      const today = fileNameSafeDate(new Date());
      doc.save(`SentinelAI_Incident_Report_${today}.pdf`);
    } catch (err) {
      console.error("Failed to generate incident report PDF:", err);
      setError("Something went wrong while generating the report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled || isGenerating || !hasData}
        className="group relative inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-violet-600
                   px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-900/20
                   transition-all duration-200 hover:from-purple-600 hover:to-violet-500
                   hover:shadow-lg hover:shadow-purple-900/30 active:scale-[0.98]
                   disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-purple-700 disabled:hover:to-violet-600"
      >
        {isGenerating ? (
          <>
            <svg
              className="h-4 w-4 animate-spin text-white"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>Generating Report…</span>
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v12" />
              <path d="M7 10l5 5 5-5" />
              <path d="M4 19h16" />
            </svg>
            <span>Download Incident Report</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {!hasData && !error && (
        <p className="text-xs text-slate-400">
          Run an analysis to enable the incident report download.
        </p>
      )}
    </div>
  );
}