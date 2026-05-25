import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// Get the Başkent business
const { data: business } = await supabase
  .from("businesses")
  .select("id, email")
  .ilike("name", "%başkent%")
  .single();

console.log("📤 Re-triggering webhook for: " + business.email + "\n");

const event = {
  type: "message.created",
  data: {
    object: {
      id: "msg-" + Date.now(),
      from: [{ email: business.email }],
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

console.log("Webhook Status: " + status);
console.log("Response: " + text);

if (status === 200) {
  console.log("\n✅ SUCCESS!");
  console.log("🚀 Website generation TRIGGERED!");
  console.log("\n⏳ Waiting for GitHub & Vercel deployment...");
  console.log("Check status in 2-3 minutes with: node scripts/check-status.mjs");
}

