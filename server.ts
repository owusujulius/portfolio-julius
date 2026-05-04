import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/messages", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // 1. Send Telegram Notification
      const tgToken = process.env.TELEGRAM_BOT_TOKEN;
      const tgChatId = process.env.TELEGRAM_CHAT_ID;

      if (tgToken && tgChatId) {
        try {
          // Use HTML parse mode for better reliability with user-generated text
          const tgText = `<b>📬 New Contact Message</b>\n\n` +
                         `<b>From:</b> ${name}\n` +
                         `<b>Email:</b> ${email}\n` +
                         `<b>Subject:</b> ${subject}\n\n` +
                         `<b>Message:</b>\n${message}`;
          
          const response = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: tgChatId,
              text: tgText,
              parse_mode: 'HTML'
            })
          });

          const result = await response.json();
          if (!result.ok) {
            throw new Error(result.description || "Telegram API error");
          }
          console.log("Telegram notification sent successfully.");
        } catch (tgError) {
          console.error("Telegram Notification Error:", tgError);
          return res.status(200).json({ 
            success: true, 
            warning: "Message saved, but Telegram failed. Error: " + (tgError instanceof Error ? tgError.message : String(tgError))
          });
        }
      } else {
        console.warn("Telegram configuration MISSING. Ensure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set in Settings.");
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
