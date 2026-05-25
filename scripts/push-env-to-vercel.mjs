import { readFileSync } from 'node:fs'

const projectInfo = JSON.parse(readFileSync('.vercel/project.json', 'utf8'))
const envText = readFileSync('.env.local', 'utf8')

const token = (envText
  .split('\n')
  .find((l) => l.startsWith('VERCEL_TOKEN=')) ?? '')
  .replace('VERCEL_TOKEN=', '')
  .trim()

if (!token) {
  console.error('VERCEL_TOKEN not found in .env.local')
  process.exit(1)
}

const entries = envText
  .split('\n')
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => {
    const i = l.indexOf('=')
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  })
  .filter(([k, v]) => k && v) // skip empty values

const SKIP_KEYS = new Set(['VERCEL_TOKEN']) // don't push the deploy token itself

const base = `https://api.vercel.com/v10/projects/${projectInfo.projectId}/env?teamId=${projectInfo.orgId}`

async function listExisting() {
  const r = await fetch(base, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) throw new Error(`List failed: ${r.status} ${await r.text()}`)
  const data = await r.json()
  return new Map(data.envs.map((e) => [e.key, e.id]))
}

async function deleteEnv(id) {
  const r = await fetch(`https://api.vercel.com/v9/projects/${projectInfo.projectId}/env/${id}?teamId=${projectInfo.orgId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) throw new Error(`Delete ${id} failed: ${r.status} ${await r.text()}`)
}

async function createEnv(key, value, retried = false) {
  const r = await fetch(base, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      value,
      type: key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted',
      target: ['production', 'preview', 'development'],
    }),
  })
  if (r.ok) return
  const text = await r.text()
  if (r.status === 400 && text.includes('ENV_CONFLICT') && !retried) {
    const fresh = await listExisting()
    if (fresh.has(key)) {
      await deleteEnv(fresh.get(key))
      return createEnv(key, value, true)
    }
  }
  throw new Error(`Create ${key} failed: ${r.status} ${text}`)
}

const existing = await listExisting()
console.log(`Existing env vars on project: ${existing.size}`)

for (const [key, value] of entries) {
  if (SKIP_KEYS.has(key)) {
    console.log(`SKIP ${key}`)
    continue
  }
  if (existing.has(key)) {
    await deleteEnv(existing.get(key))
  }
  await createEnv(key, value)
  console.log(`SET  ${key}`)
}

console.log('Done.')
