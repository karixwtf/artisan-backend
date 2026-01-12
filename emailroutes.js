const express = require("express");
const router = express.Router();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/programare", async (req, res) => {
    const { nume, prenume, email, telefon, mesaj } = req.body;

    if (!nume || !prenume || !email || !telefon) {
        return res.status(400).json({ error: "Lipsesc câteva câmpuri obligatorii" });
    }

    try {
        // 1. Email către client
        await resend.emails.send({
            from: "Artisan Stoma <office@romaniatravelguide.ro>",
            to: email,
            subject: "Confirmare programare",
            text: `
Bună ziua, ${nume} ${prenume},

Vă mulțumim pentru solicitarea programării.
Un membru al echipei vă va contacta în cel mai scurt timp.

O zi frumoasă!
`
        });

        // 2. Email către admin
        await resend.emails.send({
            from: "Programări Website <office@romaniatravelguide.ro>",
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
        console.error("Eroare Resend:", err);
        return res.status(500).json({ error: "Eroare la trimiterea emailurilor" });
    }
});

module.exports = router;
