import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

console.log("🧹 Cleaning up duplicate records...\n");

// Get all Başkent records
const { data: all } = await supabase
  .from("businesses")
  .select("id, name, created_at")
  .ilike("name", "%başkent%");

console.log("Found " + all.length + " Başkent records");
all.forEach((b, i) => {
  console.log(`  ${i + 1}. ${b.id.substring(0, 8)}... created at ${b.created_at}`);
});

if (all.length > 1) {
  // Keep the newest, delete older ones
  const sorted = all.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  const toDelete = sorted.slice(1); // All except the newest

  console.log("\n🗑️ Deleting " + toDelete.length + " duplicate(s)...");
  for (const record of toDelete) {
    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", record.id);

    if (error) {
      console.log("❌ Error deleting " + record.id + ": " + error.message);
    } else {
      console.log("✅ Deleted: " + record.id.substring(0, 8));
    }
  }

  console.log("\n✅ Cleanup complete!");
  console.log("Now run fresh-test.mjs again");
} else {
  console.log("No duplicates found");
}

