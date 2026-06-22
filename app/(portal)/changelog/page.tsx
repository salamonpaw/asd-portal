import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { readFileSync } from "fs";
import { join } from "path";

export default async function ChangelogPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  let changelog = "";
  let version = "0.2.0";

  try {
    const projectRoot = process.cwd();
    changelog = readFileSync(join(projectRoot, "CHANGELOG.md"), "utf-8");
    version = readFileSync(join(projectRoot, "VERSION"), "utf-8").trim();
  } catch (error) {
    console.error("Error reading changelog:", error);
    changelog = `# Changelog

## [0.2.0] - 2026-06-22

### Added
- Product pricing display
- Service technician order summary
- Discount management
- Product catalog with images
- Versioning & Changelog system

### Changed
- Enhanced UI/UX for orders and pricing
- Warehouse order management improvements
- Product details editing interface

### Fixed
- Permission and authorization checks
- Price display for different roles`;
  }

  if (!changelog.trim()) {
    changelog = "Changelog not available";
  }

  const changelogLines = changelog.split("\n");

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 8 }}>ASD Partner Portal</h1>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "var(--ink-3)" }}>
            Current version: <strong>{version}</strong>
          </span>
          <span
            style={{
              fontSize: 11,
              padding: "4px 8px",
              background: "var(--brand-soft)",
              color: "var(--brand)",
              borderRadius: "var(--r-sm)",
            }}
          >
            {new Date().toLocaleDateString("pl")}
          </span>
        </div>
      </div>

      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--ink-2)",
          borderRadius: "var(--r)",
          padding: 24,
          lineHeight: "1.6",
          fontSize: 14,
        }}
      >
        {changelogLines.map((line, idx) => {
          // Headings
          if (line.startsWith("# ")) {
            return (
              <h2 key={idx} style={{ fontSize: 18, fontWeight: 600, marginTop: 0, marginBottom: 12 }}>
                {line.replace(/^#+\s/, "")}
              </h2>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h3 key={idx} style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 12, color: "var(--brand)" }}>
                {line.replace(/^#+\s/, "")}
              </h3>
            );
          }
          if (line.startsWith("### ")) {
            return (
              <h4 key={idx} style={{ fontSize: 13, fontWeight: 600, marginTop: 16, marginBottom: 8, color: "var(--ink)" }}>
                {line.replace(/^#+\s/, "")}
              </h4>
            );
          }

          // Lists
          if (line.startsWith("- ")) {
            return (
              <li key={idx} style={{ marginLeft: 20, marginBottom: 4, color: "var(--ink-2)" }}>
                {line.replace(/^-\s/, "")}
              </li>
            );
          }

          // Horizontal rule
          if (line.match(/^-{3,}$|^\*{3,}$/)) {
            return <hr key={idx} style={{ margin: "24px 0", border: "none", borderTop: "1px solid var(--ink-2)" }} />;
          }

          // Paragraphs
          if (line.trim()) {
            return (
              <p key={idx} style={{ margin: "8px 0", color: "var(--ink-2)" }}>
                {line}
              </p>
            );
          }

          return <div key={idx} style={{ height: 8 }} />;
        })}
      </div>

      <div style={{ marginTop: 32, padding: 16, background: "var(--surface-2)", borderRadius: "var(--r)", fontSize: 12, color: "var(--ink-3)" }}>
        <p style={{ margin: 0 }}>
          📝 For detailed information about each release, see the full CHANGELOG.md file in the repository.
        </p>
      </div>
    </div>
  );
}
