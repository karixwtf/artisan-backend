const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

// ---------- LOGARE VARIABILE DE MEDIU ----------
console.log("=== SMTP CONFIG ===");
console.log("HOST:", process.env.SMTP_HOST);
console.log("PORT:", process.env.SMTP_PORT);
console.log("SECURE:", process.env.SMTP_SECURE);
console.log("USER:", process.env.SMTP_USER);
console.log("PASS LENGTH:", process.env.SMTP_PASS ? process.env.SMTP_PASS.length : "NO PASS");
console.log("====================");


// ---------- CONFIGURARE TRANSPORT ----------
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// VERIFICARE SMTP
transporter.verify((err, success) => {
    if (err) {
        console.error("❌ SMTP VERIFY ERROR:", err);
    } else {
        console.log("✅ SMTP READY");
    }
});


// ---------- RUTA TRIMITERE EMAIL ----------
router.post("/programare", async (req, res) => {
    console.log("📩 Cerere primită /programare:", req.body);

    const { nume, prenume, email, telefon, mesaj } = req.body;

    try {
        let clientEmail = await transporter.sendMail({
            from: `"Artisan Stoma" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Confirmare programare",
            text: `Bună ziua, ${nume} ${prenume}, Mulțumim pentru solicitare!`
        });

        console.log("📤 Email către client trimis:", clientEmail);

        let adminEmail = await transporter.sendMail({
            from: `"Programări Website" <${process.env.SMTP_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: "Programare nouă – Website",
            text: `Date programare: ${JSON.stringify(req.body, null, 2)}`
        });

        console.log("📤 Email către admin trimis:", adminEmail);

        res.json({ success: true });

    } catch (err) {
        console.error("❌ EROARE EMAIL:", err);
        res.status(500).json({ error: "Eroare la trimiterea emailurilor" });
    }
});

module.exports = router;
