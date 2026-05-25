import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const email = "contact@baskentnargile.com";

console.log("Testing query with email: " + email + "\n");

// Test 1: Simple select
console.log("Test 1: Simple select all");
const { data: all, error: err1 } = await supabase
  .from("businesses")
  .select("id, name, email");

if (err1) {
  console.log("Error: " + err1.message);
} else {
  console.log("Found " + all.length + " businesses");
  all.forEach((b) => console.log("  - " + b.name + " (" + b.email + ")"));
}

console.log("");

// Test 2: With ilike
console.log("Test 2: ilike email query");
const { data: found, error: err2 } = await supabase
  .from("businesses")
  .select("id, name, email")
  .ilike("email", email);

if (err2) {
  console.log("Error: " + err2.message);
} else {
  console.log("Found: " + found.length);
  if (found.length > 0) console.log("  - " + found[0].name);
}

