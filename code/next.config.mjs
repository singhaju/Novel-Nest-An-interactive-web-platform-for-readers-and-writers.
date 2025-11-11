/** @type {import('next').NextConfig} */
const nextConfig = {
  // `eslint` option in `next.config` is no longer supported by recent Next.js
  // versions — remove it to avoid warnings. If you must ignore linting during
  // CI/builds, configure ESLint separately (or use `next lint`).
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Set turbopack.root to ensure Turbopack uses this folder as the workspace
  // root when Next detects multiple lockfiles in parent folders.
  turbopack: {
    root: './',
  },
}

export default nextConfig
