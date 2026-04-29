"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const guideMarkdown = `
# NW-POC: Okta MCP Adapter — POC Environment Guide

**Okta Org:** \`demo-nerdwallet-o4aa-poc.oktapreview.com\`

---

## Overview

This environment demonstrates how [Okta secures AI agent access](https://help.okta.com/oie/en-us/content/topics/ai-agents/ai-agent-register.htm) to enterprise systems through the [Model Context Protocol (MCP)](https://developer.okta.com/docs/concepts/mcp-server/). Three authorization layers compose to give enterprises identity-aware, governed, fine-grained control over what AI agents can do.

**Layer 1 — Okta Auth Server:** Authenticates the user, evaluates group membership, issues scoped tokens

**Layer 2 — MCP Server:** Reads token scopes, filters tool responses. Write tools are invisible to read-only users.

**Layer 3 — Okta FGA (optional):** Per-tool invocation checks and per-resource authorization

---

## Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| **MCP Adapter** | [nw-poc-adapter.supersafe-ai.io](https://nw-poc-adapter.supersafe-ai.io) | OAuth gateway — agents connect here |
| **Admin UI** | [nw-poc-admin.supersafe-ai.io](https://nw-poc-admin.supersafe-ai.io) | Manage agents, resources, connections |
| **MCP Server** | [nw-poc-mcp.supersafe-ai.io](https://nw-poc-mcp.supersafe-ai.io) | Backend tools (Salesforce + ServiceNow) |

---

## Connecting an AI Agent

### Option A: Claude Code (CLI)

\`\`\`bash
claude mcp add --transport http nw-poc https://nw-poc-adapter.supersafe-ai.io
\`\`\`

Claude Code will:
1. Discover the adapter via MCP Discovery
2. Register itself via Dynamic Client Registration (DCR)
3. Redirect you to Okta for authentication (PKCE + MFA)
4. Receive scoped tokens based on your group membership
5. Display available tools filtered by your authorization

**Do NOT pass \`--client-id\`** — the adapter handles registration automatically.

### Option B: Any MCP-Compatible Agent

Any agent that supports MCP over HTTP can connect to the adapter URL. The adapter supports Dynamic Client Registration, CIMD, and standard OAuth 2.0 PKCE.

---

## Registering a New AI Agent in Okta

### Step 1: Create the AI Agent

1. Sign into the [Okta Admin Console](https://demo-nerdwallet-o4aa-poc-admin.oktapreview.com)
2. Navigate to **Directory > AI Agents**
3. Click **Create AI Agent**
4. Enter a name and description for your agent
5. Create a **dedicated OIDC application** for the agent

> [Add and register AI agents](https://help.okta.com/oie/en-us/content/topics/ai-agents/ai-agent-register.htm) | [Add AI agents manually](https://help.okta.com/oie/en-us/content/topics/ai-agents/ai-agent-add-manually.htm)

### Step 2: Configure the OIDC Application

- **Grant types:** \`authorization_code\`, \`urn:ietf:params:oauth:grant-type:jwt-bearer\`
- **Redirect URI:** \`https://nw-poc-adapter.supersafe-ai.io/oauth/callback\`
- **Assigned to:** Everyone group (or specific test groups)

> [Create an OIDC app integration](https://help.okta.com/oie/en-us/content/topics/apps/apps_app_integration_wizard_oidc.htm)

### Step 3: Add a Managed Connection

1. In the AI Agent configuration, go to **Managed Connections**
2. Add ONE connection pointing to the **NW-POC MCP Adapter Auth Server** (ID: \`ausy6l45lqufRf8oB1d7\`)
3. Select **all scopes**

> [AI agent managed connections](https://help.okta.com/oie/en-us/content/topics/ai-agents/ai-agent-secure.htm) | [Connect AI agents to resources](https://help.okta.com/oie/en-us/content/topics/ai-agents/ai-agent-connected-resource.htm)

### Step 4: Assign Users to Groups

| Group | Scopes Granted | Tools Visible |
|-------|---------------|---------------|
| **NW-POC-CRM-Read** | \`sfdc:read\`, \`mcp:read\` | Salesforce read tools |
| **NW-POC-CRM-Write** | \`sfdc:read\`, \`sfdc:write\`, \`mcp:read\` | All Salesforce tools |
| **NW-POC-ITSM-Read** | \`snow:read\`, \`mcp:read\` | ServiceNow read tools |
| **NW-POC-ITSM-Write** | \`snow:read\`, \`snow:write\`, \`mcp:read\` | All ServiceNow tools |

> [About groups](https://help.okta.com/oie/en-us/Content/Topics/users-groups-profiles/usgp-about-groups.htm)

### Step 5: Verify in the Admin UI

1. Navigate to [nw-poc-admin.supersafe-ai.io](https://nw-poc-admin.supersafe-ai.io)
2. Log in with your Okta credentials
3. Go to **Agents** and verify your agent appears
4. Click **Sync All** to resolve managed connections

---

## Authorization Model

The auth server uses [access policies](https://help.okta.com/oie/en-us/content/topics/security/api-config-access-policies.htm) to control which [scopes](https://help.okta.com/oie/en-us/content/topics/security/api-config-scopes.htm) are issued:

- **CRM-Write + ITSM-Write groups** → All scopes
- **CRM-Read + ITSM-Read groups** → Read scopes only
- **No groups** → No scopes → No tools visible

---

## Available MCP Tools (14 total)

### Salesforce (7 tools)

| Tool | Scope | Description |
|------|-------|-------------|
| \`sfdc_search_accounts\` | sfdc:read | Search accounts by name |
| \`sfdc_get_account\` | sfdc:read | Get account details |
| \`sfdc_list_opportunities\` | sfdc:read | List opportunities |
| \`sfdc_get_opportunity\` | sfdc:read | Get opportunity details |
| \`sfdc_create_account\` | sfdc:write | Create account |
| \`sfdc_update_account\` | sfdc:write | Update account |
| \`sfdc_create_opportunity\` | sfdc:write | Create opportunity |

### ServiceNow (7 tools)

| Tool | Scope | Description |
|------|-------|-------------|
| \`snow_search_incidents\` | snow:read | Search incidents |
| \`snow_get_incident\` | snow:read | Get incident details |
| \`snow_list_enhancements\` | snow:read | List enhancements |
| \`snow_get_enhancement\` | snow:read | Get enhancement details |
| \`snow_create_incident\` | snow:write | Create incident |
| \`snow_update_incident\` | snow:write | Update incident |
| \`snow_create_enhancement\` | snow:write | Create enhancement |

---

## Demo Scenarios

### Scenario 1: Zero Standing Privilege
1. Create a test user with **no group memberships**
2. Connect an agent — it sees **0 tools**
3. Add the user to \`NW-POC-CRM-Read\` — reconnect, agent sees **4 read tools**

### Scenario 2: Scope-Based Tool Filtering
1. User in \`NW-POC-CRM-Read\` → sees read tools only
2. Add \`NW-POC-CRM-Write\` → reconnect, write tools appear

### Scenario 3: Governed Access Lifecycle (with OIG)
1. User requests access via [Access Requests](https://help.okta.com/oie/en-us/content/topics/identity-governance/iga-access-requests.htm)
2. Manager approves → access is time-bound
3. Access auto-revokes → tools disappear

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Agent sees 0 tools | User not in any NW-POC groups |
| \`invalid_scope\` error | Verify \`mcp:read\` scope exists on auth server |
| \`access_denied\` error | Policy must use \`ALL_CLIENTS\` |
| Agent can't connect | Check adapter URL: \`https://nw-poc-adapter.supersafe-ai.io\` |
| Admin UI won't load | Clear cache, verify OIDC redirect URI |
| Tools return errors | Backend credentials (SFDC/SNOW) not yet configured |
`;

export default function GuideContent() {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-semibold prose-a:text-blue-600 prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-table:text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {guideMarkdown}
      </ReactMarkdown>
    </article>
  );
}
