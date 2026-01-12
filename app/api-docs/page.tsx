'use client'

import { useEffect } from 'react'

export default function APIDocsPage() {
  useEffect(() => {
    // Load Swagger UI scripts from CDN
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.src = src
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
        document.head.appendChild(script)
      })
    }

    const loadCSS = (href: string) => {
      if (document.querySelector(`link[href="${href}"]`)) return
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    }

    // Load CSS first
    loadCSS('https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css')

    // Load scripts in order
    loadScript('https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js')
      .then(() => loadScript('https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js'))
      .then(() => {
        // Initialize Swagger UI
        if ((window as any).SwaggerUIBundle && (window as any).SwaggerUIStandalonePreset) {
          (window as any).SwaggerUIBundle({
            url: '/openapi.yaml',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              (window as any).SwaggerUIBundle.presets.apis,
              (window as any).SwaggerUIStandalonePreset
            ],
            plugins: [
              (window as any).SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: 'StandaloneLayout',
            displayOperationId: false,
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            docExpansion: 'list',
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            tryItOutEnabled: true,
            requestInterceptor: (request: any) => {
              // Add any default headers if needed
              return request
            },
            onComplete: () => {
              console.log('Swagger UI loaded successfully')
            }
          })
        }
      })
      .catch((error) => {
        console.error('Error loading Swagger UI:', error)
      })

    // Cleanup function
    return () => {
      // Cleanup is handled by Next.js on unmount
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            API Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Interactive API documentation for the Marble Inventory System. Explore all available endpoints, request/response schemas, and test API calls directly from this interface.
          </p>
          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
            <a 
              href="/openapi.yaml" 
              download
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Download OpenAPI Spec
            </a>
            <span>•</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div id="swagger-ui" className="swagger-ui-wrap"></div>
        </div>
      </div>
    </div>
  )
}
