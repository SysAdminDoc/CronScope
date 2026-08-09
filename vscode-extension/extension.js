import * as vscode from "vscode";
import { asciiHeatmap, describeCron } from "./core.js";
import { findCronCandidates } from "./candidates.js";

export function activate(context) {
  const provider = vscode.languages.registerHoverProvider({ scheme:"file" }, {
    provideHover(document, position) {
      const candidate = findCronCandidates(document.lineAt(position.line).text)
        .find(item => position.character >= item.start && position.character <= item.end);
      if (!candidate) return undefined;

      const year = new Date().getFullYear();
      const markdown = new vscode.MarkdownString();
      markdown.isTrusted = false;
      markdown.appendMarkdown("**CronScope** · `" + candidate.expression + "`\n\n");
      markdown.appendText(describeCron(candidate.expression));
      markdown.appendMarkdown("\n\n");
      markdown.appendCodeblock(asciiHeatmap(candidate.parsed, year), "text");
      return new vscode.Hover(markdown, new vscode.Range(
        document.positionAt(candidate.start),
        document.positionAt(candidate.end)
      ));
    },
  });
  context.subscriptions.push(provider);
}

export function deactivate() {}
