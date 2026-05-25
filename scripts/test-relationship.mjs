import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const email = "contact@baskentnargile.com";

console.log("Testing query WITH relationship...\n");

const { data: business, error: err } = await supabase
  .from("businesses")
  .select("id, name, type, website, website_status, email, outreach(id, stage, reply_at, email_1_sent_at)")
  .ilike("email", email)
  .maybeSingle();

if (err) {
  console.log("❌ ERROR: " + err.message);
  console.log("Code: " + err.code);
} else {
  console.log("✅ Success!");
  console.log("Business: " + business.name);
  console.log("Outreach records: " + business.outreach.length);
  if (business.outreach.length > 0) {
    console.log("  Stage: " + business.outreach[0].stage);
  }
}

