import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

const GITHUB_OWNER = 'boraayik3-spec'

export async function createRepositoryAndPush(
  businessName: string,
  files: Record<string, string>
): Promise<{
  repoUrl: string
  repoName: string
  cloneUrl: string
}> {
  // Generate repo name from business name
  const repoName = slugify(businessName) + '-website'

  // Create repository
  let repo
  try {
    repo = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: `Website for ${businessName}`,
      private: false,
      auto_init: true,
    })
  } catch (err) {
    const error = err as { status?: number }
    if (error.status === 422) {
      // Repository might already exist
      repo = await octokit.repos.get({
        owner: GITHUB_OWNER,
        repo: repoName,
      })
    } else {
      throw err
    }
  }

  const cloneUrl = repo.data.clone_url

  // Create files in repository
  for (const [filePath, content] of Object.entries(files)) {
    try {
      await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_OWNER,
        repo: repoName,
        path: filePath,
        message: `feat: add ${filePath}`,
        content: Buffer.from(content).toString('base64'),
      })
    } catch (e) {
      console.error(`Failed to create file ${filePath}:`, e)
      // Continue with other files
    }
  }

  return {
    repoUrl: repo.data.html_url,
    repoName,
    cloneUrl,
  }
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

export async function getRepositoryUrl(businessName: string): Promise<string> {
  const repoName = slugify(businessName) + '-website'
  try {
    const repo = await octokit.repos.get({
      owner: GITHUB_OWNER,
      repo: repoName,
    })
    return repo.data.clone_url
  } catch {
    throw new Error(`Repository ${repoName} not found`)
  }
}
