import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const github_token = process.env.GITHUB_TOKEN;
const vercel_token = process.env.VERCEL_TOKEN;

console.log("🔍 Checking Başkent Lounge Nargile website status...\n");

// 1. Check Supabase
console.log("💾 Checking Supabase database...");
const { data: business } = await supabase
  .from("businesses")
  .select("*")
  .ilike("name", "%baskentnargile%")
  .single();

if (!business) {
  console.log("⏳ Business record not found");
  process.exit(1);
}

console.log("✅ Business found: " + business.name);
console.log("   Website URL: " + (business.website_url || "⏳ Not set yet"));
console.log("   Website Status: " + (business.website_status || "pending"));
console.log("");

// 2. Check outreach stage
const { data: outreach } = await supabase
  .from("outreach")
  .select("*")
  .eq("business_id", business.id)
  .single();

if (outreach) {
  console.log("📋 Outreach Stage:");
  console.log("   Current Stage: " + outreach.stage);
  console.log("");
}

// 3. Check GitHub
console.log("📦 Checking GitHub repos...");
const gitRes = await fetch(
  "https://api.github.com/users/boraayik3-spec/repos?per_page=100",
  { headers: { Authorization: `token ${github_token}` } }
);
const repos = await gitRes.json();

const baskeRepo = repos.find(
  (r) =>
    r.name.includes("basken") ||
    r.name.includes("nargile") ||
    r.name.includes("lounge")
);

if (baskeRepo) {
  console.log("✅ GitHub repo found!");
  console.log("   Name: " + baskeRepo.name);
  console.log("   URL: " + baskeRepo.html_url);
} else {
  console.log("⏳ No baskentnargile repo found yet");
}
console.log("");

// 4. Check Vercel
console.log("🚀 Checking Vercel deployments...");
const vercelRes = await fetch("https://api.vercel.com/v6/deployments?limit=50", {
  headers: { Authorization: `Bearer ${vercel_token}` },
});
const deployData = await vercelRes.json();
const deployments = deployData.deployments || [];

const baskeDeployment = deployments.find(
  (d) =>
    d.name.includes("basken") ||
    d.name.includes("nargile") ||
    d.name.includes("lounge")
);

if (baskeDeployment) {
  console.log("✅ Vercel deployment found!");
  console.log("   Name: " + baskeDeployment.name);
  console.log("   URL: https://" + baskeDeployment.url);
  console.log("   State: " + baskeDeployment.state);

  if (baskeDeployment.state === "READY") {
    console.log("   🎉 Website is LIVE!");
  }
} else {
  console.log("⏳ No baskentnargile deployment found yet");
}
console.log("");

// Summary
console.log("📊 SUMMARY:");
if (business.website_url && business.website_status === "deployed") {
  console.log("✅ WEBSITE SUCCESSFULLY DEPLOYED!");
  console.log("   URL: " + business.website_url);
} else if (business.website_url) {
  console.log("⏳ Website URL is set but still deploying...");
  console.log("   URL: " + business.website_url);
} else {
  console.log("⏳ Website generation in progress...");
  console.log("   Outreach Stage: " + (outreach?.stage || "unknown"));
}
