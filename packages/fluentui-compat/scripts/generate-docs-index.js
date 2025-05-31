#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the API model to get the actual functions and interfaces
const tempDir = path.join(__dirname, '..', 'temp');
const docsDir = path.join(__dirname, '..', 'docs');
const apiJsonPath = path.join(tempDir, 'fluentui-compat.api.json');

let apiData = null;
try {
  if (fs.existsSync(apiJsonPath)) {
    apiData = JSON.parse(fs.readFileSync(apiJsonPath, 'utf8'));
  }
} catch (error) {
  console.warn('Could not read API data, using static content. Error details:', error);
}

// Extract functions and interfaces from API data
const functions = [];
const interfaces = [];

if (apiData && apiData.members) {
  for (const member of apiData.members) {
    if (member.kind === 'Function') {
      functions.push({
        name: member.name,
        description: extractDescription(member.docComment || ''),
        link: `./fluentui-compat.${member.name.toLowerCase()}.md`
      });
    } else if (member.kind === 'Interface') {
      interfaces.push({
        name: member.name,
        description: extractDescription(member.docComment || ''),
        link: `./fluentui-compat.${member.name.toLowerCase()}.md`
      });
    }
  }
}

// Fallback to static content if API data is not available
if (functions.length === 0) {
  functions.push(
    {
      name: 'bundleIcon',
      description: 'Creates an optimized bundled icon component that renders either a filled or regular icon based on the <code>filled</code> prop. The component is memoized for optimal render performance.',
      link: './fluentui-compat.bundleicon.md'
    },
    {
      name: 'useAsync',
      description: 'Hook to provide an Async instance that is automatically cleaned up on dismount.',
      link: './fluentui-compat.useasync.md'
    },
    {
      name: 'useConst',
      description: 'Hook to initialize and return a constant value with stable identity. Unlike React.useMemo, this hook guarantees the initializer function is called exactly once.',
      link: './fluentui-compat.useconst.md'
    }
  );
}

if (interfaces.length === 0) {
  interfaces.push({
    name: 'BundledIconProps',
    description: 'Props interface for bundled icon components',
    link: './fluentui-compat.bundlediconprops.md'
  });
}

function extractDescription(docComment) {
  // Simple extraction of description from doc comment
  const summaryMatch = docComment.match(/@summary\s+([^@]*)/);
  if (summaryMatch) {
    return summaryMatch[1].trim();
  }
  
  const remarksMatch = docComment.match(/@remarks\s+([^@]*)/);
  if (remarksMatch) {
    return remarksMatch[1].trim();
  }
  
  // Fallback to first line of comment
  const lines = docComment.split('\\n').filter(line => line.trim() && !line.trim().startsWith('@'));
  return lines.length > 0 ? lines[0].trim() : '';
}

function generateFunctionRows(functions) {
  return functions.map(func => `
                <tr>
                    <td><strong>${func.name}</strong></td>
                    <td>${func.description}</td>
                    <td><a href="${func.link}" class="nav-link">View Details</a></td>
                </tr>`).join('');
}

function generateInterfaceRows(interfaces) {
  return interfaces.map(iface => `
                <tr>
                    <td><strong>${iface.name}</strong></td>
                    <td>${iface.description}</td>
                    <td><a href="${iface.link}" class="nav-link">View Details</a></td>
                </tr>`).join('');
}

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FluentUI Compat - API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            color: #0078d4;
            border-bottom: 2px solid #0078d4;
            padding-bottom: 10px;
        }
        .nav-section {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .nav-section h2 {
            margin-top: 0;
            color: #333;
        }
        .nav-link {
            display: inline-block;
            padding: 8px 16px;
            margin: 4px 8px 4px 0;
            background: #0078d4;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        .nav-link:hover {
            background: #106ebe;
        }
        .description {
            background: #e7f3ff;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #0078d4;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>FluentUI Compat - API Documentation</h1>
    
    <div class="description">
        <p><strong>FluentUI React complimentary components and utilities focused on render performance</strong></p>
        <p>This package provides optimized utilities and components for FluentUI React applications, designed for maximum performance and minimal bundle size impact.</p>
    </div>

    <div class="nav-section">
        <h2>📚 API Reference</h2>
        <a href="./fluentui-compat.md" class="nav-link">Complete API Reference</a>
        <a href="./index.md" class="nav-link">Markdown Index</a>
    </div>

    <div class="nav-section">
        <h2>🚀 Functions</h2>
        <table>
            <thead>
                <tr>
                    <th>Function</th>
                    <th>Description</th>
                    <th>Documentation</th>
                </tr>
            </thead>
            <tbody>${generateFunctionRows(functions)}
            </tbody>
        </table>
    </div>

    <div class="nav-section">
        <h2>🔧 Interfaces</h2>
        <table>
            <thead>
                <tr>
                    <th>Interface</th>
                    <th>Description</th>
                    <th>Documentation</th>
                </tr>
            </thead>
            <tbody>${generateInterfaceRows(interfaces)}
            </tbody>
        </table>
    </div>

    <div class="nav-section">
        <h2>📋 Quick Links</h2>
        <a href="https://github.com/cascadiacollections/fluentui-compat" class="nav-link">GitHub Repository</a>
        <a href="https://www.npmjs.com/package/@cascadiacollections/fluentui-compat" class="nav-link">NPM Package</a>
    </div>

    <div class="footer">
        <p>Generated with API Extractor and API Documenter | <a href="https://github.com/cascadiacollections/fluentui-compat">FluentUI Compat</a></p>
    </div>
</body>
</html>`;

// Ensure docs directory exists
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Write the HTML file
fs.writeFileSync(path.join(docsDir, 'index.html'), htmlContent);
console.log('Generated index.html for GitHub Pages');