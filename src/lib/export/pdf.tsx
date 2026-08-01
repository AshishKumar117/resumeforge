import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ResumeData } from "@/lib/types/resume";
import { pdfFont } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Template layout engine for @react-pdf/renderer
// ---------------------------------------------------------------------------

interface PdfTemplateProps {
  data: ResumeData & { template?: string };
  accentColor: string;
  font: string;
}

function stripHtml(s?: string): string {
  return (s ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}

function SectionTitle({ title, accent, style }: { title: string; accent: string; style?: "bar" | "rule" | "plain" }) {
  if (style === "plain") {
    return (
      <View style={tw.plainTitle}>
        <Text style={{ color: accent, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", fontFamily: "Helvetica-Bold" }}>{title}</Text>
      </View>
    );
  }
  if (style === "rule") {
    return (
      <View style={tw.ruleTitleRow}>
        <Text style={{ color: accent, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", fontFamily: "Helvetica-Bold" }}>{title}</Text>
        <View style={[tw.rule, { backgroundColor: accent }]} />
      </View>
    );
  }
  return (
    <View style={[tw.barTitle, { borderLeftColor: accent }]}>
      <Text style={{ color: accent, fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", fontFamily: "Helvetica-Bold" }}>{title}</Text>
    </View>
  );
}

function Bullets({ bullets }: { bullets?: string[] }) {
  const items = (bullets ?? []).filter((b) => b.trim());
  if (!items.length) return null;
  return (
    <View>
      {items.map((b, i) => (
        <View key={i} style={tw.bulletRow}>
          <Text style={tw.bulletDot}>•</Text>
          <Text style={tw.bulletText}>{stripHtml(b)}</Text>
        </View>
      ))}
    </View>
  );
}

function ModernTemplate({ data, accentColor }: PdfTemplateProps) {
  const p = data.personal ?? {};
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin].filter(Boolean).join("   ·   ");
  return (
    <View>
      <View style={[tw.modernHeader, { borderBottomColor: accentColor }]}>
        <Text style={[tw.name, { fontFamily: "Helvetica-Bold" }]}>{p.fullName || "Your Name"}</Text>
        {p.jobTitle ? <Text style={tw.titleLine}>{p.jobTitle}</Text> : null}
        {contact ? <Text style={tw.contactLine}>{contact}</Text> : null}
      </View>
      {data.sections?.filter((s) => s.visible).map((section) => (
        <View key={section.id} style={tw.section}>
          <SectionTitle title={section.title} accent={accentColor} style="bar" />
          {section.items.map((item) => (
            <View key={item.id} style={tw.item}>
              {(item.heading || item.subheading) && (
                <View style={tw.itemHeaderRow}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {item.heading ? <Text style={[tw.itemHeading, { color: "#111827" }]}>{item.heading}</Text> : null}
                    {item.subheading ? <Text style={tw.itemSubheading}>{item.subheading}</Text> : null}
                  </View>
                  {(item.date || item.location) && (
                    <Text style={tw.itemDate}>{[item.date, item.location].filter(Boolean).join(" · ")}</Text>
                  )}
                </View>
              )}
              {item.description ? <Text style={tw.description}>{stripHtml(item.description)}</Text> : null}
              <Bullets bullets={item.bullets} />
              {item.skills?.length ? <Text style={tw.description}>{item.skills.join(", ")}</Text> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function ClassicTemplate({ data, accentColor }: PdfTemplateProps) {
  const p = data.personal ?? {};
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin].filter(Boolean).join("   |   ");
  return (
    <View>
      <View style={{ alignItems: "center", paddingBottom: 10 }}>
        <Text style={[tw.classicName, { color: "#1f2937" }]}>{p.fullName || "Your Name"}</Text>
        {p.jobTitle ? <Text style={tw.classicTitle}>{p.jobTitle}</Text> : null}
        <View style={[tw.classicRule, { backgroundColor: accentColor }]} />
        {contact ? <Text style={tw.classicContact}>{contact}</Text> : null}
      </View>
      {data.sections?.filter((s) => s.visible).map((section) => (
        <View key={section.id} style={tw.classicSection}>
          <View style={[tw.classicSectionTitleRow, { borderBottomColor: accentColor }]}>
            <Text style={[tw.classicSectionTitle, { color: accentColor }]}>{section.title.toUpperCase()}</Text>
          </View>
          {section.items.map((item) => (
            <View key={item.id} style={tw.item}>
              {(item.heading || item.subheading) && (
                <View style={tw.itemHeaderRow}>
                  <Text style={[tw.classicItemHeading, { color: "#1f2937" }]}>
                    {item.heading}{item.subheading ? `, ${item.subheading}` : ""}
                  </Text>
                  {(item.date || item.location) && (
                    <Text style={tw.classicItemDate}>{[item.date, item.location].filter(Boolean).join(" · ")}</Text>
                  )}
                </View>
              )}
              {item.description ? <Text style={tw.classicDescription}>{stripHtml(item.description)}</Text> : null}
              <Bullets bullets={item.bullets} />
              {item.skills?.length ? <Text style={tw.classicDescription}>{item.skills.join(", ")}</Text> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function MinimalTemplate({ data }: PdfTemplateProps) {
  const p = data.personal ?? {};
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin].filter(Boolean).join("   ·   ");
  return (
    <View>
      <View style={{ marginBottom: 14 }}>
        <Text style={[tw.minimalName, { color: "#18181b" }]}>{p.fullName || "Your Name"}</Text>
        {p.jobTitle ? <Text style={tw.minimalTitle}>{p.jobTitle}</Text> : null}
      </View>
      {contact ? <Text style={[tw.minimalContact, { color: "#52525b" }]}>{contact}</Text> : null}
      {data.sections?.filter((s) => s.visible).map((section) => (
        <View key={section.id} style={tw.minimalSection}>
          <SectionTitle title={section.title} accent="#18181b" style="rule" />
          {section.items.map((item) => (
            <View key={item.id} style={tw.minimalItem}>
              {(item.heading || item.subheading) && (
                <View style={tw.itemHeaderRow}>
                  <Text style={[tw.minimalItemHeading, { color: "#18181b" }]}>
                    {item.heading}{item.subheading ? ` — ${item.subheading}` : ""}
                  </Text>
                  {(item.date || item.location) && (
                    <Text style={tw.minimalItemDate}>{[item.date, item.location].filter(Boolean).join(" · ")}</Text>
                  )}
                </View>
              )}
              {item.description ? <Text style={tw.minimalDescription}>{stripHtml(item.description)}</Text> : null}
              <Bullets bullets={item.bullets} />
              {item.skills?.length ? <Text style={tw.minimalDescription}>{item.skills.join(", ")}</Text> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function CompactTemplate({ data, accentColor }: PdfTemplateProps) {
  const p = data.personal ?? {};
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin].filter(Boolean).join("\n");
  const sidebarSections = (data.sections ?? []).filter((s) => ["skills", "education", "certifications", "summary"].includes(s.type) && s.visible);
  const mainSections = (data.sections ?? []).filter((s) => !sidebarSections.includes(s) && s.visible);

  return (
    <View>
      <View style={[tw.compactHeader, { backgroundColor: accentColor }]}>
        <Text style={tw.compactName}>{p.fullName || "Your Name"}</Text>
        {p.jobTitle ? <Text style={tw.compactTitle}>{p.jobTitle}</Text> : null}
        {contact ? <Text style={tw.compactContact}>{contact}</Text> : null}
      </View>
      <View style={{ flexDirection: "row", marginTop: 14 }}>
        <View style={tw.compactSidebar}>
          {sidebarSections.map((section) => (
            <View key={section.id} style={{ marginBottom: 12 }}>
              <Text style={[tw.compactSidebarTitle, { borderBottomColor: accentColor }]}>{section.title.toUpperCase()}</Text>
              {section.items.map((item) => (
                <View key={item.id} style={{ marginTop: 6 }}>
                  {item.heading ? <Text style={tw.compactSidebarHeading}>{item.heading}</Text> : null}
                  {item.subheading ? <Text style={tw.compactSidebarSub}>{item.subheading}</Text> : null}
                  {item.description ? <Text style={tw.compactSidebarText}>{stripHtml(item.description)}</Text> : null}
                  {item.skills?.length
                    ? item.skills.map((s, i) => <Text key={i} style={tw.compactSidebarText}>• {s}</Text>)
                    : null}
                </View>
              ))}
            </View>
          ))}
        </View>
        <View style={tw.compactMain}>
          {mainSections.map((section) => (
            <View key={section.id} style={{ marginBottom: 12 }}>
              <Text style={[tw.compactMainTitle, { borderBottomColor: accentColor }]}>{section.title.toUpperCase()}</Text>
              {section.items.map((item) => (
                <View key={item.id} style={{ marginTop: 6 }}>
                  {(item.heading || item.subheading) && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={tw.compactMainHeading}>
                        {item.heading}{item.subheading ? ` — ${item.subheading}` : ""}
                      </Text>
                      {(item.date || item.location) && (
                        <Text style={tw.compactMainDate}>{[item.date, item.location].filter(Boolean).join(" · ")}</Text>
                      )}
                    </View>
                  )}
                  {item.description ? <Text style={tw.compactMainText}>{stripHtml(item.description)}</Text> : null}
                  <Bullets bullets={item.bullets} />
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function ResumeDocument({ data, accentColor, font }: PdfTemplateProps) {
  const fontFamily = pdfFont(font);
  return (
    <Document title={`${data.personal?.fullName ?? "Resume"} — ResumeForge`} author="ResumeForge">
      <Page size="A4" style={{ fontFamily, padding: 40, fontSize: 10, color: "#374151", lineHeight: 1.45 }}>
        {data.template === "classic" && <ClassicTemplate data={data} accentColor={accentColor} font={font} />}
        {data.template === "minimal" && <MinimalTemplate data={data} accentColor={accentColor} font={font} />}
        {data.template === "compact" && <CompactTemplate data={data} accentColor={accentColor} font={font} />}
        {(!data.template || data.template === "modern") && <ModernTemplate data={data} accentColor={accentColor} font={font} />}
      </Page>
    </Document>
  );
}

/** Render a resume to a PDF buffer. */
export async function resumeToPdfBuffer(data: ResumeData & { template?: string }, accentColor = "#2563eb", font = "Inter"): Promise<Buffer> {
  return renderToBuffer(
    <ResumeDocument data={data} accentColor={accentColor} font={font} />,
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const tw = StyleSheet.create({
  // shared
  section: { marginBottom: 12 },
  item: { marginBottom: 8 },
  itemHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
  itemHeading: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  itemSubheading: { fontSize: 10.5, color: "#4b5563", marginLeft: 6, fontFamily: "Helvetica-Bold" },
  itemDate: { fontSize: 9.5, color: "#6b7280" },
  description: { fontSize: 10, color: "#374151", marginBottom: 2, marginTop: 2 },
  bulletRow: { flexDirection: "row", marginBottom: 1.5, paddingLeft: 2 },
  bulletDot: { width: 9, fontSize: 9, color: "#6b7280" },
  bulletText: { flex: 1, fontSize: 10, color: "#374151" },
  barTitle: {
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
    paddingLeft: 6,
    marginBottom: 6,
    marginTop: 2,
  },
  ruleTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 6, marginTop: 2 },
  rule: { flex: 1, height: 1, marginLeft: 8 },
  plainTitle: { marginBottom: 6, marginTop: 2 },

  // modern
  modernHeader: { borderBottomWidth: 3, paddingBottom: 10, marginBottom: 12 },
  name: { fontSize: 26, color: "#111827", letterSpacing: -0.5 },
  titleLine: { fontSize: 12.5, color: "#2563eb", marginTop: 2 },
  contactLine: { fontSize: 9.5, color: "#6b7280", marginTop: 5 },

  // classic
  classicName: { fontSize: 24, fontFamily: "Times-Bold", letterSpacing: 1 },
  classicTitle: { fontSize: 12, color: "#4b5563", marginTop: 3, fontFamily: "Times-Roman" },
  classicRule: { width: 90, height: 2, marginTop: 8, marginBottom: 6 },
  classicContact: { fontSize: 9.5, color: "#6b7280", marginTop: 2 },
  classicSection: { marginBottom: 10 },
  classicSectionTitleRow: { borderBottomWidth: 0.75, borderBottomColor: "#111827", paddingBottom: 2, marginBottom: 6 },
  classicSectionTitle: { fontSize: 11.5, fontFamily: "Times-Bold", letterSpacing: 1.5 },
  classicItemHeading: { fontSize: 11, fontFamily: "Times-Bold" },
  classicItemDate: { fontSize: 9.5, color: "#6b7280", fontFamily: "Times-Roman" },
  classicDescription: { fontSize: 10, color: "#374151", marginTop: 2, fontFamily: "Times-Roman" },

  // minimal
  minimalName: { fontSize: 24, fontFamily: "Helvetica-Bold", letterSpacing: -0.3 },
  minimalTitle: { fontSize: 12, color: "#18181b", marginTop: 2 },
  minimalContact: { fontSize: 9.5, marginBottom: 10 },
  minimalSection: { marginBottom: 12 },
  minimalItem: { marginBottom: 8 },
  minimalItemHeading: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  minimalItemDate: { fontSize: 9.5, color: "#71717a" },
  minimalDescription: { fontSize: 10, color: "#3f3f46", marginTop: 2 },

  // compact
  compactHeader: { padding: 12, borderRadius: 2 },
  compactName: { fontSize: 22, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  compactTitle: { fontSize: 11.5, color: "#e5e7eb", marginTop: 2 },
  compactContact: { fontSize: 8.5, color: "#f3f4f6", marginTop: 5, lineHeight: 1.5 },
  compactSidebar: { width: "33%", paddingRight: 10 },
  compactMain: { width: "67%", paddingLeft: 2 },
  compactSidebarTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#111827", borderBottomWidth: 1, paddingBottom: 1, marginBottom: 3, letterSpacing: 0.5 },
  compactSidebarHeading: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1f2937" },
  compactSidebarSub: { fontSize: 8.5, color: "#4b5563" },
  compactSidebarText: { fontSize: 8.5, color: "#374151", marginTop: 1 },
  compactMainTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827", borderBottomWidth: 1, paddingBottom: 1, marginBottom: 3, letterSpacing: 0.5 },
  compactMainHeading: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: "#111827" },
  compactMainDate: { fontSize: 8.5, color: "#6b7280" },
  compactMainText: { fontSize: 9.5, color: "#374151", marginTop: 1.5 },
});
