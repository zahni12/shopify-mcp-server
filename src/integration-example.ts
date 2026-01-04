/**
 * BEISPIEL: Integration in src/index.ts
 * 
 * Dies zeigt, wie du die Blog- und File-Tools in den bestehenden MCP Server einbaust.
 * Die genaue Struktur kann je nach Version des Servers variieren.
 */

// ============================================================================
// SCHRITT 1: Imports am Anfang der Datei hinzufügen
// ============================================================================

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GraphQLClient } from "graphql-request";
import { z } from "zod";

// HINZUFÜGEN: Blog Tools importieren
import { 
  BLOG_TOOL_DEFINITIONS, 
  handleBlogTool 
} from "./blog-tools.js";

// HINZUFÜGEN: File Tools importieren
import { 
  FILE_TOOL_DEFINITIONS, 
  handleFileTool 
} from "./file-tools.js";

// ============================================================================
// SCHRITT 2: Bei ListTools - Alle Tool Definitions hinzufügen
// ============================================================================

// Suche nach dem ListToolsRequestSchema Handler
// Er sieht ungefähr so aus:

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... bestehende Tools ...
      {
        name: "get-products",
        description: "Get all products or search by title",
        // ...
      },
      {
        name: "get-orders",
        description: "Get orders with advanced filtering",
        // ...
      },
      // ... weitere bestehende Tools ...
      
      // HINZUFÜGEN: Blog Tools
      ...BLOG_TOOL_DEFINITIONS,
      
      // HINZUFÜGEN: File Tools
      ...FILE_TOOL_DEFINITIONS,
    ],
  };
});

// ============================================================================
// SCHRITT 3: Bei CallTool - Blog und File Handler hinzufügen
// ============================================================================

// Suche nach dem CallToolRequestSchema Handler
// Er sieht ungefähr so aus:

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Bestehende Tool-Handler...
  switch (name) {
    case "get-products":
      // ... bestehender Code ...
      break;
      
    case "get-orders":
      // ... bestehender Code ...
      break;
      
    // ... weitere bestehende cases ...

    // HINZUFÜGEN: Blog Tools Handler
    case "get-blogs":
    case "get-blog":
    case "get-articles":
    case "get-article":
    case "create-blog":
    case "create-article":
    case "update-article":
    case "delete-article":
      return handleBlogTool(client, name, args || {});

    // HINZUFÜGEN: File Tools Handler
    case "get-files":
    case "get-file":
    case "upload-file-from-url":
    case "upload-multiple-files":
    case "update-file":
    case "delete-file":
      return handleFileTool(client, name, args || {});

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// ============================================================================
// ALTERNATIVE: Wenn der Code if/else statt switch verwendet
// ============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get-products") {
    // ... bestehender Code ...
  } else if (name === "get-orders") {
    // ... bestehender Code ...
  }
  // ... weitere bestehende handlers ...
  
  // HINZUFÜGEN: Blog Tools Handler
  else if (
    name === "get-blogs" ||
    name === "get-blog" ||
    name === "get-articles" ||
    name === "get-article" ||
    name === "create-blog" ||
    name === "create-article" ||
    name === "update-article" ||
    name === "delete-article"
  ) {
    return handleBlogTool(client, name, args || {});
  }
  
  // HINZUFÜGEN: File Tools Handler
  else if (
    name === "get-files" ||
    name === "get-file" ||
    name === "upload-file-from-url" ||
    name === "upload-multiple-files" ||
    name === "update-file" ||
    name === "delete-file"
  ) {
    return handleFileTool(client, name, args || {});
  }
  
  else {
    throw new Error(`Unknown tool: ${name}`);
  }
});

// ============================================================================
// VOLLSTÄNDIGES MINIMAL-BEISPIEL
// ============================================================================

/**
 * Falls du einen komplett neuen Server aufsetzen willst,
 * hier ist ein vollständiges Beispiel:
 */

const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const MYSHOPIFY_DOMAIN = process.env.MYSHOPIFY_DOMAIN;

if (!SHOPIFY_ACCESS_TOKEN || !MYSHOPIFY_DOMAIN) {
  throw new Error("SHOPIFY_ACCESS_TOKEN and MYSHOPIFY_DOMAIN are required");
}

const client = new GraphQLClient(
  `https://${MYSHOPIFY_DOMAIN}/admin/api/2024-01/graphql.json`,
  {
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
  }
);

const server = new Server(
  { name: "shopify-mcp-server", version: "1.1.0" },
  { capabilities: { tools: {} } }
);

// Tools auflisten
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // Hier kommen alle Tool-Definitionen
    ...BLOG_TOOL_DEFINITIONS,
    ...FILE_TOOL_DEFINITIONS,
    // ... plus die anderen Tools
  ],
}));

// Tools ausführen
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // Blog Tools
  if (name.includes("blog") || name.includes("article")) {
    return handleBlogTool(client, name, args || {});
  }
  
  // File Tools
  if (name.includes("file") || name === "upload-file-from-url" || name === "upload-multiple-files") {
    return handleFileTool(client, name, args || {});
  }
  
  // Andere Tools...
  throw new Error(`Unknown tool: ${name}`);
});

// Server starten
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Shopify MCP Server (with Blog + Files support) running on stdio");
}

main().catch(console.error);
