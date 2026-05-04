import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
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

      // 1. Send Email Notification
      const emailUser = process.env.EMAIL_SERVER_USER;
      const emailPass = process.env.EMAIL_SERVER_PASSWORD;
      const emailHost = process.env.EMAIL_SERVER_HOST || "smtp.gmail.com";
      const emailPort = parseInt(process.env.EMAIL_SERVER_PORT || "465");
      const isSecure = process.env.EMAIL_SERVER_SECURE === "true" || emailPort === 465;

      if (!emailUser || !emailPass) {
        console.error("Email configuration MISSING. Please set EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD in Settings.");
        // We still return 200 for the message saving in DB, but acknowledge the error
        return res.status(200).json({ 
          success: true, 
          warning: "Message saved to database, but email notification failed because credentials are not configured in Settings." 
        });
      }

      const transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: isSecure,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      const mailOptions = {
        from: `"Portfolio Contact" <${emailUser}>`,
        to: "mensahayford777@gmail.com",
        subject: `New Message: ${subject}`,
        text: `You have a new message from your portfolio contact form.\n\n` +
              `Name: ${name}\n` +
              `Email: ${email}\n` +
              `Subject: ${subject}\n\n` +
              `Message:\n${message}`,
        html: `<div style="font-family: sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: auto;">
                <h2 style="color: #4f46e5; margin-bottom: 20px;">New Portfolio Contact</h2>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                  <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
                </div>
                <p><strong>Message Content:</strong></p>
                <div style="background: #ffffff; padding: 15px; border: 1px solid #f1f5f9; border-radius: 8px; font-style: italic;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>`,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Email successfully sent to mensahayford777@gmail.com from ${emailUser}`);
      } catch (mailError) {
        console.error("Nodemailer Error:", mailError);
        return res.status(200).json({ 
          success: true, 
          error: "Message saved, but email delivery failed. Check your SMTP settings and App Password.",
          details: mailError instanceof Error ? mailError.message : String(mailError)
        });
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
