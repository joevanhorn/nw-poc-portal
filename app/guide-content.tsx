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

## Worked Example: Custom MCP Server for Google Workspace (Test OU)

A concrete instantiation of the [custom MCP pattern above](#bringing-your-own-mcp-server-custom-tools). This walks through wiring a Google Workspace–backed MCP server into the same Okta-fronted adapter, scoped to a test OU, using **Workforce Identity Federation** so no long-lived service account keys are stored anywhere.

### Architecture

\`\`\`
┌────────┐    ┌──────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│ Claude │───▶│  NW-POC Adapter  │───▶│  GWS MCP Server      │───▶│  Google STS     │
│        │    │  (Okta OAuth)    │    │  (ECS Fargate)       │    │  /v1/token      │
└────────┘    └──────────────────┘    │                      │    └────────┬────────┘
                                       │  - validates token   │             │ federated
                                       │  - exchanges via STS │             │ token
                                       │  - calls Google APIs │◀────────────┘
                                       └──────────┬───────────┘
                                                  │
                                  ┌───────────────┴───────────────┐
                                  ▼                               ▼
                          ┌──────────────┐               ┌──────────────────┐
                          │  Drive API   │               │  Calendar API    │
                          │  (scoped to  │               │  (scoped to      │
                          │  test OU)    │               │  test OU)        │
                          └──────────────┘               └──────────────────┘
\`\`\`

The Okta access token issued by the NW-POC auth server is forwarded by the adapter, exchanged at Google STS for a short-lived federated token, and used to call Google APIs as the user — with IAM bindings scoping each user to resources their test-OU identity is allowed to touch.

> **Important caveat:** Workforce Identity Federation grants access to **Google Cloud + data-plane APIs (Drive, Calendar, Sheets, BigQuery, etc.)**. It does NOT grant **Admin SDK** privileges (user/group management). If the customer wants admin operations later, the federated principal also needs a Workspace admin role bound in Admin Console → Account → Admin roles. See [Extending to Admin SDK](#extending-to-admin-sdk) at the end.

---

### Part 1: Google Workspace prep

1. **Sign in** to [admin.google.com](https://admin.google.com) as a super admin
2. **Directory → Organizational units → Create organizational unit**
   - **Name:** \`Test-MCP-OU\`
   - **Parent:** root OU
3. **Provision test users** into that OU. Either:
   - Manually: Directory → Users → Add new user, set **Organizational unit** to \`/Test-MCP-OU\`
   - Via Okta provisioning: in the Okta admin console, configure the **Google Workspace** app integration to map a test group to the \`Test-MCP-OU\` Organizational Unit (Provisioning → To App → Organizational Unit)

---

### Part 2: GCP — Workforce Identity Federation

1. **Create a GCP project** (or reuse an existing one) and enable these APIs:
   - **IAM Credentials API** (\`iamcredentials.googleapis.com\`)
   - **Security Token Service API** (\`sts.googleapis.com\`)
   - Any data-plane APIs the demo needs: **Admin SDK** (\`admin.googleapis.com\`), **Drive** (\`drive.googleapis.com\`), **Calendar** (\`calendar.googleapis.com\`), etc.

   \`\`\`bash
   gcloud config set project <PROJECT_ID>
   gcloud services enable iamcredentials.googleapis.com sts.googleapis.com \\
     drive.googleapis.com calendar.googleapis.com
   \`\`\`

2. **Create a Workforce Identity Pool.** The pool is the trust boundary that holds external identities. Workforce pools live at the **organization level** (not the project level) — you need an Organization in GCP and \`roles/iam.workforcePoolAdmin\` on it.

   \`\`\`bash
   gcloud iam workforce-pools create nw-poc-pool \\
     --location=global \\
     --organization=<ORG_ID> \\
     --display-name="NW-POC Workforce Pool"
   \`\`\`

3. **Add Okta as an OIDC provider** for the pool. Use the NW-POC auth server's issuer URL — it issues JWT access tokens, which is what STS exchanges.

   \`\`\`bash
   gcloud iam workforce-pools providers create-oidc okta-nw-poc \\
     --workforce-pool=nw-poc-pool \\
     --location=global \\
     --issuer-uri="https://demo-nerdwallet-o4aa-poc.oktapreview.com/oauth2/ausy6l45lqufRf8oB1d7" \\
     --client-id="<NW-POC adapter client_id from the OIDC app>" \\
     --attribute-mapping="google.subject=assertion.sub,google.groups=assertion.groups,attribute.email=assertion.email,attribute.scope=assertion.scp" \\
     --attribute-condition="assertion.scp.exists(s, s == 'gws:read' || s == 'gws:write')"
   \`\`\`

   The \`attribute-condition\` is the **first defense layer** — it rejects any token at STS that doesn't carry the right Okta scopes, before IAM bindings even apply.

4. **Bind IAM roles to the federated principalSet.** Limit access to resources the test OU should touch. Example: grant read access to a specific shared drive that holds the test OU's documents.

   \`\`\`bash
   gcloud iam workforce-pools workforce-pool-providers add-iam-policy-binding \\
     # ... or directly on the resource:
   gcloud projects add-iam-policy-binding <PROJECT_ID> \\
     --role="roles/drive.fileMetadataReader" \\
     --member="principalSet://iam.googleapis.com/locations/global/workforcePools/nw-poc-pool/group/test-mcp-users"
   \`\`\`

   The \`principalSet://\` URI shape lets you bind by attribute (group, email, custom claim). Pattern variants:
   - \`principal://...workforcePools/nw-poc-pool/subject/<okta-user-sub>\` — single user
   - \`principalSet://...workforcePools/nw-poc-pool/group/<group-id>\` — by Okta group claim
   - \`principalSet://...workforcePools/nw-poc-pool/attribute.email/jane@nerdwallet.com\` — by mapped attribute

---

### Part 3: Okta side

1. **Verify the auth server issues JWT access tokens.** In **Security → API → Authorization Servers → NW-POC MCP Adapter Auth Server → Settings**, confirm token type is JWT (not opaque). STS rejects opaque tokens.

2. **Add new scopes** (Security → API → Authorization Servers → \<server\> → Scopes):
   - \`gws:read\` — read Workspace data (Drive, Calendar, etc.)
   - \`gws:write\` — write Workspace data

3. **Create groups** (Directory → Groups → Add Group):
   - \`NW-POC-GWS-Read\`
   - \`NW-POC-GWS-Write\`

4. **Add a custom claim** to surface group membership in the token (so STS can map it to the federated principal):

   - Auth server → **Claims → Add Claim**
   - Name: \`groups\`
   - Include in: **Access Token**
   - Value type: **Groups**
   - Filter: \`Matches regex\` → \`^NW-POC-GWS-.*$\`

5. **Update the access policy** to grant the new scopes only when the user is in the matching group. Edit the existing rule (or add a new one) so \`gws:read\` requires \`NW-POC-GWS-Read\` group, and \`gws:write\` requires \`NW-POC-GWS-Write\`.

---

### Part 4: MCP server skeleton (Node.js)

Minimal HTTP MCP server that performs STS exchange and serves Drive tools. Place this in a new ECR repo \`nw-poc-mcp-gws\`.

\`\`\`typescript
// src/server.ts
import express from "express";
import { GoogleAuth } from "google-auth-library";
import { drive_v3, calendar_v3, google } from "googleapis";

const app = express();
app.use(express.json());

// Exchange the inbound Okta JWT for a Google federated access token
async function getGoogleAuthForUser(oktaJwt: string) {
  const auth = new GoogleAuth({
    credentials: {
      type: "external_account",
      audience: "//iam.googleapis.com/locations/global/workforcePools/nw-poc-pool/providers/okta-nw-poc",
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      credential_source: { url: "in-memory" }, // overridden via subjectTokenSupplier
      workforce_pool_user_project: process.env.GCP_PROJECT_ID!,
    } as any,
    // google-auth-library 9.x supports subjectTokenSupplier on the external_account client
  });
  // Pseudo-API: bind the inbound JWT as the subject token for this client
  (auth as any).subjectTokenSupplier = async () => oktaJwt;
  return auth;
}

// Tool registry — scope-filtered, like the other backends
const ALL_TOOLS = [
  { name: "gws_list_drive_files", scope: "gws:read",  fn: listDriveFiles },
  { name: "gws_get_drive_file",   scope: "gws:read",  fn: getDriveFile },
  { name: "gws_list_calendars",   scope: "gws:read",  fn: listCalendars },
  { name: "gws_create_event",     scope: "gws:write", fn: createEvent },
];

function tokenScopes(jwt: string): Set<string> {
  const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
  return new Set((payload.scp || []) as string[]);
}

app.post("/mcp/tools/list", (req, res) => {
  const jwt = req.headers.authorization!.replace(/^Bearer /, "");
  const scopes = tokenScopes(jwt);
  res.json({ tools: ALL_TOOLS.filter(t => scopes.has(t.scope)).map(t => ({ name: t.name })) });
});

app.post("/mcp/tools/call", async (req, res) => {
  const jwt = req.headers.authorization!.replace(/^Bearer /, "");
  const scopes = tokenScopes(jwt);
  const { name, arguments: args } = req.body;
  const tool = ALL_TOOLS.find(t => t.name === name);
  if (!tool || !scopes.has(tool.scope)) return res.status(403).json({ error: "denied" });
  const auth = await getGoogleAuthForUser(jwt);
  res.json(await tool.fn(auth, args));
});

async function listDriveFiles(auth: any, args: { q?: string }) {
  const drive = google.drive({ version: "v3", auth });
  const r = await drive.files.list({ q: args.q, pageSize: 25, fields: "files(id,name,mimeType,modifiedTime)" });
  return { files: r.data.files };
}

// ... getDriveFile, listCalendars, createEvent follow the same pattern

app.get("/health", (_, res) => res.status(200).send("ok"));
app.listen(3000);
\`\`\`

> The MCP HTTP transport spec is more involved than the snippet above — this is the auth + scope-filtering shape. Use the official [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) for the full transport.

---

### Part 5: Deploy to the same ECS cluster

Follow the [Custom MCP backend pattern](#bringing-your-own-mcp-server-custom-tools) above. The Workspace-specific bits:

1. **Add Terraform** at \`environments/nw-poc/terraform/mcp_server_gws.tf\` — ECR repo, ECS task definition, target group, ALB listener rule on \`nw-poc-mcp-gws.supersafe-ai.io\`, ACM cert, Route53 record, ECS service
2. **Task definition env vars:**
   \`\`\`hcl
   environment = [
     { name = "PORT",            value = "3000" },
     { name = "SERVICE_API_KEY", value = random_password.mcp_api_key.result },
     { name = "GCP_PROJECT_ID",  value = "<your-gcp-project-id>" },
     { name = "GCP_WORKFORCE_POOL_PROVIDER",
       value = "projects/<PROJECT_NUMBER>/locations/global/workforcePools/nw-poc-pool/providers/okta-nw-poc" },
   ]
   \`\`\`
   No service account key file. The MCP server uses the inbound Okta JWT as the subject token for STS — credentials never sit on disk.
3. **Register with the adapter** by extending env vars on \`aws_ecs_task_definition.mcp_adapter\`:
   \`\`\`hcl
   { name = "CIMD_TRUSTED_BACKEND_ACCESS", value = "\${var.prefix}-tools,\${var.prefix}-gws" },
   { name = "BACKEND_GWS_URL",             value = "https://\${var.prefix}-mcp-gws.\${var.domain_name}" },
   { name = "BACKEND_GWS_API_KEY",         value = random_password.mcp_api_key.result },
   \`\`\`

---

### Part 6: Test plan

1. **Add a test user to \`Test-MCP-OU\`** in Workspace (manual or via Okta provisioning)
2. **Add the same user (Okta account) to \`NW-POC-GWS-Read\`** in Okta
3. **Reconnect Claude** (Claude Code, Claude.ai personal, or Claude for Work — all of them) — sign out and back in to pick up the new scopes
4. **List tools** — the user should now see the \`gws_*\` read tools alongside any SFDC/SNOW tools they already had
5. **Run \`gws_list_drive_files\`** — should return only files the test-OU user has access to in Drive. Files outside the OU's access boundary are silently filtered by Drive's own ACLs.
6. **Negative test:** remove the user from \`NW-POC-GWS-Read\`. The next \`tools/list\` call hides the \`gws_*\` tools entirely. If a stale agent attempts \`tools/call\`, the MCP server rejects with 403 because the new token no longer carries \`gws:read\`.

---

### Extending to Admin SDK

If the customer later wants user/group management (suspend a user, list group members, move a user between OUs), Workforce Identity Federation alone is not enough — Admin SDK requires Workspace admin privileges.

Two options:

1. **Bind a custom Workspace admin role to the federated user.** In Admin Console → **Account → Admin roles → Create new role**, scope privileges to the test OU only (User Management Admin → Restrict to OU \`Test-MCP-OU\`). Assign the role to each test user. When that user's Okta token is exchanged at STS, the resulting federated identity carries the Workspace admin role, and Admin SDK calls succeed within the OU scope.
2. **Add a service-account fallback** for admin operations only. Keep WIF for data APIs; provision a service account with Domain-Wide Delegation impersonating a Workspace admin restricted to the OU. The MCP server picks the auth path per-tool: data tools use WIF, admin tools use DWD. Less clean (a long-lived key reappears) but works without changing per-user Admin Console assignments.

The clean answer is option 1 — extend the same federated identity model — once the customer commits to specific admin operations.

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
