const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// ---------- SMTP TRANSPORT ----------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: SMTP_PORT === 465,
  requireTLS: SMTP_PORT === 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // ✅ acceptă self-signed
    servername: process.env.SMTP_HOST,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});




// Curăță spații / newline-uri care pot strica layout-ul în email
const clean = (v) => String(v ?? "").replace(/\r?\n/g, " ").trim();

router.post("/programare", async (req, res) => {
  const { nume, prenume, email, telefon, mesaj } = req.body;

  if (!nume || !prenume || !email || !telefon) {
    return res.status(400).json({ error: "Lipsesc câteva câmpuri obligatorii" });
  }

  // ---------- NORMALIZARE INPUT ----------
  const N = clean(nume);
  const P = clean(prenume);
  const E = clean(email);
  const T = clean(telefon);
  const M = clean(mesaj);

  // link tel: (fără spații)
  const telefonLink = T.replace(/\s+/g, "");

  // ---------- HTML EMAIL (CLIENT) ----------
  const clientHTML = `
  <div style="font-family: Arial, sans-serif; background:#f6f7f9; padding:30px;">
    <div style="max-width:600px; margin:0 auto; background:white; padding:25px; border-radius:12px; box-shadow:0 3px 10px rgba(0,0,0,0.05);">
      <div style="text-align: center;">
        <img src="https://romaniatravelguide.ro/logocabinet.png" alt="Artisan Stoma"
             style="width: 160px; margin-bottom: 20px;" />
      </div>

      <h2 style="color:#2a3b8f; margin-top:0;">Confirmare programare – Artisan Stoma</h2>

      <p style="font-size:16px; color:#333; margin:0 0 12px 0;">
        Bună ziua, <strong>${N} ${P}</strong>,
      </p>

      <p style="font-size:15px; color:#444; margin:0 0 16px 0;">
        Vă mulțumim pentru solicitarea trimisă! Cererea dumneavoastră de programare a fost înregistrată cu succes.
        Un membru al echipei noastre vă va contacta în cel mai scurt timp pentru a stabili data și ora programării.
      </p>

      <div style="margin-top:20px; padding:15px; background:#eef2ff; border-left:4px solid #2a3b8f; border-radius:8px;">
        <p style="margin:0; font-size:15px; color:#222; line-height:1.5;">
          <strong>Detalii programare trimise:</strong><br>
          • Nume: ${N} ${P}<br>
          • Email: ${E}<br>
          • Telefon: ${T}<br>
          • Mesaj: ${M || "–"}
        </p>
      </div>

      <p style="margin-top:26px; font-size:14px; color:#666;">
        Cu stimă,<br>
        <strong>Echipa Artisan Stoma</strong>
      </p>
    </div>
  </div>
  `;

  // ---------- HTML EMAIL (ADMIN) ----------
  const adminHTML = `
  <div style="font-family: Arial, sans-serif; background:#ffffff; padding:20px;">
    <div style="text-align: center;">
      <img src="https://romaniatravelguide.ro/logocabinet.png" alt="Artisan Stoma"
           style="width: 160px; margin-bottom: 20px;" />
    </div>

    <h2 style="color:#2a3b8f; margin:0 0 10px 0;">Programare nouă – Website</h2>
    <p style="font-size:15px; color:#333; margin:0 0 14px 0;">A fost trimisă o programare nouă:</p>

    <div style="padding:15px; background:#f2f4f7; border-radius:10px;">
      <p style="margin:0; font-size:15px; color:#222; line-height:1.6;">
        <strong>Nume:</strong> ${N} ${P}<br>
        <strong>Email:</strong> ${E}<br>
        <strong>Telefon:</strong> ${T}<br>
        <strong>Mesaj:</strong> ${M || "–"}
      </p>
    </div>

    <div style="margin-top:18px; text-align:center;">
      <a href="tel:${telefonLink}"
         style="display:inline-block; padding:12px 22px; background-color:#2a3b8f; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:15px;">
        Sună pacientul
      </a>
    </div>

    <p style="margin-top:20px; font-size:13px; color:#777;">
      Trimiteți-i clientului un răspuns cât mai rapid.
    </p>
  </div>
  `;

  try {
    // opțional la testare:
    // await transporter.verify();

    // ---------- EMAIL CLIENT ----------
    await transporter.sendMail({
      from: `"Artisan Stoma" <${process.env.SMTP_USER}>`,
      to: E,
      subject: "Confirmare programare – Artisan Stoma",
      html: clientHTML,
      text: `Bună ziua, ${N} ${P}, Vă mulțumim pentru solicitare!`,
      replyTo: process.env.SMTP_USER,
    });

    // ---------- EMAIL ADMIN ----------
    await transporter.sendMail({
      from: `"Programări Website" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "Programare nouă – Artisan Stoma",
      html: adminHTML,
      text: `Programare nouă:
Nume: ${N} ${P}
Email: ${E}
Telefon: ${T}
Mesaj: ${M || "-"}`,
      replyTo: E, // răspunzi direct clientului
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Eroare SMTP:", err);
    return res.status(500).json({ error: "Eroare la trimiterea emailurilor" });
  }
});

module.exports = router;
