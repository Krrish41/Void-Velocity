const https = require("https");

const token = "8877014914:AAHOIhBFXhqGFBMCKJ8XBu4P0n_V_kAjm8c";
const url = process.argv[2];

if (!url) {
  console.error("Please provide your HTTPS tunnel URL as an argument.");
  console.error("Example: node scripts/set-menu-button.js https://your-tunnel-url.ngrok-free.app");
  process.exit(1);
}

// Ensure the URL starts with https://
let targetUrl = url.trim();
if (!targetUrl.startsWith("https://")) {
  console.error("Error: Telegram Web Apps require an HTTPS URL (starts with https://).");
  process.exit(1);
}

const data = JSON.stringify({
  menu_button: {
    type: "web_app",
    text: "Play Game",
    web_app: {
      url: targetUrl
    }
  }
});

console.log(`Setting Menu Button for bot to point to: ${targetUrl}...`);

const req = https.request(
  `https://api.telegram.org/bot${token}/setChatMenuButton`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data)
    }
  },
  (res) => {
    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });
    res.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        if (parsed.ok) {
          console.log("\n✅ Success! The Telegram menu button has been updated.");
          console.log("Open @voidvelocity_bot in Telegram on your phone or laptop and click the 'Play Game' button in the chat header/input area.");
        } else {
          console.error("\n❌ Telegram API Error:", parsed.description);
        }
      } catch (e) {
        console.error("Failed to parse API response:", body);
      }
    });
  }
);

req.on("error", (err) => {
  console.error("Request failed:", err.message);
});

req.write(data);
req.end();
