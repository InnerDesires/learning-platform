# Payload MCP Integration

The project uses [Payload MCP Plugin](https://payloadcms.com/docs/mcp) to expose CMS data to AI coding assistants (Cursor, Windsurf, etc.) via the Model Context Protocol.

## Setup

### 1. Get an API Key

1. Start the dev server (`pnpm dev`)
2. Open the Payload admin panel at `http://localhost:3000/admin`
3. Navigate to **MCP API Keys** in the sidebar
4. Create a new API key — enable access for the collections and globals you need
5. Copy the generated key

### 2. Add to Cursor MCP Config

Edit `.cursor/mcp.json` and add the `payload` entry:

```json
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com",
      "headers": {}
    },
    "payload": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "<YOUR_SERVER_URL>/api/mcp",
        "--header",
        "Authorization: Bearer <YOUR_API_KEY>"
      ]
    }
  }
}
```

Replace:
- `<YOUR_SERVER_URL>` — your app URL (e.g. `http://localhost:3000` for local dev, or your deployed URL)
- `<YOUR_API_KEY>` — the key from step 1

> **Note:** The API key is stored locally in `.cursor/mcp.json`. Do not commit it. If you accidentally modify `mcp.json`, discard the payload entry before committing.

### 3. Enable in Cursor

Open the MCP panel in Cursor (Settings > MCP) and verify both `vercel` and `payload` servers show as connected.

## Available Tools

The MCP plugin exposes CRUD tools for each enabled collection and global:

| Tool | Description |
|------|-------------|
| `findPosts` / `createPosts` / `updatePosts` / `deletePosts` | Blog posts |
| `findPages` / `createPages` / `updatePages` / `deletePages` | Static pages |
| `findCategories` / `createCategories` / `updateCategories` / `deleteCategories` | Post categories |
| `findMedia` / `updateMedia` | Media uploads (create/delete disabled) |
| `findCourses` / `createCourses` / `updateCourses` / `deleteCourses` | Online courses with steps and quizzes |
| `findCourseCategories` / `createCourseCategories` / `updateCourseCategories` / `deleteCourseCategories` | Course categories |
| `findComments` / `createComments` / `updateComments` / `deleteComments` | User comments on posts and courses |
| `findLikes` / `createLikes` / `deleteLikes` | Likes/reactions (update disabled) |
| `findHeader` / `updateHeader` | Site header navigation |
| `findFooter` / `updateFooter` | Site footer navigation |

## Plugin Configuration

The MCP plugin is configured in `src/plugins/index.ts`. To enable/disable collections or globals, edit the `mcpPlugin()` config there.

## Localization

All content is localized. When using MCP tools, pass `locale` to read/write in a specific locale:

- `uk` — Ukrainian (default)
- `en` — English

Example: `updatePosts({ id: 1, locale: "en", title: "English Title" })`
