/**
 * Shopify MCP Server Extension - Blog & Files
 * 
 * Erweitert den shopify-mcp-server um Blog-Artikel und File-Upload Funktionen
 * 
 * GitHub: https://github.com/amir-bengherbi/shopify-mcp-server
 * 
 * Benötigte Shopify API Scopes:
 * - read_content, write_content (für Blogs/Artikel)
 * - read_files, write_files (für File Uploads)
 */

// Blog Tools
export {
  // Queries & Mutations
  GET_BLOGS_QUERY,
  GET_BLOG_QUERY,
  GET_ARTICLES_QUERY,
  GET_ARTICLE_QUERY,
  CREATE_BLOG_MUTATION,
  CREATE_ARTICLE_MUTATION,
  UPDATE_ARTICLE_MUTATION,
  DELETE_ARTICLE_MUTATION,
  // Schemas
  GetBlogsSchema,
  GetBlogSchema,
  GetArticlesSchema,
  GetArticleSchema,
  CreateBlogSchema,
  CreateArticleSchema,
  UpdateArticleSchema,
  DeleteArticleSchema,
  // Tool Definitions
  BLOG_TOOL_DEFINITIONS,
  // Handlers
  handleGetBlogs,
  handleGetBlog,
  handleGetArticles,
  handleGetArticle,
  handleCreateBlog,
  handleCreateArticle,
  handleUpdateArticle,
  handleDeleteArticle,
  handleBlogTool,
} from "./blog-tools.js";

// File Tools
export {
  // Queries & Mutations
  GET_FILES_QUERY,
  GET_FILE_QUERY,
  CREATE_FILE_FROM_URL_MUTATION,
  STAGED_UPLOADS_CREATE_MUTATION,
  DELETE_FILE_MUTATION,
  UPDATE_FILE_MUTATION,
  // Schemas
  GetFilesSchema,
  GetFileSchema,
  UploadFileFromUrlSchema,
  UploadMultipleFilesSchema,
  DeleteFileSchema,
  UpdateFileSchema,
  // Tool Definitions
  FILE_TOOL_DEFINITIONS,
  // Handlers
  handleGetFiles,
  handleGetFile,
  handleUploadFileFromUrl,
  handleUploadMultipleFiles,
  handleDeleteFile,
  handleUpdateFile,
  handleFileTool,
} from "./file-tools.js";

// Kombinierte Tool Definitions für einfachen Import
import { BLOG_TOOL_DEFINITIONS } from "./blog-tools.js";
import { FILE_TOOL_DEFINITIONS } from "./file-tools.js";

export const ALL_EXTENSION_TOOL_DEFINITIONS = [
  ...BLOG_TOOL_DEFINITIONS,
  ...FILE_TOOL_DEFINITIONS,
];

// Kombinierter Handler für alle Extension-Tools
import { handleBlogTool } from "./blog-tools.js";
import { handleFileTool } from "./file-tools.js";

type GraphQLClient = {
  request: <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;
};

const BLOG_TOOLS = [
  "get-blogs",
  "get-blog", 
  "get-articles",
  "get-article",
  "create-blog",
  "create-article",
  "update-article",
  "delete-article",
];

const FILE_TOOLS = [
  "get-files",
  "get-file",
  "upload-file-from-url",
  "upload-multiple-files",
  "delete-file",
  "update-file",
];

export async function handleExtensionTool(
  client: GraphQLClient,
  toolName: string,
  args: Record<string, unknown>
) {
  if (BLOG_TOOLS.includes(toolName)) {
    return handleBlogTool(client, toolName, args);
  }
  
  if (FILE_TOOLS.includes(toolName)) {
    return handleFileTool(client, toolName, args);
  }
  
  throw new Error(`Unknown extension tool: ${toolName}`);
}

export function isExtensionTool(toolName: string): boolean {
  return BLOG_TOOLS.includes(toolName) || FILE_TOOLS.includes(toolName);
}
