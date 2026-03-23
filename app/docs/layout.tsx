export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-green-700">CareDoc AI</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">API Reference</span>
        </div>
        <a href="https://app.caredocai.com" className="text-sm text-green-700 hover:underline">
          Back to app →
        </a>
      </nav>
      {children}
    </div>
  )
}
