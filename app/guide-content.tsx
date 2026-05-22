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
| **Admin UI** | [nw-poc-admin.supersafe-ai.io](https://nw-poc-admin.supersafe-ai.io) | Manage agents, resources, connections (SSO for all org users) |
| **MCP Server** | [nw-poc-mcp.supersafe-ai.io](https://nw-poc-mcp.supersafe-ai.io) | Backend tools (Salesforce + ServiceNow) |

---

## Connecting an AI Agent

> **Which client uses which OAuth mode?**
>
> | Client | OAuth Mode | Okta Client Mode |
> |--------|-----------|------------------|
> | Claude Code (CLI) | CIMD | **CIMD Client** |
> | Claude.ai web + Desktop | DCR or admin-supplied creds | **DCR Enabled** |
> | Claude for Work / Enterprise | Admin-supplied OAuth creds | **DCR Enabled** |
> | Other MCP agents | DCR or static client | **DCR Enabled** |
>
> Only Claude Code uses CIMD ([per Anthropic](https://claude.com/docs/connectors/building/authentication)). All hosted Claude surfaces use DCR or admin-supplied OAuth credentials — see [Registering an Agent for Claude.ai / Claude for Work](#registering-an-agent-for-claudeai--claude-for-work).

### Option A: Claude Code (CLI)

\`\`\`bash
claude mcp add --transport http nw-poc https://nw-poc-adapter.supersafe-ai.io
\`\`\`

Claude Code will:
1. Discover the adapter via MCP Discovery
2. Identify itself via CIMD (no DCR fallback)
3. Redirect you to Okta for authentication (PKCE + MFA)
4. Receive scoped tokens based on your group membership
5. Display available tools filtered by your authorization

**Do NOT pass \`--client-id\`** — the adapter resolves identity via CIMD automatically.

### Option B: Claude.ai Connector (Personal — Web + Desktop)

Individual users with a personal Claude account can add the adapter as a [custom Connector](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).

1. Open [claude.ai](https://claude.ai) → **Settings → Connectors**
2. Click **Add custom connector**
3. **Name:** \`NW-POC\` · **Remote MCP server URL:** \`https://nw-poc-adapter.supersafe-ai.io\`
4. Click **Connect** — Claude.ai attempts DCR, redirects to Okta, then receives scoped tokens
5. Approve the requested scopes; tools become available in any new conversation

> Claude.ai uses DCR — not the Claude Code CIMD URL. A matching Okta OIDC app must already exist for the agent (see [registration steps below](#registering-an-agent-for-claudeai--claude-for-work)).

### Option C: Claude for Work / Enterprise (Org-Installed Connector)

Org admins on a Claude Team or Enterprise plan can install the adapter as an org-wide Connector so every workspace member sees it automatically.

1. Sign into [claude.ai](https://claude.ai) as an org admin
2. **Organization settings → Connectors** ([claude.ai/admin-settings/connectors](https://claude.ai/admin-settings/connectors))
3. **Add → Custom → Web**
4. **Name:** \`NW-POC\` · **Remote MCP server URL:** \`https://nw-poc-adapter.supersafe-ai.io\`
5. Expand **Advanced settings** and paste the **OAuth Client ID** and **Client Secret** from the dedicated Okta OIDC app
6. **Save** — the Connector is visible to all workspace members. End users enable it at [claude.ai/customize/connectors](https://claude.ai/customize/connectors)

> Each Okta OIDC app should serve exactly ONE Claude org — do not share creds across agents.

### Option D: Any MCP-Compatible Agent

Any agent that supports MCP over HTTP can connect to the adapter URL. The adapter supports Dynamic Client Registration, CIMD (Claude Code only), and standard OAuth 2.0 PKCE.

### Your Okta Dashboard

Two apps are pre-configured on your Okta dashboard:

- **MCP Demo - Setup Guide** — this page (SSO protected)
- **MCP Adapter Admin** — the adapter management console (SSO for all org users)

Both are accessible via single sign-on from your Okta dashboard at \`demo-nerdwallet-o4aa-poc.oktapreview.com\`.

---

## Registering a New AI Agent in Okta

> **Create one AI Agent per client surface.** Claude Code, Claude.ai personal, and Claude for Work each need their own AI Agent + dedicated OIDC app. The steps below are for **Claude Code (CIMD)**. For Claude.ai / Cowork / Claude for Work, see [the DCR variant](#registering-an-agent-for-claudeai--claude-for-work) further down.

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

1. Click **MCP Adapter Admin** from your Okta dashboard (or go to [nw-poc-admin.supersafe-ai.io](https://nw-poc-admin.supersafe-ai.io))
2. SSO will log you in automatically — all users in this org have access
3. Go to **Agents** and verify your agent appears
4. Click **Sync All** to resolve managed connections
5. **For Claude Code only:** open the agent → **Edit** → switch **Client Mode** from **DCR Enabled** to **CIMD Client** → paste \`https://claude.ai/oauth/claude-code-client-metadata\` into the **CIMD Client ID** field → **Save**. Do NOT bind this URL on a Claude.ai or Claude for Work agent — those use DCR.

---

## Registering an Agent for Claude.ai / Claude for Work

Hosted Claude surfaces (Claude.ai web, Desktop, mobile, Cowork, and Claude for Work / Enterprise) authenticate via DCR or admin-supplied OAuth credentials — not CIMD.

### Step 1: Create a dedicated OIDC application in Okta

In the Okta Admin Console:

1. **Applications → Create App Integration → OIDC - OpenID Connect → Web Application**
2. **App integration name:** \`NW-POC Claude for Work\` (or \`NW-POC Claude.ai Personal\`)
3. **Grant types:** Authorization Code, Refresh Token
4. **Sign-in redirect URIs** — add all three:
   - \`https://nw-poc-adapter.supersafe-ai.io/oauth/callback\` — adapter callback
   - \`https://claude.ai/api/mcp/auth_callback\` — Anthropic-hosted callback
   - \`https://claude.com/api/mcp/auth_callback\` — Anthropic-hosted callback (alternate hostname)
5. **Assignments:** Everyone (or specific NW-POC groups)
6. Save and record the generated **Client ID** and **Client Secret**

### Step 2: Create the AI Agent

1. **Directory → AI Agents → Create AI Agent**
2. Name it to match the surface — do NOT reuse the OIDC app from the Claude Code agent
3. Link it to the OIDC app from Step 1

### Step 3: Add the managed connection

1. New agent → **Managed Connections → Add**
2. Point at the **NW-POC MCP Adapter Auth Server** (\`ausy6l45lqufRf8oB1d7\`)
3. Select all scopes

### Step 4: Leave Client Mode = DCR Enabled

In the Admin UI: open the agent → **Edit** → confirm **Client Mode** is **DCR Enabled**. Do not paste a CIMD URL — hosted surfaces ignore CIMD.

### Step 5: Hand off OAuth credentials

- **Claude for Work / Enterprise (Option C):** paste the Client ID / Secret from Step 1 into **Claude.ai → Organization settings → Connectors → \<your connector\> → Advanced settings**
- **Claude.ai personal (Option B):** no admin paste — DCR fires at first Connect and binds the OAuth handshake automatically

---

## Pre-Configured User Access

These users are pre-provisioned with varying access levels to demonstrate layered authorization:

| User | Role | Okta Groups | FGA Team | Tools Visible | Account Ownership |
|------|------|------------|----------|---------------|-------------------|
| **jfoltz@nerdwallet.com** | Leadership | All 4 groups | leadership | All 14 (read + write) | Can view all accounts |
| **ehansen@nerdwallet.com** | Sales Manager | CRM-Read, CRM-Write, ITSM-Read | west-enterprise | SFDC all + SNOW read | Owns Acme Corp, Pinnacle Financial |
| **rtilney@nerdwallet.com** | Sales Rep | CRM-Read, CRM-Write | east-enterprise | SFDC all only | Owns Northstar Insurance, Meridian Healthcare |
| **mlakin@nerdwallet.com** | Analyst | CRM-Read, ITSM-Read | product | Read-only (both) | Can view all accounts (no edit) |
| **zparedes@nerdwallet.com** | New Hire | (none) | mid-market | **0 tools** | Owns Apex Manufacturing (in FGA, but no Okta scopes) |

**Key demo points:**
- **zparedes** has zero standing privilege — adding to groups instantly grants tools
- **mlakin** can read but never sees write tools — scope filtering is invisible, not disabled
- **ehansen** can write to SFDC but only read SNOW — cross-system scoping
- **rtilney** has no ITSM access at all — ServiceNow tools are completely hidden
- FGA adds per-resource checks: **ehansen** owns Acme Corp but NOT Northstar Insurance

---

## Authorization Model

The auth server uses [access policies](https://help.okta.com/oie/en-us/content/topics/security/api-config-access-policies.htm) to control which [scopes](https://help.okta.com/oie/en-us/content/topics/security/api-config-scopes.htm) are issued:

- **CRM-Write + ITSM-Write groups** → All scopes
- **CRM-Read + ITSM-Read groups** → Read scopes only
- **No groups** → No scopes → No tools visible

### Layer 3: Okta FGA (Fine-Grained Authorization)

Scope-based filtering (Layer 2) answers "may this user see this tool?" — a coarse, role-shaped check. [Okta FGA](https://docs.fga.dev/) (powered by [OpenFGA](https://openfga.dev/)) answers the finer questions:

| Question | Best layer |
|----------|-----------|
| Should this user have read access? | Layer 1 — Okta groups + scopes |
| Should the AI agent see this tool? | Layer 2 — MCP server scope filter |
| May this user read **this specific record**? | **Layer 3 — FGA** |
| May this agent act on behalf of this user? | **Layer 3 — FGA** |

In this environment FGA is already wired in: even if a user has \`sfdc:write\` scope, FGA can block them from editing an account they don't own.

**Authorization model:**

\`\`\`
type user
type ai_agent
  relations
    define operator: [user]
type mcp_tool
  relations
    define invoker: [user, ai_agent, group#member]
type resource
  relations
    define owner: [user]
    define reader: [user, ai_agent, group#member] or owner
    define writer: [user, ai_agent] or owner
type group
  relations
    define member: [user]
\`\`\`

This lets the MCP server answer \`check(user:jane, invoker, mcp_tool:sfdc_get_account)\` and \`check(ai_agent:claude_code_jane, reader, resource:sfdc_account_001)\` before each tool call.

**Per-call check pattern (Python):**

\`\`\`python
from openfga_sdk import OpenFgaClient
from openfga_sdk.client.models import ClientCheckRequest

async def authorize(token_sub, tool_name, resource_id=None):
    # Tool invocation check
    ok = await fga.check(ClientCheckRequest(
        user=f"user:{token_sub}",
        relation="invoker",
        object=f"mcp_tool:{tool_name}",
    ))
    if not ok.allowed:
        raise PermissionError(f"FGA denied invocation of {tool_name}")

    # Per-resource check
    if resource_id:
        relation = "writer" if tool_name.startswith(("sfdc_create", "sfdc_update")) else "reader"
        ok = await fga.check(ClientCheckRequest(
            user=f"user:{token_sub}",
            relation=relation,
            object=f"resource:{resource_id}",
        ))
        if not ok.allowed:
            raise PermissionError(f"FGA denied {relation} on {resource_id}")
\`\`\`

The FGA subject (\`user:<sub>\`) comes from the **token claim**, not the agent — the agent acts strictly with the user's authority. **Fail closed**: if FGA returns 5xx or times out, the MCP server must deny.

> **References:** [Okta FGA docs](https://docs.fga.dev/) · [OpenFGA modeling guide](https://openfga.dev/docs/modeling)

---

## Note on Backend Systems

The Salesforce and ServiceNow instances are connected to the MCP Server via **API credentials only**. Human users do not log into these systems directly — all access is mediated through the AI agent via MCP tools.

SSO for direct human access to Salesforce and ServiceNow is not configured in this environment. If you need direct SSO access for testing or validation, contact **Joe Van Horn** (joe.vanhorn@okta.com) to have it added.

---

## Bringing Your Own MCP Server (Custom Tools)

The bundled MCP server exposes 14 Salesforce + ServiceNow tools. To add NerdWallet-owned tools (internal systems, data warehouse, custom workflows) behind the same Okta-governed adapter, deploy a second MCP server and register it as an additional backend.

### Backend contract

A custom MCP server must:

1. Speak **MCP over HTTP** at minimum \`tools/list\` and \`tools/call\` ([2025-03-26 spec](https://spec.modelcontextprotocol.io/specification/2025-03-26/))
2. Accept the adapter's forwarded bearer token (\`Authorization: Bearer <token>\`) and read scopes from it
3. **Filter \`tools/list\` by scope** — unauthorized tools must be invisible, not just disabled
4. Expose \`/health\` returning HTTP 200 for the ALB target group
5. Share the adapter's \`SERVICE_API_KEY\` (recommended) or use mTLS

### Registering the new backend

Two steps:

1. **Deploy** a new ECS service (target group, listener rule on a new hostname like \`nw-poc-mcp-custom.supersafe-ai.io\`, ACM cert, Route53 A-record) — follow the pattern in \`environments/nw-poc/terraform/mcp_server.tf\`
2. **Wire it into the adapter** by extending these env vars on \`aws_ecs_task_definition.mcp_adapter\`:

\`\`\`hcl
{ name = "CIMD_TRUSTED_BACKEND_ACCESS", value = "\${var.prefix}-tools,\${var.prefix}-custom" },
{ name = "BACKEND_CUSTOM_URL",          value = "http://\${var.prefix}-mcp-custom.internal:3000" },
{ name = "BACKEND_CUSTOM_API_KEY",      value = random_password.mcp_api_key.result },
\`\`\`

### Add new scopes

Each new tool family maps to its own scope so group membership remains the access lever:

1. **Security → API → Authorization Servers → NW-POC MCP Adapter Auth Server → Scopes → Add Scope**
2. Define one read + one write scope per new tool family, e.g. \`nw:read\`, \`nw:write\`
3. Update the access policy to grant the new scopes based on the same NW-POC group pattern

### Minimal \`tools/list\` filter

\`\`\`python
ALL_TOOLS = [
    {"name": "nw_search_users",  "scope": "nw:read"},
    {"name": "nw_create_alert",  "scope": "nw:write"},
]

def list_tools(token_scopes):
    return [t for t in ALL_TOOLS if t["scope"] in token_scopes]
\`\`\`

> **Test plan:** assign a test user to \`NW-POC-NW-Read\` only and reconnect from Claude Code or Claude.ai — the user should see read-only NW tools alongside any existing SFDC/SNOW tools.

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
| Claude.ai Connector fails at "Connect" with DCR error | Adapter has \`DCR_PROVISION_OKTA_APP=false\` — create the matching Okta OIDC app first ([steps](#registering-an-agent-for-claudeai--claude-for-work)) |
| Claude.ai redirects to Okta but loops back with \`invalid_redirect_uri\` | OIDC app missing \`https://claude.ai/api/mcp/auth_callback\` and/or \`https://claude.com/api/mcp/auth_callback\` |
| Claude for Work shows "No matching client" | Client ID/secret in Advanced settings doesn't match the OIDC app linked to the agent. Each Claude org needs its own dedicated OIDC app |
| \`No relay credentials\` error on Claude.ai/Cowork agent | CIMD URL was bound on a hosted-surface agent. Switch Client Mode back to **DCR Enabled** and clear the CIMD field |
| FGA check always denies | Confirm \`FGA_STORE_ID\` / \`FGA_MODEL_ID\` are set and tuples exist. Use the FGA Playground to dry-run the check |
| Custom MCP backend not seen by adapter | Add the backend's short name to \`CIMD_TRUSTED_BACKEND_ACCESS\` and ensure the adapter has its URL + shared \`SERVICE_API_KEY\`, then restart the adapter ECS service |
`;

export default function GuideContent() {
  return (
    <article className="guide-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {guideMarkdown}
      </ReactMarkdown>
    </article>
  );
}
