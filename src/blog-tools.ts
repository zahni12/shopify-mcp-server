/**
 * Blog Tools Extension for shopify-mcp-server
 * 
 * Füge diesen Code zu deinem Fork von https://github.com/amir-bengherbi/shopify-mcp-server hinzu
 * 
 * Benötigte Shopify API Scopes:
 * - read_content
 * - write_content
 */

import { z } from "zod";

// =============================================================================
// GraphQL QUERIES & MUTATIONS
// =============================================================================

// Query: Alle Blogs abrufen
export const GET_BLOGS_QUERY = `
  query GetBlogs($first: Int!) {
    blogs(first: $first) {
      edges {
        node {
          id
          title
          handle
          commentPolicy
          articlesCount {
            count
          }
        }
      }
    }
  }
`;

// Query: Einzelnen Blog mit Artikeln abrufen
export const GET_BLOG_QUERY = `
  query GetBlog($id: ID!, $articlesFirst: Int!) {
    blog(id: $id) {
      id
      title
      handle
      commentPolicy
      articles(first: $articlesFirst) {
        edges {
          node {
            id
            title
            handle
            publishedAt
            summary
            tags
            author {
              name
            }
          }
        }
      }
    }
  }
`;

// Query: Artikel abrufen
export const GET_ARTICLES_QUERY = `
  query GetArticles($blogId: ID!, $first: Int!, $query: String) {
    blog(id: $blogId) {
      articles(first: $first, query: $query) {
        edges {
          node {
            id
            title
            handle
            body
            summary
            publishedAt
            tags
            author {
              name
            }
            image {
              url
              altText
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

// Query: Einzelnen Artikel abrufen
export const GET_ARTICLE_QUERY = `
  query GetArticle($id: ID!) {
    article(id: $id) {
      id
      title
      handle
      body
      summary
      publishedAt
      tags
      author {
        name
      }
      image {
        url
        altText
      }
      blog {
        id
        title
      }
    }
  }
`;

// Mutation: Blog erstellen
export const CREATE_BLOG_MUTATION = `
  mutation CreateBlog($blog: BlogCreateInput!) {
    blogCreate(blog: $blog) {
      blog {
        id
        title
        handle
        commentPolicy
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

// Mutation: Artikel erstellen
export const CREATE_ARTICLE_MUTATION = `
  mutation CreateArticle($article: ArticleCreateInput!) {
    articleCreate(article: $article) {
      article {
        id
        title
        handle
        body
        summary
        publishedAt
        tags
        author {
          name
        }
        image {
          url
          altText
        }
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

// Mutation: Artikel aktualisieren
export const UPDATE_ARTICLE_MUTATION = `
  mutation UpdateArticle($id: ID!, $article: ArticleUpdateInput!) {
    articleUpdate(id: $id, article: $article) {
      article {
        id
        title
        handle
        body
        summary
        publishedAt
        tags
        author {
          name
        }
        image {
          url
          altText
        }
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

// Mutation: Artikel löschen
export const DELETE_ARTICLE_MUTATION = `
  mutation DeleteArticle($id: ID!) {
    articleDelete(id: $id) {
      deletedArticleId
      userErrors {
        code
        field
        message
      }
    }
  }
`;

// =============================================================================
// ZOD SCHEMAS (für Tool-Input-Validierung)
// =============================================================================

export const GetBlogsSchema = z.object({
  limit: z.number().min(1).max(50).default(10).describe("Maximum number of blogs to return"),
});

export const GetBlogSchema = z.object({
  blogId: z.string().describe("The ID of the blog (e.g., 'gid://shopify/Blog/123456')"),
  articlesLimit: z.number().min(1).max(50).default(10).describe("Maximum number of articles to include"),
});

export const GetArticlesSchema = z.object({
  blogId: z.string().describe("The ID of the blog to get articles from"),
  limit: z.number().min(1).max(50).default(10).describe("Maximum number of articles to return"),
  query: z.string().optional().describe("Search query to filter articles"),
});

export const GetArticleSchema = z.object({
  articleId: z.string().describe("The ID of the article to retrieve"),
});

export const CreateBlogSchema = z.object({
  title: z.string().describe("Title of the blog"),
  handle: z.string().optional().describe("URL handle for the blog (auto-generated from title if not provided)"),
  commentPolicy: z.enum(["MODERATED", "CLOSED", "AUTO_PUBLISHED"]).default("MODERATED").describe("Comment policy for the blog"),
});

export const CreateArticleSchema = z.object({
  blogId: z.string().describe("The ID of the blog to create the article in"),
  title: z.string().describe("Title of the article"),
  body: z.string().describe("HTML content of the article"),
  summary: z.string().optional().describe("Short summary/excerpt of the article"),
  handle: z.string().optional().describe("URL handle for the article"),
  authorName: z.string().optional().describe("Name of the author"),
  tags: z.array(z.string()).optional().describe("Tags for the article"),
  isPublished: z.boolean().default(true).describe("Whether to publish immediately"),
  publishDate: z.string().optional().describe("Publish date in ISO format (e.g., '2024-01-15T12:00:00Z')"),
  imageUrl: z.string().optional().describe("URL of the featured image"),
  imageAltText: z.string().optional().describe("Alt text for the featured image"),
});

export const UpdateArticleSchema = z.object({
  articleId: z.string().describe("The ID of the article to update"),
  title: z.string().optional().describe("New title of the article"),
  body: z.string().optional().describe("New HTML content of the article"),
  summary: z.string().optional().describe("New summary/excerpt"),
  handle: z.string().optional().describe("New URL handle"),
  authorName: z.string().optional().describe("New author name"),
  tags: z.array(z.string()).optional().describe("New tags (replaces existing)"),
  isPublished: z.boolean().optional().describe("Publish status"),
  imageUrl: z.string().optional().describe("URL of new featured image"),
  imageAltText: z.string().optional().describe("Alt text for the featured image"),
});

export const DeleteArticleSchema = z.object({
  articleId: z.string().describe("The ID of the article to delete"),
});

// =============================================================================
// TOOL DEFINITIONS (für MCP Server)
// =============================================================================

export const BLOG_TOOL_DEFINITIONS = [
  {
    name: "get-blogs",
    description: "Get all blogs in the Shopify store",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of blogs to return (1-50)",
          default: 10,
        },
      },
    },
  },
  {
    name: "get-blog",
    description: "Get a single blog by ID with its articles",
    inputSchema: {
      type: "object",
      properties: {
        blogId: {
          type: "string",
          description: "The ID of the blog (e.g., 'gid://shopify/Blog/123456')",
        },
        articlesLimit: {
          type: "number",
          description: "Maximum number of articles to include (1-50)",
          default: 10,
        },
      },
      required: ["blogId"],
    },
  },
  {
    name: "get-articles",
    description: "Get articles from a specific blog",
    inputSchema: {
      type: "object",
      properties: {
        blogId: {
          type: "string",
          description: "The ID of the blog to get articles from",
        },
        limit: {
          type: "number",
          description: "Maximum number of articles to return (1-50)",
          default: 10,
        },
        query: {
          type: "string",
          description: "Search query to filter articles",
        },
      },
      required: ["blogId"],
    },
  },
  {
    name: "get-article",
    description: "Get a single article by ID with full content",
    inputSchema: {
      type: "object",
      properties: {
        articleId: {
          type: "string",
          description: "The ID of the article to retrieve",
        },
      },
      required: ["articleId"],
    },
  },
  {
    name: "create-blog",
    description: "Create a new blog in the Shopify store",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the blog",
        },
        handle: {
          type: "string",
          description: "URL handle for the blog (auto-generated from title if not provided)",
        },
        commentPolicy: {
          type: "string",
          enum: ["MODERATED", "CLOSED", "AUTO_PUBLISHED"],
          description: "Comment policy for the blog",
          default: "MODERATED",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "create-article",
    description: "Create a new blog article/post",
    inputSchema: {
      type: "object",
      properties: {
        blogId: {
          type: "string",
          description: "The ID of the blog to create the article in",
        },
        title: {
          type: "string",
          description: "Title of the article",
        },
        body: {
          type: "string",
          description: "HTML content of the article",
        },
        summary: {
          type: "string",
          description: "Short summary/excerpt of the article",
        },
        handle: {
          type: "string",
          description: "URL handle for the article",
        },
        authorName: {
          type: "string",
          description: "Name of the author",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for the article",
        },
        isPublished: {
          type: "boolean",
          description: "Whether to publish immediately",
          default: true,
        },
        publishDate: {
          type: "string",
          description: "Publish date in ISO format (e.g., '2024-01-15T12:00:00Z')",
        },
        imageUrl: {
          type: "string",
          description: "URL of the featured image",
        },
        imageAltText: {
          type: "string",
          description: "Alt text for the featured image",
        },
      },
      required: ["blogId", "title", "body"],
    },
  },
  {
    name: "update-article",
    description: "Update an existing blog article",
    inputSchema: {
      type: "object",
      properties: {
        articleId: {
          type: "string",
          description: "The ID of the article to update",
        },
        title: {
          type: "string",
          description: "New title of the article",
        },
        body: {
          type: "string",
          description: "New HTML content of the article",
        },
        summary: {
          type: "string",
          description: "New summary/excerpt",
        },
        handle: {
          type: "string",
          description: "New URL handle",
        },
        authorName: {
          type: "string",
          description: "New author name",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "New tags (replaces existing)",
        },
        isPublished: {
          type: "boolean",
          description: "Publish status",
        },
        imageUrl: {
          type: "string",
          description: "URL of new featured image",
        },
        imageAltText: {
          type: "string",
          description: "Alt text for the featured image",
        },
      },
      required: ["articleId"],
    },
  },
  {
    name: "delete-article",
    description: "Delete a blog article",
    inputSchema: {
      type: "object",
      properties: {
        articleId: {
          type: "string",
          description: "The ID of the article to delete",
        },
      },
      required: ["articleId"],
    },
  },
];

// =============================================================================
// HANDLER FUNCTIONS
// =============================================================================

// Typ für den GraphQL Client (anpassen an deine Implementierung)
type GraphQLClient = {
  request: <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;
};

export async function handleGetBlogs(client: GraphQLClient, args: z.infer<typeof GetBlogsSchema>) {
  const { limit } = GetBlogsSchema.parse(args);
  
  const response = await client.request<{
    blogs: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          handle: string;
          commentPolicy: string;
          articlesCount: { count: number };
        };
      }>;
    };
  }>(GET_BLOGS_QUERY, { first: limit });

  const blogs = response.blogs.edges.map((edge) => edge.node);
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(blogs, null, 2),
      },
    ],
  };
}

export async function handleGetBlog(client: GraphQLClient, args: z.infer<typeof GetBlogSchema>) {
  const { blogId, articlesLimit } = GetBlogSchema.parse(args);
  
  const response = await client.request<{
    blog: {
      id: string;
      title: string;
      handle: string;
      commentPolicy: string;
      articles: {
        edges: Array<{
          node: {
            id: string;
            title: string;
            handle: string;
            publishedAt: string;
            summary: string;
            tags: string[];
            author: { name: string };
          };
        }>;
      };
    };
  }>(GET_BLOG_QUERY, { id: blogId, articlesFirst: articlesLimit });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(response.blog, null, 2),
      },
    ],
  };
}

export async function handleGetArticles(client: GraphQLClient, args: z.infer<typeof GetArticlesSchema>) {
  const { blogId, limit, query } = GetArticlesSchema.parse(args);
  
  const response = await client.request<{
    blog: {
      articles: {
        edges: Array<{
          node: {
            id: string;
            title: string;
            handle: string;
            body: string;
            summary: string;
            publishedAt: string;
            tags: string[];
            author: { name: string };
            image: { url: string; altText: string } | null;
          };
        }>;
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
      };
    };
  }>(GET_ARTICLES_QUERY, { blogId, first: limit, query });

  const articles = response.blog.articles.edges.map((edge) => edge.node);
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          articles,
          pageInfo: response.blog.articles.pageInfo,
        }, null, 2),
      },
    ],
  };
}

export async function handleGetArticle(client: GraphQLClient, args: z.infer<typeof GetArticleSchema>) {
  const { articleId } = GetArticleSchema.parse(args);
  
  const response = await client.request<{
    article: {
      id: string;
      title: string;
      handle: string;
      body: string;
      summary: string;
      publishedAt: string;
      tags: string[];
      author: { name: string };
      image: { url: string; altText: string } | null;
      blog: { id: string; title: string };
    };
  }>(GET_ARTICLE_QUERY, { id: articleId });

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(response.article, null, 2),
      },
    ],
  };
}

export async function handleCreateBlog(client: GraphQLClient, args: z.infer<typeof CreateBlogSchema>) {
  const { title, handle, commentPolicy } = CreateBlogSchema.parse(args);
  
  const blogInput: Record<string, unknown> = {
    title,
    commentPolicy,
  };
  
  if (handle) {
    blogInput.handle = handle;
  }

  const response = await client.request<{
    blogCreate: {
      blog: {
        id: string;
        title: string;
        handle: string;
        commentPolicy: string;
      } | null;
      userErrors: Array<{
        code: string;
        field: string[];
        message: string;
      }>;
    };
  }>(CREATE_BLOG_MUTATION, { blog: blogInput });

  if (response.blogCreate.userErrors.length > 0) {
    return {
      content: [
        {
          type: "text",
          text: `Error creating blog: ${JSON.stringify(response.blogCreate.userErrors, null, 2)}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `Blog created successfully:\n${JSON.stringify(response.blogCreate.blog, null, 2)}`,
      },
    ],
  };
}

export async function handleCreateArticle(client: GraphQLClient, args: z.infer<typeof CreateArticleSchema>) {
  const input = CreateArticleSchema.parse(args);
  
  const articleInput: Record<string, unknown> = {
    blogId: input.blogId,
    title: input.title,
    body: input.body,
    isPublished: input.isPublished,
  };
  
  if (input.summary) articleInput.summary = input.summary;
  if (input.handle) articleInput.handle = input.handle;
  if (input.authorName) articleInput.author = { name: input.authorName };
  if (input.tags) articleInput.tags = input.tags;
  if (input.publishDate) articleInput.publishDate = input.publishDate;
  if (input.imageUrl) {
    articleInput.image = {
      url: input.imageUrl,
      altText: input.imageAltText || "",
    };
  }

  const response = await client.request<{
    articleCreate: {
      article: {
        id: string;
        title: string;
        handle: string;
        body: string;
        summary: string;
        publishedAt: string;
        tags: string[];
        author: { name: string };
        image: { url: string; altText: string } | null;
      } | null;
      userErrors: Array<{
        code: string;
        field: string[];
        message: string;
      }>;
    };
  }>(CREATE_ARTICLE_MUTATION, { article: articleInput });

  if (response.articleCreate.userErrors.length > 0) {
    return {
      content: [
        {
          type: "text",
          text: `Error creating article: ${JSON.stringify(response.articleCreate.userErrors, null, 2)}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `Article created successfully:\n${JSON.stringify(response.articleCreate.article, null, 2)}`,
      },
    ],
  };
}

export async function handleUpdateArticle(client: GraphQLClient, args: z.infer<typeof UpdateArticleSchema>) {
  const input = UpdateArticleSchema.parse(args);
  
  const articleInput: Record<string, unknown> = {};
  
  if (input.title) articleInput.title = input.title;
  if (input.body) articleInput.body = input.body;
  if (input.summary) articleInput.summary = input.summary;
  if (input.handle) articleInput.handle = input.handle;
  if (input.authorName) articleInput.author = { name: input.authorName };
  if (input.tags) articleInput.tags = input.tags;
  if (input.isPublished !== undefined) articleInput.isPublished = input.isPublished;
  if (input.imageUrl) {
    articleInput.image = {
      url: input.imageUrl,
      altText: input.imageAltText || "",
    };
  }

  const response = await client.request<{
    articleUpdate: {
      article: {
        id: string;
        title: string;
        handle: string;
        body: string;
        summary: string;
        publishedAt: string;
        tags: string[];
        author: { name: string };
        image: { url: string; altText: string } | null;
      } | null;
      userErrors: Array<{
        code: string;
        field: string[];
        message: string;
      }>;
    };
  }>(UPDATE_ARTICLE_MUTATION, { id: input.articleId, article: articleInput });

  if (response.articleUpdate.userErrors.length > 0) {
    return {
      content: [
        {
          type: "text",
          text: `Error updating article: ${JSON.stringify(response.articleUpdate.userErrors, null, 2)}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `Article updated successfully:\n${JSON.stringify(response.articleUpdate.article, null, 2)}`,
      },
    ],
  };
}

export async function handleDeleteArticle(client: GraphQLClient, args: z.infer<typeof DeleteArticleSchema>) {
  const { articleId } = DeleteArticleSchema.parse(args);

  const response = await client.request<{
    articleDelete: {
      deletedArticleId: string | null;
      userErrors: Array<{
        code: string;
        field: string[];
        message: string;
      }>;
    };
  }>(DELETE_ARTICLE_MUTATION, { id: articleId });

  if (response.articleDelete.userErrors.length > 0) {
    return {
      content: [
        {
          type: "text",
          text: `Error deleting article: ${JSON.stringify(response.articleDelete.userErrors, null, 2)}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `Article deleted successfully. Deleted ID: ${response.articleDelete.deletedArticleId}`,
      },
    ],
  };
}

// =============================================================================
// ROUTER FUNCTION (zum Einbinden in den MCP Server)
// =============================================================================

export async function handleBlogTool(
  client: GraphQLClient,
  toolName: string,
  args: Record<string, unknown>
) {
  switch (toolName) {
    case "get-blogs":
      return handleGetBlogs(client, args as z.infer<typeof GetBlogsSchema>);
    case "get-blog":
      return handleGetBlog(client, args as z.infer<typeof GetBlogSchema>);
    case "get-articles":
      return handleGetArticles(client, args as z.infer<typeof GetArticlesSchema>);
    case "get-article":
      return handleGetArticle(client, args as z.infer<typeof GetArticleSchema>);
    case "create-blog":
      return handleCreateBlog(client, args as z.infer<typeof CreateBlogSchema>);
    case "create-article":
      return handleCreateArticle(client, args as z.infer<typeof CreateArticleSchema>);
    case "update-article":
      return handleUpdateArticle(client, args as z.infer<typeof UpdateArticleSchema>);
    case "delete-article":
      return handleDeleteArticle(client, args as z.infer<typeof DeleteArticleSchema>);
    default:
      throw new Error(`Unknown blog tool: ${toolName}`);
  }
}
