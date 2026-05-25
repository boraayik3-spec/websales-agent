import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// Step 1: Create business
console.log("📝 Step 1: Creating Başkent Lounge Nargile...");
const { data: business, error: bizErr } = await supabase
  .from("businesses")
  .insert({
    name: "Başkent Lounge Nargile",
    type: "salon",
    email: "contact@baskentnargile.com",
    website: null,
    website_status: null,
  })
  .select()
  .single();

if (bizErr) {
  console.error("Error:", bizErr.message);
  process.exit(1);
}
console.log("✅ Business created: " + business.id.substring(0, 8));

// Step 2: Create outreach
console.log("\n📝 Step 2: Creating outreach record...");
const { data: outreach } = await supabase
  .from("outreach")
  .insert({
    business_id: business.id,
    stage: "email_1_sent",
    email_1_sent_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  })
  .select()
  .single();
console.log("✅ Outreach created: " + outreach.id.substring(0, 8));

// Step 3: Send webhook
console.log("\n📝 Step 3: Sending interested webhook...");
const event = {
  type: "message.created",
  data: {
    object: {
      id: "msg-" + Date.now(),
      from: [{ email: business.email, name: business.name }],
      subject: "Re: Website Offer",
      body: "Evet, web sitemiz için yazılım yapmanız harika olur. Hemen başlayabilir misiniz?",
    },
  },
};

const rawBody = JSON.stringify(event);
const signature = crypto
  .createHmac("sha256", process.env.NYLAS_WEBHOOK_SECRET)
  .update(rawBody)
  .digest("hex");

const webhookRes = await fetch("https://websales-agent.vercel.app/api/webhooks/nylas", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-nylas-signature": signature,
  },
  body: rawBody,
});

const status = webhookRes.status;
const text = await webhookRes.text();

console.log("✅ Webhook sent: " + status);
console.log("   Response: " + text);

console.log("\n🎯 TEST STARTED!");
console.log("Business ID: " + business.id);
console.log("Business: " + business.name);
console.log("\n⏳ Website generation triggered!");
console.log("Check status in ~3 minutes with:");
console.log("   node scripts/check-status.mjs");

