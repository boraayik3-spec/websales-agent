import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const GITHUB_OWNER = "boraayik3-spec";

console.log("Testing GitHub API...\n");

// Test: Can we create a repo?
console.log("Test: Checking GitHub access...");

try {
  const { data: repos } = await octokit.repos.listForAuthenticatedUser();
  console.log("✅ GitHub API working!");
  console.log("   Found " + repos.length + " repos");
  console.log("   Recent repos:");
  repos.slice(0, 3).forEach((r) => {
    console.log("     - " + r.name);
  });
} catch (err) {
  console.log("❌ GitHub API Error: " + err.message);
}
