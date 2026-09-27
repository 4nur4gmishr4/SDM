import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Read env for storage upload
const baseDir = (import.meta as any).dirname || process.cwd()
const envPath = path.resolve(baseDir, '.env')
let supabaseUrl = ''
let serviceRoleKey = ''
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [k, ...v] = trimmed.split('=')
    const val = v.join('=').trim().replace(/^['"]|['"]$/g, '')
    if (k === 'VITE_SUPABASE_URL') supabaseUrl = val
    if (k === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = val
  }
}

function uploadApiPlugin(): Plugin {
  return {
    name: 'sdm-upload-api',
    configureServer(server) {
      server.middlewares.use('/api/upload', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { fileName, fileData, mimeType } = JSON.parse(body)
            if (!fileData) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing fileData' }))
              return
            }

            const buffer = Buffer.from(fileData, 'base64')
            const ext = path.extname(fileName || '') || '.jpg'
            const base = path.basename(fileName || 'image', ext).replace(/[^a-zA-Z0-9_-]/g, '_')
            const cleanName = `${Date.now()}_${base}${ext}`

            // 1. Save local copy in public/uploads/
            const uploadsDir = path.resolve(baseDir, 'public/uploads')
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
            fs.writeFileSync(path.join(uploadsDir, cleanName), buffer)
            const localUrl = `/uploads/${cleanName}`

            // 2. Upload to Supabase Storage store-media bucket if service role key available
            let finalUrl = localUrl
            if (supabaseUrl && serviceRoleKey) {
              try {
                const sb = createClient(supabaseUrl, serviceRoleKey)
                const { data: uploadData, error: uploadErr } = await sb.storage
                  .from('store-media')
                  .upload(cleanName, buffer, {
                    contentType: mimeType || 'image/jpeg',
                    upsert: true,
                  })

                if (!uploadErr && uploadData?.path) {
                  const { data: pubData } = sb.storage.from('store-media').getPublicUrl(cleanName)
                  if (pubData?.publicUrl) {
                    finalUrl = pubData.publicUrl
                  }
                }
              } catch (se) {
                console.warn('Supabase storage upload error in middleware, fallback to local URL:', se)
              }
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, url: finalUrl }))
          } catch (err: any) {
            console.error('Upload API error:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message || 'Upload failed' }))
          }
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    uploadApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Sai Darshan Mart',
        short_name: 'SDM',
        description: 'Your local supermarket in Jabalpur',
        theme_color: '#1E8E3E',
        background_color: '#F7FAF5',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/xlsx')) return 'vendor-xlsx';
          if (id.includes('node_modules/leaflet')) return 'vendor-leaflet';
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
        }
      }
    }
  }
})
