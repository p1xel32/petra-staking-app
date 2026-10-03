import fs from "node:fs";
import { mkdir, access, writeFile } from "node:fs/promises";
import path from "node:path";

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) throw new Error("GITHUB_EVENT_PATH is required");

const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
const association = String(event.issue?.author_association || "");
if (!["OWNER", "MEMBER", "COLLABORATOR"].includes(association)) {
  throw new Error("Issue author association is not allowed: " + (association || "UNKNOWN"));
}

const issueBody = String(event.issue?.body || "");
const match = issueBody.match(/<chatgpt-article-json>\s*([\s\S]*?)\s*<\/chatgpt-article-json>/i);
if (!match) throw new Error("Issue body does not contain <chatgpt-article-json> payload");

let manifest;
try {
  manifest = JSON.parse(match[1]);
} catch (error) {
  throw new Error("Invalid article JSON: " + error.message);
}

if (manifest.version !== 1 || !manifest.article || typeof manifest.article !== "object") {
  throw new Error("Unsupported article payload version");
}

const article = manifest.article;
const sources = Array.isArray(manifest.sources) ? manifest.sources : [];

for (const key of ["title", "slug", "description", "content"]) {
  if (!String(article[key] || "").trim()) {
    throw new Error("Missing required article field: " + key);
  }
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) {
  throw new Error("slug must contain lowercase ASCII letters, digits and hyphens only");
}

const descriptionLength = String(article.description).trim().length;
if (descriptionLength < 100 || descriptionLength > 170) {
  throw new Error("description must be 100-170 characters; got " + descriptionLength);
}

const keywords = Array.isArray(article.keywords) ? article.keywords.map(String).filter(Boolean) : [];
const tags = Array.isArray(article.tags) ? article.tags.map(String).filter(Boolean) : keywords;
if (keywords.length < 2) throw new Error("At least two keywords are required");
if (tags.length < 1) throw new Error("At least one tag is required");

if (sources.length < 2) throw new Error("At least two source references are required");
for (const source of sources) {
  if (!source?.title || !/^https?:\/\//i.test(String(source?.url || ""))) {
    throw new Error("Every source requires title and http(s) URL");
  }
}

const stripped = String(article.content)
  .replace(/\[[^\]]+\]\([^\)]+\)/g, " ")
  .replace(/[\x60*_>#-]/g, " ")
  .replace(/<[^>]+>/g, " ");
const wordCount = stripped.trim().split(/\s+/).filter(Boolean).length;
if (wordCount < 700) {
  throw new Error("Article is too short: " + wordCount + " words; minimum is 700");
}

const target = path.join(
  process.cwd(),
  "blog",
  "src",
  "content",
  "blog",
  article.slug + ".mdx"
);

try {
  await access(target);
  throw new Error("Article file already exists: " + target);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const quote = (value) => JSON.stringify(String(value));
const list = (values) => JSON.stringify(values.map(String));
const today = String(article.pubDate || new Date().toISOString().slice(0, 10));
const author = String(article.author || "The aptcore.one Team");
const heroImage = String(article.heroImage || "/blog-assets/placeholder.png");
const heroImageAlt = String(article.heroImageAlt || ("Editorial illustration for " + article.title));
const translationKey = String(article.translationKey || article.slug);

const sourceLines = ["", "", "## Sources", ""];
for (const source of sources) {
  sourceLines.push("- [" + String(source.title).replace(/\]/g, "\\]") + "](" + source.url + ")");
}
const sourceSection = sourceLines.join("\n");

const originalContent = String(article.content).trimEnd();
const body = /(^|\n)##\s+Sources\b/i.test(originalContent)
  ? originalContent
  : originalContent + sourceSection;

const frontmatter = [
  "---",
  "title: " + quote(article.title),
  "slug: " + quote(article.slug),
  "pubDate: " + quote(today),
  "description: " + quote(article.description),
  "author: " + quote(author),
  "keywords: " + list(keywords),
  "heroImage: " + quote(heroImage),
  "heroImageAlt: " + quote(heroImageAlt),
  "tags: " + list(tags),
  "translationKey: " + quote(translationKey),
  "---",
  "",
].join("\n");

await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, frontmatter + body + "\n", "utf8");

const publicUrl = "https://aptcore.one/blog/" + article.slug;
console.log("Prepared " + target);
console.log("Public URL: " + publicUrl);
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    "public_url=" + publicUrl + "\n" +
      "slug=" + article.slug + "\n" +
      "file_path=blog/src/content/blog/" + article.slug + ".mdx\n"
  );
}
