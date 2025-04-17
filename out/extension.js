"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function activate(context) {
    // Command to save code pointer
    let disposable = vscode.commands.registerCommand('extension.saveCodePointer', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const filePath = document.uri.fsPath;
        const lineNumber = editor.selection.active.line + 1;
        const lineText = document.lineAt(lineNumber - 1).text.trim();
        const timestamp = new Date().toISOString();
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("No workspace is open.");
            return;
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;
        const filePointerPath = path.join(workspacePath, 'code_book');
        const relativeFilePath = path.relative(workspacePath, filePath);
        // Create VS Code URI for the link
        const fullPath = path.join(workspacePath, relativeFilePath);
        const uri = vscode.Uri.file(fullPath);
        const linkUri = `vscode://file${uri.path}:${lineNumber}`;
        // Modified pointer line with markdown link but hidden URI
        const pointerLine = `${timestamp} [${relativeFilePath}:${lineNumber} | ${lineText}](${linkUri})\n`;
        // Check for duplicates
        try {
            const existingContent = fs.existsSync(filePointerPath)
                ? fs.readFileSync(filePointerPath, 'utf8')
                : '';
            const isDuplicate = existingContent.includes(`${relativeFilePath}:${lineNumber}:`);
            if (isDuplicate) {
                vscode.window.showInformationMessage('This line is already bookmarked!');
                return;
            }
            const mdFilePointerPath = filePointerPath + '.md';
            fs.appendFileSync(mdFilePointerPath, pointerLine);
            vscode.window.showInformationMessage(`Code pointer saved with clickable link!`);
        }
        catch (err) {
            vscode.window.showErrorMessage("Failed to write to code_book.md");
        }
    });
    // Command to show and navigate to pointers
    let showPointers = vscode.commands.registerCommand('extension.showPointers', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return;
        const workspacePath = workspaceFolders[0].uri.fsPath;
        const filePointerPath = path.join(workspacePath, 'code_book.md');
        if (!fs.existsSync(filePointerPath)) {
            vscode.window.showInformationMessage('No code pointers saved yet.');
            return;
        }
        const content = fs.readFileSync(filePointerPath, 'utf8');
        const pointers = content.split('\n')
            .filter(line => line.trim())
            .map(line => {
            const match = line.match(/^(.*?) \[(.*?):(\d+) \| (.*?)\]\((vscode:\/\/.*?)\)$/);
            if (match) {
                return {
                    label: `${match[2]}:${match[3]}`,
                    description: match[4],
                    detail: match[1], // timestamp
                    filePath: match[2],
                    lineNumber: parseInt(match[3]),
                    uri: match[5]
                };
            }
            return null;
        })
            .filter(item => item !== null);
        const selected = await vscode.window.showQuickPick(pointers, {
            placeHolder: 'Select a code pointer to jump to'
        });
        if (selected) {
            const fullPath = path.join(workspacePath, selected.filePath);
            const document = await vscode.workspace.openTextDocument(fullPath);
            const editor = await vscode.window.showTextDocument(document);
            const position = new vscode.Position(selected.lineNumber - 1, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        }
    });
    context.subscriptions.push(disposable, showPointers);
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map