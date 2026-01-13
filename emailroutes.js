const express = require("express");
const router = express.Router();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/programare", async (req, res) => {
    const { nume, prenume, email, telefon, mesaj } = req.body;

    if (!nume || !prenume || !email || !telefon) {
        return res.status(400).json({ error: "Lipsesc câteva câmpuri obligatorii" });
    }

    // ---------- HTML EMAIL TEMPLATE (CLIENT) ----------
    const clientHTML = `
    <div style="font-family: Arial, sans-serif; background:#f6f7f9; padding:30px;">
        <div style="max-width:600px; margin:0 auto; background:white; padding:25px; border-radius:12px; box-shadow:0 3px 10px rgba(0,0,0,0.05);">
            
            <h2 style="color:#2a3b8f; margin-top:0;">Confirmare programare – Artisan Stoma</h2>

            <p style="font-size:16px; color:#333;">
                Bună ziua, <strong>${nume} ${prenume}</strong>,
            </p>

            <p style="font-size:15px; color:#444;">
                Vă mulțumim pentru solicitarea trimisă! Cererea dumneavoastră de programare a fost înregistrată cu succes.
                Un membru al echipei noastre vă va contacta în cel mai scurt timp pentru a stabili data și ora programării.
            </p>

            <div style="margin-top:20px; padding:15px; background:#eef2ff; border-left:4px solid #2a3b8f; border-radius:8px;">
                <p style="margin:0; font-size:15px;">
                    <strong>Detalii programare trimise:</strong><br>
                    • Nume: ${nume} ${prenume}<br>
                    • Email: ${email}<br>
                    • Telefon: ${telefon}<br>
                    • Mesaj: ${mesaj || "–"}
                </p>
            </div>

            <p style="margin-top:30px; font-size:14px; color:#666;">
                Cu stimă,<br>
                <strong>Echipa Artisan Stoma</strong>
            </p>

        </div>
    </div>
    `;

    // ---------- HTML EMAIL (ADMIN) ----------
    const adminHTML = `
    <div style="font-family: Arial, sans-serif; background:#ffffff; padding:20px;">
        <h2 style="color:#2a3b8f;">Programare nouă – Website</h2>

        <p style="font-size:15px; color:#333;">A fost trimisă o programare nouă:</p>

        <div style="padding:15px; background:#f2f4f7; border-radius:10px;">
            <p style="margin:0; font-size:15px;">
                <strong>Nume:</strong> ${nume} ${prenume}<br>
                <strong>Email:</strong> ${email}<br>
                <strong>Telefon:</strong> ${telefon}<br>
                <strong>Mesaj:</strong> ${mesaj || "–"}
            </p>
        </div>

        <p style="margin-top:25px; font-size:13px; color:#777;">
            Trimiteți-i clientului un răspuns cât mai rapid.
        </p>
    </div>
    `;

    try {
        // ----------- EMAIL CLIENT -----------
        await resend.emails.send({
            from: "Artisan Stoma <office@romaniatravelguide.ro>",
            to: email,
            subject: "Confirmare programare – Artisan Stoma",
            html: clientHTML,
            text: `Bună ziua, ${nume} ${prenume}, Vă mulțumim pentru solicitare!`
        });

        // ----------- EMAIL ADMIN -----------
        await resend.emails.send({
            from: "Programări Website <office@romaniatravelguide.ro>",
            to: process.env.ADMIN_EMAIL,
            subject: "Programare nouă – Website",
            html: adminHTML,
            text: `
Programare nouă:
Nume: ${nume} ${prenume}
Email: ${email}
Telefon: ${telefon}
Mesaj: ${mesaj || "-"}
`
        });

        return res.json({ success: true });

    } catch (err) {
        console.error("Eroare Resend:", err);
        return res.status(500).json({ error: "Eroare la trimiterea emailurilor" });
    }
});

module.exports = router;
