import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const github_token = process.env.GITHUB_TOKEN;
const vercel_token = process.env.VERCEL_TOKEN;

console.log("🔍 Checking Başkent Lounge Nargile website status...\n");

// 1. Get business by email (more reliable)
console.log("1️⃣ Supabase Database Check");
console.log("=====================================");
const { data: business } = await supabase
  .from("businesses")
  .select("id, name, website_url, website_status, website_generated_at")
  .eq("email", "contact@baskentnargile.com")
  .single();

if (business) {
  console.log("✅ Business found: " + business.name);
  console.log("   ID: " + business.id.substring(0, 8) + "...");
  console.log("   Website URL: " + (business.website_url || "⏳ Not set"));
  console.log("   Status: " + (business.website_status || "pending"));
  console.log("   Generated: " + (business.website_generated_at || "Not yet"));
} else {
  console.log("❌ Business not found");
}
console.log("");

// 2. Check GitHub
console.log("2️⃣ GitHub Repository Check");
console.log("=====================================");
const gitRes = await fetch(
  "https://api.github.com/users/boraayik3-spec/repos?per_page=50",
  { headers: { Authorization: `token ${github_token}` } }
);
const repos = await gitRes.json();

const baskeRepo = repos.find((r) => r.name.includes("baskentnargile") || r.name.includes("baske-nargile"));

if (baskeRepo) {
  console.log("✅ Repository found!");
  console.log("   Name: " + baskeRepo.name);
  console.log("   URL: " + baskeRepo.html_url);
  console.log("   Created: " + new Date(baskeRepo.created_at).toLocaleString());
} else {
  console.log("⏳ No baskentnargile repo found yet");
  console.log("   (Checking recent repos...)");
  repos.slice(0, 5).forEach((r) => {
    console.log("   - " + r.name);
  });
}
console.log("");

// 3. Check Vercel
console.log("3️⃣ Vercel Deployment Check");
console.log("=====================================");
const vercelRes = await fetch("https://api.vercel.com/v6/deployments?limit=50", {
  headers: { Authorization: `Bearer ${vercel_token}` },
});
const deployData = await vercelRes.json();
const deployments = deployData.deployments || [];

const baskeDeployment = deployments.find((d) => 
  d.name.includes("baskentnargile") || d.name.includes("baske-nargile")
);

if (baskeDeployment) {
  console.log("✅ Deployment found!");
  console.log("   Name: " + baskeDeployment.name);
  console.log("   URL: https://" + baskeDeployment.url);
  console.log("   State: " + baskeDeployment.state);
  console.log("   Created: " + new Date(baskeDeployment.created).toLocaleString());

  if (baskeDeployment.state === "READY") {
    console.log("   🎉 WEBSITE IS LIVE!");
  }
} else {
  console.log("⏳ No baskentnargile deployment found yet");
  console.log("   (Checking recent deployments...)");
  deployments.slice(0, 5).forEach((d) => {
    console.log("   - " + d.name + " (" + d.state + ")");
  });
}
console.log("");

// 4. Summary
console.log("📊 FINAL STATUS");
console.log("=====================================");
if (business && business.website_url && business.website_status === "deployed") {
  console.log("🎉🎉🎉 WEBSITE SUCCESSFULLY DEPLOYED! 🎉🎉🎉");
  console.log("URL: " + business.website_url);
  console.log("Visit: " + business.website_url);
} else if (baskeRepo && baskeDeployment) {
  console.log("⏳ Website is building...");
  console.log("   GitHub: ✅ Repo created (" + baskeRepo.name + ")");
  console.log("   Vercel: " + baskeDeployment.state + " (" + baskeDeployment.url + ")");
  console.log("   Expected READY in ~1 minute...");
} else if (baskeRepo) {
  console.log("⏳ Code pushed to GitHub!");
  console.log("   Waiting for Vercel deployment...");
} else {
  console.log("⏳ Website generation in progress...");
  console.log("   Inngest is processing the job");
}

