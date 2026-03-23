export const dynamic = 'force-static'

const BASE_URL = 'https://app.caredocai.com/api/v1'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface Endpoint {
  method: HttpMethod
  path: string
  description: string
  scope: string
  queryParams?: { name: string; description: string }[]
  requestBody?: string
  responseExample: string
}

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/clients',
    description: 'Returns a paginated list of all clients belonging to the authenticated agency.',
    scope: 'clients:read',
    responseExample: `{
  "data": [
    {
      "id": "clnt_01hx...",
      "fullName": "Margaret Thompson",
      "dateOfBirth": "1942-03-15",
      "status": "active",
      "createdAt": "2024-01-10T09:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 20
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/clients/:id',
    description: 'Returns full details for a single client including care plan summary and assigned caregivers.',
    scope: 'clients:read',
    responseExample: `{
  "id": "clnt_01hx...",
  "fullName": "Margaret Thompson",
  "dateOfBirth": "1942-03-15",
  "address": "12 Oak Lane, Bristol, BS1 4AB",
  "status": "active",
  "caregivers": [
    { "id": "usr_01hx...", "name": "Jane Smith" }
  ],
  "createdAt": "2024-01-10T09:00:00Z"
}`,
  },
  {
    method: 'PUT',
    path: '/api/v1/clients/:id',
    description: 'Updates mutable fields on a client record. Only fields provided in the request body are changed.',
    scope: 'clients:write',
    requestBody: `{
  "address": "15 Elm Street, Bristol, BS2 1CD",
  "emergencyContact": {
    "name": "Robert Thompson",
    "phone": "+44 7700 900123",
    "relationship": "Son"
  }
}`,
    responseExample: `{
  "id": "clnt_01hx...",
  "fullName": "Margaret Thompson",
  "address": "15 Elm Street, Bristol, BS2 1CD",
  "updatedAt": "2024-06-01T14:32:00Z"
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/reports',
    description: 'Returns a list of visit reports, optionally filtered by client, date range, and result limit.',
    scope: 'reports:read',
    queryParams: [
      { name: 'clientId', description: 'Filter by client ID' },
      { name: 'from', description: 'ISO 8601 start date (e.g. 2024-01-01)' },
      { name: 'to', description: 'ISO 8601 end date (e.g. 2024-01-31)' },
      { name: 'limit', description: 'Maximum records to return (default: 20, max: 100)' },
    ],
    responseExample: `{
  "data": [
    {
      "id": "rpt_01hx...",
      "clientId": "clnt_01hx...",
      "clientName": "Margaret Thompson",
      "visitDate": "2024-05-20T10:00:00Z",
      "caregiver": "Jane Smith",
      "status": "completed",
      "aiSummary": "Client in good spirits. Medications taken as prescribed."
    }
  ],
  "total": 15
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/reports/:id',
    description: 'Returns the full content of a single visit report, including AI-generated summary and care notes.',
    scope: 'reports:read',
    responseExample: `{
  "id": "rpt_01hx...",
  "clientId": "clnt_01hx...",
  "visitDate": "2024-05-20T10:00:00Z",
  "caregiver": { "id": "usr_01hx...", "name": "Jane Smith" },
  "notes": "Client ate breakfast. Walk completed. Medication administered.",
  "aiSummary": "Client in good spirits. Medications taken as prescribed.",
  "flags": [],
  "createdAt": "2024-05-20T11:30:00Z"
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/webhooks',
    description: 'Registers a new webhook endpoint to receive real-time event notifications.',
    scope: 'webhooks:write',
    requestBody: `{
  "url": "https://your-server.com/webhooks/caredoc",
  "events": ["report.created", "report.flagged", "client.updated"]
}`,
    responseExample: `{
  "id": "wh_01hx...",
  "url": "https://your-server.com/webhooks/caredoc",
  "events": ["report.created", "report.flagged", "client.updated"],
  "secret": "whsec_...",
  "createdAt": "2024-06-01T09:00:00Z"
}`,
  },
  {
    method: 'DELETE',
    path: '/api/v1/webhooks/:id',
    description: 'Permanently removes a registered webhook. Events will no longer be delivered to that URL.',
    scope: 'webhooks:write',
    responseExample: `{
  "deleted": true,
  "id": "wh_01hx..."
}`,
  },
]

const ERROR_CODES = [
  { code: 'UNAUTHORIZED', status: '401', description: 'Missing or invalid API key.' },
  { code: 'FORBIDDEN', status: '403', description: 'API key does not have the required scope.' },
  { code: 'NOT_FOUND', status: '404', description: 'The requested resource does not exist.' },
  { code: 'VALIDATION_ERROR', status: '422', description: 'Request body or query parameters failed validation.' },
  { code: 'RATE_LIMITED', status: '429', description: 'You have exceeded the rate limit. Retry after the indicated delay.' },
  { code: 'INTERNAL_ERROR', status: '500', description: 'An unexpected server error occurred. Contact support if it persists.' },
]

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full font-mono ${METHOD_STYLES[method]}`}>
      {method}
    </span>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-gray-950 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
      <code>{children}</code>
    </pre>
  )
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-5 py-4 flex items-center gap-3 border-b border-gray-200">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono text-gray-800 font-medium">{endpoint.path}</code>
      </div>

      <div className="px-5 py-5 space-y-5">
        <p className="text-gray-700 text-sm">{endpoint.description}</p>

        {/* Scope */}
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Required scope</span>
          <div className="mt-1">
            <code className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded font-mono">{endpoint.scope}</code>
          </div>
        </div>

        {/* Query params */}
        {endpoint.queryParams && endpoint.queryParams.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Query parameters</span>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-1 pr-4 font-medium">Parameter</th>
                  <th className="pb-1 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {endpoint.queryParams.map(p => (
                  <tr key={p.name}>
                    <td className="py-1.5 pr-4">
                      <code className="text-xs font-mono text-gray-700">{p.name}</code>
                    </td>
                    <td className="py-1.5 text-gray-600 text-xs">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Request body */}
        {endpoint.requestBody && (
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Request body</span>
            <div className="mt-2">
              <CodeBlock>{endpoint.requestBody}</CodeBlock>
            </div>
          </div>
        )}

        {/* Response */}
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Example response</span>
          <div className="mt-2">
            <CodeBlock>{endpoint.responseExample}</CodeBlock>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ApiDocsPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">
      {/* Hero */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
          REST API · v1
        </div>
        <h1 className="text-4xl font-bold text-gray-900">CareDoc AI Public API</h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Integrate CareDoc AI data directly into your own systems. Read client information, retrieve visit reports,
          and subscribe to real-time events via webhooks.
        </p>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-sm text-gray-500 font-medium">Base URL</span>
          <code className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-mono border border-gray-200">
            {BASE_URL}
          </code>
        </div>
      </section>

      {/* Authentication */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3">Authentication</h2>
        <p className="text-gray-700">
          All API requests must be authenticated using an API key passed as a Bearer token in the{' '}
          <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono text-sm">Authorization</code> header.
        </p>
        <CodeBlock>{`Authorization: Bearer cda_your_api_key_here`}</CodeBlock>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-2">
          <h3 className="font-semibold text-blue-900 text-sm">Creating an API key</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Log in to CareDoc AI as a manager or administrator.</li>
            <li>Navigate to <strong>Settings → API Keys</strong>.</li>
            <li>Click <strong>New API Key</strong>, choose a name and select the required scopes.</li>
            <li>Copy the key immediately — it will only be shown once.</li>
          </ol>
        </div>

        <p className="text-sm text-gray-600">
          API keys are prefixed with <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">cda_</code> and are
          scoped to a specific set of permissions. Keys never expire but can be revoked at any time from the settings page.
        </p>
      </section>

      {/* Endpoints */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3">Endpoints</h2>
        <div className="space-y-6">
          {endpoints.map(ep => (
            <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
          ))}
        </div>
      </section>

      {/* Rate limits */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3">Rate limits</h2>
        <p className="text-gray-700">
          Each API key is limited to <strong>100 requests per minute</strong>. If you exceed this limit, you will receive
          a <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono text-sm">429 Too Many Requests</code> response.
        </p>
        <p className="text-gray-700">
          The response will include a{' '}
          <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono text-sm">Retry-After</code> header
          indicating the number of seconds to wait before retrying.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="pb-2 pr-4 font-semibold uppercase tracking-wide">Header</th>
                <th className="pb-2 font-semibold uppercase tracking-wide">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-4"><code className="font-mono text-gray-700">X-RateLimit-Limit</code></td>
                <td className="py-2 text-gray-600">Maximum requests allowed per minute.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="font-mono text-gray-700">X-RateLimit-Remaining</code></td>
                <td className="py-2 text-gray-600">Requests remaining in the current window.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="font-mono text-gray-700">X-RateLimit-Reset</code></td>
                <td className="py-2 text-gray-600">Unix timestamp when the current window resets.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Error codes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3">Error codes</h2>
        <p className="text-gray-700">
          All errors follow a consistent JSON structure. Check the <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono text-sm">code</code> field
          to handle specific error cases programmatically.
        </p>
        <CodeBlock>{`{
  "error": "The requested resource does not exist.",
  "code": "NOT_FOUND"
}`}</CodeBlock>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="px-4 py-3 font-semibold uppercase tracking-wide">HTTP status</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wide">Code</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wide">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ERROR_CODES.map(e => (
                <tr key={e.code} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded font-mono ${
                      e.status.startsWith('4') ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono text-gray-700">{e.code}</code>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 pt-8 pb-4 text-center text-sm text-gray-400">
        CareDoc AI API v1 · For support contact{' '}
        <a href="mailto:support@caredocai.com" className="text-green-700 hover:underline">
          support@caredocai.com
        </a>
      </footer>
    </main>
  )
}
