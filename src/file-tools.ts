/**
 * File Tools Extension for shopify-mcp-server
 * 
 * Ermöglicht das Hochladen von Bildern/Dateien und Abrufen der CDN-URLs
 * für die Verwendung in Blog-Posts, Produkten, etc.
 * 
 * Benötigte Shopify API Scopes:
 * - read_files
 * - write_files
 */

import { z } from "zod";

// =============================================================================
// GraphQL QUERIES & MUTATIONS
// =============================================================================

// Query: Alle Dateien abrufen
export const GET_FILES_QUERY = `
  query GetFiles($first: Int!, $query: String, $sortKey: FileSortKeys, $reverse: Boolean) {
    files(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges {
        node {
          id
          alt
          createdAt
          fileStatus
          fileErrors {
            code
            message
          }
          ... on MediaImage {
            image {
              url
              width
              height
            }
            mimeType
            originalSource {
              fileSize
            }
          }
          ... on GenericFile {
            url
            mimeType
            originalFileSize
          }
          ... on Video {
            sources {
              url
              mimeType
              width
              height
            }
            originalSource {
              fileSize
              mimeType
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Query: Einzelne Datei abrufen
export const GET_FILE_QUERY = `
  query GetFile($id: ID!) {
    node(id: $id) {
      ... on MediaImage {
        id
        alt
        createdAt
        fileStatus
        image {
          url
          width
          height
        }
        mimeType
      }
      ... on GenericFile {
        id
        alt
        createdAt
        fileStatus
        url
        mimeType
        originalFileSize
      }
      ... on Video {
        id
        alt
        createdAt
        fileStatus
        sources {
          url
          mimeType
          width
          height
        }
      }
    }
  }
`;

// Mutation: Datei von URL erstellen (einfachster Weg)
export const CREATE_FILE_FROM_URL_MUTATION = `
  mutation CreateFileFromUrl($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        alt
        createdAt
        fileStatus
        fileErrors {
          code
          message
        }
        ... on MediaImage {
          image {
            url
            width
            height
          }
          mimeType
        }
        ... on GenericFile {
          url
          mimeType
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Mutation: Staged Upload erstellen (für größere Dateien / Base64)
export const STAGED_UPLOADS_CREATE_MUTATION = `
  mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Mutation: Datei löschen
export const DELETE_FILE_MUTATION = `
  mutation DeleteFile($fileIds: [ID!]!) {
    fileDelete(fileIds: $fileIds) {
      deletedFileIds
      userErrors {
        field
        message
      }
    }
  }
`;

// Mutation: Datei aktualisieren (Alt-Text etc.)
export const UPDATE_FILE_MUTATION = `
  mutation UpdateFile($files: [FileUpdateInput!]!) {
    fileUpdate(files: $files) {
      files {
        id
        alt
        ... on MediaImage {
          image {
            url
          }
        }
        ... on GenericFile {
          url
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

export const GetFilesSchema = z.object({
  limit: z.number().min(1).max(50).default(20).describe("Maximum number of files to return"),
  query: z.string().optional().describe("Search query (e.g., 'status:ready', 'media_type:image', 'filename:*kombucha*')"),
  sortKey: z.enum(["CREATED_AT", "FILENAME", "ID", "ORIGINAL_UPLOAD_SIZE", "UPDATED_AT"]).default("CREATED_AT").describe("Sort field"),
  reverse: z.boolean().default(true).describe("Reverse sort order (true = newest first)"),
});

export const GetFileSchema = z.object({
  fileId: z.string().describe("The ID of the file to retrieve (e.g., 'gid://shopify/MediaImage/123456')"),
});

export const UploadFileFromUrlSchema = z.object({
  url: z.string().url().describe("Public URL of the file to upload"),
  filename: z.string().optional().describe("Custom filename (optional, auto-generated if not provided)"),
  alt: z.string().optional().describe("Alt text for the file (important for SEO and accessibility)"),
  contentType: z.enum(["IMAGE", "FILE", "VIDEO"]).default("IMAGE").describe("Type of content being uploaded"),
});

export const UploadMultipleFilesSchema = z.object({
  files: z.array(z.object({
    url: z.string().url().describe("Public URL of the file"),
    filename: z.string().optional().describe("Custom filename"),
    alt: z.string().optional().describe("Alt text"),
    contentType: z.enum(["IMAGE", "FILE", "VIDEO"]).default("IMAGE"),
  })).min(1).max(20).describe("Array of files to upload (max 20)"),
});

export const DeleteFileSchema = z.object({
  fileIds: z.array(z.string()).min(1).describe("Array of file IDs to delete"),
});

export const UpdateFileSchema = z.object({
  fileId: z.string().describe("ID of the file to update"),
  alt: z.string().optional().describe("New alt text for the file"),
  filename: z.string().optional().describe("New filename"),
});

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const FILE_TOOL_DEFINITIONS = [
  {
    name: "get-files",
    description: "Get all files from the Shopify Files library. Returns URLs that can be used in blog posts, products, etc.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of files to return (1-50)",
          default: 20,
        },
        query: {
          type: "string",
          description: "Search query (e.g., 'status:ready', 'media_type:image', 'filename:*kombucha*')",
        },
        sortKey: {
          type: "string",
          enum: ["CREATED_AT", "FILENAME", "ID", "ORIGINAL_UPLOAD_SIZE", "UPDATED_AT"],
          description: "Sort field",
          default: "CREATED_AT",
        },
        reverse: {
          type: "boolean",
          description: "Reverse sort order (true = newest first)",
          default: true,
        },
      },
    },
  },
  {
    name: "get-file",
    description: "Get details of a specific file including its CDN URL",
    inputSchema: {
      type: "object",
      properties: {
        fileId: {
          type: "string",
          description: "The ID of the file (e.g., 'gid://shopify/MediaImage/123456')",
        },
      },
      required: ["fileId"],
    },
  },
  {
    name: "upload-file-from-url",
    description: "Upload a file to Shopify from a public URL. Returns the Shopify CDN URL that can be used in blog posts, products, etc.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Public URL of the file to upload (must be accessible)",
        },
        filename: {
          type: "string",
          description: "Custom filename (optional)",
        },
        alt: {
          type: "string",
          description: "Alt text for the file (important for SEO)",
        },
        contentType: {
          type: "string",
          enum: ["IMAGE", "FILE", "VIDEO"],
          description: "Type of content",
          default: "IMAGE",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "upload-multiple-files",
    description: "Upload multiple files to Shopify from public URLs at once (max 20)",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: {
            type: "object",
            properties: {
              url: { type: "string", description: "Public URL of the file" },
              filename: { type: "string", description: "Custom filename" },
              alt: { type: "string", description: "Alt text" },
              contentType: { 
                type: "string", 
                enum: ["IMAGE", "FILE", "VIDEO"],
                default: "IMAGE"
              },
            },
            required: ["url"],
          },
          description: "Array of files to upload",
        },
      },
      required: ["files"],
    },
  },
  {
    name: "delete-file",
    description: "Delete one or more files from the Shopify Files library",
    inputSchema: {
      type: "object",
      properties: {
        fileIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of file IDs to delete",
        },
      },
      required: ["fileIds"],
    },
  },
  {
    name: "update-file",
    description: "Update file metadata (alt text, filename)",
    inputSchema: {
      type: "object",
      properties: {
        fileId: {
          type: "string",
          description: "ID of the file to update",
        },
        alt: {
          type: "string",
          description: "New alt text",
        },
        filename: {
          type: "string",
          description: "New filename",
        },
      },
      required: ["fileId"],
    },
  },
];

// =============================================================================
// HANDLER FUNCTIONS
// =============================================================================

type GraphQLClient = {
  request: <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;
};

// Interface für File-Antworten
interface ShopifyFile {
  id: string;
  alt?: string;
  createdAt: string;
  fileStatus: string;
  fileErrors?: Array<{ code: string; message: string }>;
  image?: { url: string; width: number; height: number };
  url?: string;
  mimeType?: string;
  originalFileSize?: number;
  originalSource?: { fileSize: number; mimeType?: string };
  sources?: Array<{ url: string; mimeType: string; width: number; height: number }>;
}

// Hilfsfunktion: Datei-URL extrahieren
function extractFileUrl(file: ShopifyFile): string | null {
  if (file.image?.url) return file.image.url;
  if (file.url) return file.url;
  if (file.sources?.[0]?.url) return file.sources[0].url;
  return null;
}

// Hilfsfunktion: Datei formatieren für Ausgabe
function formatFileOutput(file: ShopifyFile) {
  return {
    id: file.id,
    url: extractFileUrl(file),
    alt: file.alt,
    status: file.fileStatus,
    createdAt: file.createdAt,
    mimeType: file.mimeType || file.originalSource?.mimeType,
    dimensions: file.image ? { width: file.image.width, height: file.image.height } : null,
    errors: file.fileErrors,
  };
}

export async function handleGetFiles(client: GraphQLClient, args: z.infer<typeof GetFilesSchema>) {
  const { limit, query, sortKey, reverse } = GetFilesSchema.parse(args);
  
  const response = await client.request<{
    files: {
      edges: Array<{ node: ShopifyFile }>;
      pageInfo: { hasNextPage: boolean; endCursor: string };
    };
  }>(GET_FILES_QUERY, { first: limit, query, sortKey, reverse });

  const files = response.files.edges.map((edge) => formatFileOutput(edge.node));
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          files,
          pageInfo: response.files.pageInfo,
          hint: "Use the 'url' field to include these files in blog posts or products",
        }, null, 2),
      },
    ],
  };
}

export async function handleGetFile(client: GraphQLClient, args: z.infer<typeof GetFileSchema>) {
  const { fileId } = GetFileSchema.parse(args);
  
  const response = await client.request<{
    node: ShopifyFile;
  }>(GET_FILE_QUERY, { id: fileId });

  if (!response.node) {
    return {
      content: [{ type: "text", text: `File not found: ${fileId}` }],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(formatFileOutput(response.node), null, 2),
      },
    ],
  };
}

export async function handleUploadFileFromUrl(client: GraphQLClient, args: z.infer<typeof UploadFileFromUrlSchema>) {
  const { url, filename, alt, contentType } = UploadFileFromUrlSchema.parse(args);
  
  const fileInput: Record<string, unknown> = {
    originalSource: url,
    contentType: contentType,
  };
  
  if (filename) fileInput.filename = filename;
  if (alt) fileInput.alt = alt;

  const response = await client.request<{
    fileCreate: {
      files: Array<ShopifyFile> | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(CREATE_FILE_FROM_URL_MUTATION, { files: [fileInput] });

  if (response.fileCreate.userErrors.length > 0) {
    return {
      content: [
        {
          type: "text",
          text: `Error uploading file: ${JSON.stringify(response.fileCreate.userErrors, null, 2)}`,
        },
      ],
      isError: true,
    };
  }

  const uploadedFile = response.fileCreate.files?.[0];
  if (!uploadedFile) {
    return {
      content: [{ type: "text", text: "Upload failed: No file returned" }],
      isError: true,
    };
  }

  const fileUrl = extractFileUrl(uploadedFile);
  
  return {
    content: [
      {
        type: "text",
        text: `File uploaded successfully!

**File ID:** ${uploadedFile.id}
**Status:** ${uploadedFile.fileStatus}
**CDN URL:** ${fileUrl || "(processing - check status with get-file)"}

${uploadedFile.fileStatus === "PROCESSING" 
  ? "⏳ Note: File is still processing. Use get-file to check when ready and get the final URL." 
  : "✅ Ready to use! You can now use this URL in blog posts, products, etc."}

Full details:
${JSON.stringify(formatFileOutput(uploadedFile), null, 2)}`,
      },
    ],
  };
}

export async function handleUploadMultipleFiles(client: GraphQLClient, args: z.infer<typeof UploadMultipleFilesSchema>) {
  const { files } = UploadMultipleFilesSchema.parse(args);
  
  const fileInputs = files.map(file => {
    const input: Record<string, unknown> = {
      originalSource: file.url,
      contentType: file.contentType || "IMAGE",
    };
    if (file.filename) input.filename = file.filename;
    if (file.alt) input.alt = file.alt;
    return input;
  });

  const response = await client.request<{
    fileCreate: {
      files: Array<ShopifyFile> | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(CREATE_FILE_FROM_URL_MUTATION, { files: fileInputs });

  if (response.fileCreate.userErrors.length > 0) {
    return {
      content: [
        {
          type: "text",
          text: `Errors during upload: ${JSON.stringify(response.fileCreate.userErrors, null, 2)}`,
        },
      ],
      isError: true,
    };
  }

  const uploadedFiles = response.fileCreate.files?.map(formatFileOutput) || [];
  
  return {
    content: [
      {
        type: "text",
        text: `Uploaded ${uploadedFiles.length} files successfully!

${uploadedFiles.map(f => `- ${f.id}: ${f.url || "(processing)"}`).join("\n")}

Full details:
${JSON.stringify(uploadedFiles, null, 2)}`,
      },
    ],
  };
}

export async function handleDeleteFile(client: GraphQLClient, args: z.infer<typeof DeleteFileSchema>) {
  const { fileIds } = DeleteFileSchema.parse(args);

  const response = await client.request<{
    fileDelete: {
      deletedFileIds: string[] | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(DELETE_FILE_MUTATION, { fileIds });

  if (response.fileDelete.userErrors.length > 0) {
    return {
      content: [
        {
          type: "text",
          text: `Error deleting files: ${JSON.stringify(response.fileDelete.userErrors, null, 2)}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `Successfully deleted ${response.fileDelete.deletedFileIds?.length || 0} files:\n${response.fileDelete.deletedFileIds?.join("\n")}`,
      },
    ],
  };
}

export async function handleUpdateFile(client: GraphQLClient, args: z.infer<typeof UpdateFileSchema>) {
  const { fileId, alt, filename } = UpdateFileSchema.parse(args);
  
  const fileInput: Record<string, unknown> = { id: fileId };
  if (alt !== undefined) fileInput.alt = alt;
  if (filename !== undefined) fileInput.filename = filename;

  const response = await client.request<{
    fileUpdate: {
      files: Array<ShopifyFile> | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(UPDATE_FILE_MUTATION, { files: [fileInput] });

  if (response.fileUpdate.userErrors.length > 0) {
    return {
      content: [
        {
          type: "text",
          text: `Error updating file: ${JSON.stringify(response.fileUpdate.userErrors, null, 2)}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `File updated successfully:\n${JSON.stringify(response.fileUpdate.files?.[0], null, 2)}`,
      },
    ],
  };
}

// =============================================================================
// ROUTER FUNCTION
// =============================================================================

export async function handleFileTool(
  client: GraphQLClient,
  toolName: string,
  args: Record<string, unknown>
) {
  switch (toolName) {
    case "get-files":
      return handleGetFiles(client, args as z.infer<typeof GetFilesSchema>);
    case "get-file":
      return handleGetFile(client, args as z.infer<typeof GetFileSchema>);
    case "upload-file-from-url":
      return handleUploadFileFromUrl(client, args as z.infer<typeof UploadFileFromUrlSchema>);
    case "upload-multiple-files":
      return handleUploadMultipleFiles(client, args as z.infer<typeof UploadMultipleFilesSchema>);
    case "delete-file":
      return handleDeleteFile(client, args as z.infer<typeof DeleteFileSchema>);
    case "update-file":
      return handleUpdateFile(client, args as z.infer<typeof UpdateFileSchema>);
    default:
      throw new Error(`Unknown file tool: ${toolName}`);
  }
}
