const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

// Pasul 1: configurăm transportul SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

transporter.verify((err, success) => {
    if (err) {
        console.error("SMTP ERROR:", err);
    } else {
        console.log("SMTP READY");
    }
});


// Pasul 2: ruta pentru trimiterea emailurilor
router.post("/programare", async (req, res) => {
    const { nume, prenume, email, telefon, mesaj } = req.body;

    if (!nume || !prenume || !email || !telefon) {
        return res.status(400).json({ error: "Lipsesc câteva câmpuri obligatorii" });
    }

    try {
        // Email către client
        await transporter.sendMail({
            from: `"Artisan Stoma" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Confirmare programare",
            text: `
Bună ziua, ${nume} ${prenume},

Vă mulțumim pentru solicitarea programării.
Un membru al echipei vă va contacta în cel mai scurt timp.

O zi frumoasă!
`
        });

        // Email către cabinet
        await transporter.sendMail({
            from: `"Programări Website" <${process.env.SMTP_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: "Programare nouă – Website",
            text: `
A fost trimisă o programare nouă:

Nume: ${nume}
Prenume: ${prenume}
Email: ${email}
Telefon: ${telefon}

Mesaj:
${mesaj || "–"}
`
        });

        return res.json({ success: true });
    } catch (err) {
        console.error("Eroare email:", err);
        return res.status(500).json({ error: "Eroare la trimiterea emailurilor" });
    }
});

module.exports = router;
