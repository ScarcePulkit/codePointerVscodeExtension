// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    // Command to save code pointer
    let disposable = vscode.commands.registerCommand('extension.saveCodePointer', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

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
        // Encode the URI to handle spaces and special characters
        const linkUri = encodeURI(`vscode://file${uri.path}:${lineNumber}`);

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
        } catch (err) {
            vscode.window.showErrorMessage("Failed to write to code_book.md");
        }
    });

    // Command to show and navigate to pointers
    let showPointers = vscode.commands.registerCommand('extension.showPointers', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return;

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
            // Properly handle paths with spaces
            const uri = vscode.Uri.file(fullPath);
            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document);
            const position = new vscode.Position(selected.lineNumber - 1, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        }
    });

    context.subscriptions.push(disposable, showPointers);
}

// This method is called when your extension is deactivated
export function deactivate() {}
