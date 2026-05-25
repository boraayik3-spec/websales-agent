const VERCEL_API_BASE = 'https://api.vercel.com'
const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

async function vercelRequest(endpoint: string, options: RequestInit = {}) {
  const headers = {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(`${VERCEL_API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Vercel API error (${response.status}): ${error}`)
  }

  return response.json()
}

interface VercelProject {
  id: string
  name: string
  accountId: string
}

interface VercelDeployment {
  uid: string
  url: string
  name: string
  state: 'READY' | 'BUILDING' | 'ERROR' | 'QUEUED'
}

export async function createVercelProject(projectName: string): Promise<VercelProject> {
  const endpoint = VERCEL_TEAM_ID ? `/v1/projects?teamId=${VERCEL_TEAM_ID}` : '/v1/projects'

  const project = await vercelRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      name: projectName,
      framework: 'nextjs',
    }),
  })

  return project
}

export async function linkGitHubRepository(
  projectId: string,
  repoUrl: string
): Promise<{ connected: boolean }> {
  const [owner, repo] = repoUrl.replace('https://github.com/', '').replace('.git', '').split('/')

  const endpoint = VERCEL_TEAM_ID ? `/v9/projects/${projectId}?teamId=${VERCEL_TEAM_ID}` : `/v9/projects/${projectId}`

  const result = await vercelRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify({
      gitRepository: {
        type: 'github',
        repo,
        owner,
      },
    }),
  })

  return { connected: !!result.gitRepository }
}

export async function createVercelDomain(
  projectId: string,
  subdomain: string,
  rootDomain: string = 'siterise.space'
): Promise<{ domain: string; verified: boolean }> {
  const fullDomain = `${subdomain}.${rootDomain}`
  const endpoint = VERCEL_TEAM_ID ? `/v10/projects/${projectId}/domains?teamId=${VERCEL_TEAM_ID}` : `/v10/projects/${projectId}/domains`

  const result = await vercelRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      name: fullDomain,
    }),
  })

  return {
    domain: result.name,
    verified: result.verified,
  }
}

export async function waitForDeployment(
  projectId: string,
  maxWaitMs: number = 300000
): Promise<VercelDeployment | null> {
  const startTime = Date.now()
  const pollInterval = 5000

  while (Date.now() - startTime < maxWaitMs) {
    const endpoint = VERCEL_TEAM_ID ? `/v6/deployments?projectId=${projectId}&teamId=${VERCEL_TEAM_ID}` : `/v6/deployments?projectId=${projectId}`

    const result = await vercelRequest(endpoint)
    const deployments = result.deployments as VercelDeployment[]

    if (deployments.length > 0) {
      const latest = deployments[0]
      if (latest.state === 'READY') {
        return latest
      }
      if (latest.state === 'ERROR') {
        throw new Error(`Deployment failed: ${latest.name}`)
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  return null
}

export async function deployToVercel(
  businessName: string,
  repoUrl: string,
  businessType: string
): Promise<{
  deploymentUrl: string
  projectId: string
  projectName: string
  domainUrl: string
}> {
  // Sanitize project name
  const projectName = businessName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 28) + '-web'
  const subdomain = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)

  // Create Vercel project
  const project = await createVercelProject(projectName)

  // Link GitHub repository
  await linkGitHubRepository(project.id, repoUrl)

  // Create subdomain
  const domain = await createVercelDomain(project.id, subdomain)

  // Wait for deployment to complete
  const deployment = await waitForDeployment(project.id)

  if (!deployment) {
    throw new Error('Deployment did not complete within timeout')
  }

  return {
    deploymentUrl: `https://${deployment.url}`,
    projectId: project.id,
    projectName: project.name,
    domainUrl: `https://${domain.domain}`,
  }
}
