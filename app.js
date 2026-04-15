import { marked } from "https://esm.sh/marked@15.0.12";
import DOMPurify from "https://esm.sh/dompurify@3.2.6";
import hljs from "https://esm.sh/highlight.js@11.11.1";
import html2canvas from "https://esm.sh/html2canvas@1.4.1";

const STORAGE_KEY = "wenyan-web-draft-v1";
const SETTINGS_KEY = "wenyan-web-settings-v1";
const META_KEY = "wenyan-web-meta-v1";

const defaultMarkdown = `---
title: 用博客思维设计一篇可读的文章
author: 你自己
tags:
  - 排版
  - Markdown
  - 博客
---

# 一篇适合博客和公众号的 Markdown 草稿

排版工具的核心不是“功能越多越好”，而是**让写作和发布之间的损耗更少**。

> 这是一段引用。你可以把观点、摘录或强调内容放在这里。

## 为什么要做自己的网页版排版工具

1. 可以直接嵌入你的博客站
2. 草稿保存在浏览器里，打开就能继续写
3. 输出 HTML 后，可以粘贴到其他 CMS 或编辑器

## 常见内容块

### 普通段落

支持 **粗体**、*斜体*、\`行内代码\` 和 [超链接](https://example.com)。

### 列表

- 支持无序列表
- 支持任务拆分
- 支持长段落写作

### 代码

\`\`\`js
function publishDraft(title) {
  return {
    title,
    status: "draft",
    updatedAt: new Date().toISOString()
  };
}
\`\`\`

### 表格

| 功能 | 当前版本 | 适合博客嵌入 |
| --- | --- | --- |
| Markdown 编辑 | 支持 | 是 |
| 主题切换 | 支持 | 是 |
| HTML 复制 | 支持 | 是 |
| 导出长图 | 支持 | 是 |

## 图片建议

![示例封面](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80)

## 结尾

把它先当成一块稳定的内容工作台，再逐步接入你自己的博客发布流程。`;

const elements = {
  editor: document.querySelector("#editor"),
  previewCard: document.querySelector("#previewCard"),
  previewContent: document.querySelector("#previewContent"),
  statusText: document.querySelector("#statusText"),
  fileInput: document.querySelector("#fileInput"),
  importBtn: document.querySelector("#importBtn"),
  copyHtmlBtn: document.querySelector("#copyHtmlBtn"),
  exportPngBtn: document.querySelector("#exportPngBtn"),
  publishBtn: document.querySelector("#publishBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  insertTemplateBtn: document.querySelector("#insertTemplateBtn"),
  publishEndpoint: document.querySelector("#publishEndpoint"),
  publishToken: document.querySelector("#publishToken"),
  themeSelect: document.querySelector("#themeSelect"),
  contentWidth: document.querySelector("#contentWidth"),
  contentWidthValue: document.querySelector("#contentWidthValue"),
  fontSize: document.querySelector("#fontSize"),
  fontSizeValue: document.querySelector("#fontSizeValue"),
  lineHeight: document.querySelector("#lineHeight"),
  lineHeightValue: document.querySelector("#lineHeightValue"),
  charCount: document.querySelector("#charCount"),
  wordCount: document.querySelector("#wordCount"),
  readTime: document.querySelector("#readTime"),
  metaTitle: document.querySelector("#metaTitle"),
  metaSlug: document.querySelector("#metaSlug"),
  metaAuthor: document.querySelector("#metaAuthor"),
  metaExcerpt: document.querySelector("#metaExcerpt"),
  metaTags: document.querySelector("#metaTags"),
  metaCover: document.querySelector("#metaCover"),
  platformButtons: Array.from(document.querySelectorAll("[data-platform]")),
};

marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

const state = {
  markdown: "",
  platform: "wechat",
  theme: "paper",
  contentWidth: 720,
  fontSize: 16,
  lineHeight: 1.8,
  publishEndpoint: "",
  publishToken: "",
  meta: {
    title: "",
    slug: "",
    author: "",
    excerpt: "",
    tags: "",
    cover: "",
  },
};

function loadState() {
  const markdown = localStorage.getItem(STORAGE_KEY);
  const settings = localStorage.getItem(SETTINGS_KEY);
  const meta = localStorage.getItem(META_KEY);
  state.markdown = markdown || defaultMarkdown;

  if (settings) {
    try {
      const parsed = JSON.parse(settings);
      Object.assign(state, parsed);
    } catch {
      localStorage.removeItem(SETTINGS_KEY);
    }
  }

  if (meta) {
    try {
      state.meta = { ...state.meta, ...JSON.parse(meta) };
    } catch {
      localStorage.removeItem(META_KEY);
    }
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, state.markdown);
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      platform: state.platform,
      theme: state.theme,
      contentWidth: state.contentWidth,
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      publishEndpoint: state.publishEndpoint,
      publishToken: state.publishToken,
    }),
  );
  localStorage.setItem(META_KEY, JSON.stringify(state.meta));
}

function setStatus(text) {
  elements.statusText.textContent = text;
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => {
    elements.statusText.textContent = "本地自动保存已开启";
  }, 1800);
}

function updateStats(markdown) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/[#>*_\-\n]/g, " ")
    .trim();

  const chars = plain.replace(/\s+/g, "").length;
  const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  const readingMinutes = Math.max(1, Math.ceil(chars / 450));

  elements.charCount.textContent = String(chars);
  elements.wordCount.textContent = String(words);
  elements.readTime.textContent = `${readingMinutes} 分钟`;
}

function renderMarkdown() {
  const rawHtml = marked.parse(state.markdown);
  const html = DOMPurify.sanitize(rawHtml);
  elements.previewContent.innerHTML = html;
  elements.previewContent.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });
  updateStats(state.markdown);
}

function applyPreviewStyles() {
  document.documentElement.style.setProperty("--preview-width", `${state.contentWidth}px`);
  document.documentElement.style.setProperty("--preview-font-size", `${state.fontSize}px`);
  document.documentElement.style.setProperty("--preview-line-height", String(state.lineHeight));

  elements.contentWidth.value = String(state.contentWidth);
  elements.contentWidthValue.textContent = `${state.contentWidth}px`;
  elements.fontSize.value = String(state.fontSize);
  elements.fontSizeValue.textContent = `${state.fontSize}px`;
  elements.lineHeight.value = String(state.lineHeight);
  elements.lineHeightValue.textContent = String(state.lineHeight);

  elements.themeSelect.value = state.theme;
  elements.publishEndpoint.value = state.publishEndpoint;
  elements.publishToken.value = state.publishToken;
  elements.metaTitle.value = state.meta.title;
  elements.metaSlug.value = state.meta.slug;
  elements.metaAuthor.value = state.meta.author;
  elements.metaExcerpt.value = state.meta.excerpt;
  elements.metaTags.value = state.meta.tags;
  elements.metaCover.value = state.meta.cover;
  elements.previewCard.className = `preview-card theme-${state.theme} platform-${state.platform}`;

  elements.platformButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.platform === state.platform);
  });
}

function syncEditor() {
  elements.editor.value = state.markdown;
}

function updateAll() {
  syncEditor();
  applyPreviewStyles();
  renderMarkdown();
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w-\u4e00-\u9fa5]+/g, "")
    .replace(/--+/g, "-");
}

function getPayload() {
  const tags = state.meta.tags
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    title: state.meta.title || "未命名文章",
    slug: state.meta.slug || slugify(state.meta.title || "untitled-post"),
    author: state.meta.author || "",
    excerpt: state.meta.excerpt || "",
    tags,
    cover: state.meta.cover || "",
    markdown: state.markdown,
    html: elements.previewContent.innerHTML,
    platform: state.platform,
    theme: state.theme,
    createdAt: new Date().toISOString(),
  };
}

async function copyHtml() {
  const html = elements.previewContent.innerHTML;
  await navigator.clipboard.writeText(html);
  setStatus("HTML 已复制到剪贴板");
}

async function exportPng() {
  setStatus("正在生成长图");
  const canvas = await html2canvas(elements.previewCard, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const link = document.createElement("a");
  link.download = "typeset-export.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  setStatus("长图已导出");
}

async function publishToBlog() {
  if (!state.publishEndpoint) {
    throw new Error("请先填写博客发布接口");
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (state.publishToken) {
    headers.Authorization = `Bearer ${state.publishToken}`;
  }

  const response = await fetch(state.publishEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(getPayload()),
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === "string" ? body : body.message || response.statusText;
    throw new Error(message);
  }

  return body;
}

function importMarkdownFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    state.markdown = typeof reader.result === "string" ? reader.result : defaultMarkdown;
    saveState();
    updateAll();
    setStatus(`已导入 ${file.name}`);
  };
  reader.readAsText(file, "utf-8");
}

function insertBlogTemplate() {
  const template = `# 标题\n\n> 写一句文章摘要。\n\n## 背景\n\n说明你为什么写这篇文章。\n\n## 核心观点\n\n- 观点一\n- 观点二\n- 观点三\n\n## 实操步骤\n\n1. 第一步\n2. 第二步\n3. 第三步\n\n## 总结\n\n给读者一个明确收尾。\n`;
  state.markdown = `${state.markdown.trim()}\n\n---\n\n${template}`;
  saveState();
  updateAll();
  setStatus("已插入博客模板");
}

function bindMetaInput(element, key, transform = (value) => value) {
  element.addEventListener("input", (event) => {
    state.meta[key] = transform(event.target.value);
    saveState();
  });
}

function bindEvents() {
  elements.editor.addEventListener("input", (event) => {
    state.markdown = event.target.value;
    saveState();
    renderMarkdown();
  });

  elements.contentWidth.addEventListener("input", (event) => {
    state.contentWidth = Number(event.target.value);
    saveState();
    applyPreviewStyles();
  });

  elements.fontSize.addEventListener("input", (event) => {
    state.fontSize = Number(event.target.value);
    saveState();
    applyPreviewStyles();
  });

  elements.lineHeight.addEventListener("input", (event) => {
    state.lineHeight = Number(event.target.value);
    saveState();
    applyPreviewStyles();
  });

  elements.themeSelect.addEventListener("change", (event) => {
    state.theme = event.target.value;
    saveState();
    applyPreviewStyles();
    setStatus("主题已切换");
  });

  elements.platformButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.platform = button.dataset.platform;
      saveState();
      applyPreviewStyles();
      setStatus(`已切换到 ${button.textContent}`);
    });
  });

  elements.importBtn.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    if (file) importMarkdownFile(file);
    event.target.value = "";
  });

  elements.copyHtmlBtn.addEventListener("click", async () => {
    try {
      await copyHtml();
    } catch {
      setStatus("复制失败，请检查浏览器权限");
    }
  });

  elements.exportPngBtn.addEventListener("click", async () => {
    try {
      await exportPng();
    } catch {
      setStatus("导出失败，请稍后重试");
    }
  });

  elements.publishBtn.addEventListener("click", async () => {
    try {
      setStatus("正在发布到博客");
      const result = await publishToBlog();
      if (typeof result === "object" && result?.url) {
        setStatus(`发布成功：${result.url}`);
      } else {
        setStatus("发布成功");
      }
    } catch (error) {
      setStatus(`发布失败：${error instanceof Error ? error.message : String(error)}`);
    }
  });

  elements.resetBtn.addEventListener("click", () => {
    state.markdown = defaultMarkdown;
    state.meta = {
      title: "用博客思维设计一篇可读的文章",
      slug: "blog-typesetting-workflow",
      author: "你自己",
      excerpt: "把内容工作台嵌入博客站，先解决写作和排版效率。",
      tags: "排版, Markdown, 博客",
      cover: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    };
    saveState();
    updateAll();
    setStatus("已恢复示例内容");
  });

  elements.clearBtn.addEventListener("click", () => {
    state.markdown = "";
    saveState();
    updateAll();
    setStatus("内容已清空");
  });

  elements.insertTemplateBtn.addEventListener("click", insertBlogTemplate);
  elements.publishEndpoint.addEventListener("input", (event) => {
    state.publishEndpoint = event.target.value.trim();
    saveState();
  });
  elements.publishToken.addEventListener("input", (event) => {
    state.publishToken = event.target.value.trim();
    saveState();
  });
  bindMetaInput(elements.metaTitle, "title");
  bindMetaInput(elements.metaSlug, "slug", slugify);
  bindMetaInput(elements.metaAuthor, "author");
  bindMetaInput(elements.metaExcerpt, "excerpt");
  bindMetaInput(elements.metaTags, "tags");
  bindMetaInput(elements.metaCover, "cover");
}

loadState();
if (!state.meta.title) {
  state.meta = {
    title: "用博客思维设计一篇可读的文章",
    slug: "blog-typesetting-workflow",
    author: "你自己",
    excerpt: "把内容工作台嵌入博客站，先解决写作和排版效率。",
    tags: "排版, Markdown, 博客",
    cover: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  };
}
bindEvents();
updateAll();
