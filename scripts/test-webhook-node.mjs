import crypto from "crypto";

const secret = process.env.NYLAS_WEBHOOK_SECRET;
const baseUrl = "https://websales-agent.vercel.app";

const event = {
  type: "message.created",
  data: {
    object: {
      id: "msg-123",
      from: [{ email: "info@karakol-nargile.com", name: "Karakol Nargile" }],
      subject: "Re: Website Offer",
      body: "Evet, web sitemiz için yazılım yapmanız harika olur. Detaylı bilgi alabilir miyim?",
    },
  },
};

const rawBody = JSON.stringify(event);
const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

console.log("📤 Sending webhook test...");
console.log("Business: Karakol Nargile Lounge");
console.log("Email: info@karakol-nargile.com");
console.log("Classification: interested");
console.log("");

const response = await fetch(`${baseUrl}/api/webhooks/nylas`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-nylas-signature": signature,
  },
  body: rawBody,
});

console.log(`Response Status: ${response.status}`);
const text = await response.text();
console.log(`Response: ${text}`);

if (response.status === 200) {
  console.log("");
  console.log("✅ Webhook triggered successfully!");
  console.log("🚀 Website generation in progress...");
  console.log("");
  console.log("Sistem şimdi:");
  console.log("1. Claude Sonnet ile Next.js sitesi üretecek");
  console.log("2. GitHub'a repo oluşturup push edecek");
  console.log("3. Vercel'e deploy edecek");
  console.log("");
  console.log("⏳ 1-2 dakika bekliyoruz...");
}
