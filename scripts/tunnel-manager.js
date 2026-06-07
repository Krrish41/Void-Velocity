const { spawn } = require("child_process");
const https = require("https");

const token = "8877014914:AAHOIhBFXhqGFBMCKJ8XBu4P0n_V_kAjm8c";
let currentUrl = null;
let pingInterval = null;
let sshProcess = null;

function startTunnel() {
  console.log("Starting localhost.run SSH tunnel...");
  
  sshProcess = spawn("ssh", [
    "-o", "StrictHostKeyChecking=no",
    "-R", "80:localhost:4173",
    "nokey@localhost.run"
  ]);

  sshProcess.stdout.on("data", (data) => {
    const output = data.toString();
    console.log("[SSH Output]:", output.trim());
    
    // Look for URL patterns like https://xxx.lhr.life or https://xxx.localhost.run
    const urlMatch = output.match(/https:\/\/[a-zA-Z0-9.-]+\.(lhr\.life|localhost\.run)/);
    if (urlMatch) {
      const newUrl = urlMatch[0];
      if (newUrl !== currentUrl) {
        console.log(`\nNew tunnel URL detected: ${newUrl}`);
        currentUrl = newUrl;
        updateTelegramMenuButton(newUrl);
        startPinger(newUrl);
      }
    }
  });

  sshProcess.stderr.on("data", (data) => {
    console.log("[SSH Error/Info]:", data.toString().trim());
  });

  sshProcess.on("close", (code) => {
    console.log(`SSH tunnel process closed with code ${code}. Reconnecting in 5 seconds...`);
    stopPinger();
    setTimeout(startTunnel, 5000);
  });
}

function updateTelegramMenuButton(url) {
  const data = JSON.stringify({
    menu_button: {
      type: "web_app",
      text: "Play Game",
      web_app: {
        url: url
      }
    }
  });

  console.log(`Updating Telegram bot menu button to point to: ${url}...`);

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
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.ok) {
            console.log("✅ Bot menu button successfully updated in Telegram!");
          } else {
            console.error("❌ Failed to update Telegram bot:", parsed.description);
          }
        } catch (e) {
          console.error("Failed to parse Telegram API response:", body);
        }
      });
    }
  );

  req.on("error", (err) => {
    console.error("Failed to make request to Telegram API:", err.message);
  });

  req.write(data);
  req.end();
}

function startPinger(url) {
  stopPinger();
  console.log(`Starting keep-alive ping for: ${url}`);
  
  // Ping the server every 20 seconds to keep the tunnel open and active
  pingInterval = setInterval(() => {
    if (!currentUrl) return;
    
    https.get(currentUrl, (res) => {
      console.log(`[Ping] Keep-alive request sent. Status: ${res.statusCode}`);
    }).on("error", (err) => {
      console.error("[Ping] Keep-alive request failed:", err.message);
    });
  }, 20000);
}

function stopPinger() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

// Clean up processes on exit
process.on("SIGINT", () => {
  console.log("Shutting down tunnel manager...");
  stopPinger();
  if (sshProcess) {
    sshProcess.kill();
  }
  process.exit();
});

// Start the tunnel manager
startTunnel();
