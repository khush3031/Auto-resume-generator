export default function extractVariables(html: string): string[] {
  const matches = html.match(/<%=\s*(.*?)\s*%>/g) || [];
  return matches.map(v =>
    v.replace(/<%=\s*|\s*%>/g, '').trim()
  );
}