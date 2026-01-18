const express = require("express");
const router = express.Router();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("✅ EMAILROUTES LOADED v2026-01-18-1525");

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
  const telefonLink = String(T || "").replace(/\s+/g, "");

  // ✅ ref unic (ajută să nu mai bage Gmail în același thread / „text citat”)
  const ref = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const stamp = new Date().toISOString().slice(0, 19).replace("T", " ");

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
        Bună ziua <strong>${N} ${P}</strong>,
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
  // ✅ Tot ce e important e în chenar + buton în chenar.
  const adminHTML = `
  <div style="font-family: Arial, sans-serif; background:#ffffff; padding:20px;">
    <div style="text-align: center;">
      <img src="https://romaniatravelguide.ro/logocabinet.png" alt="Artisan Stoma"
           style="width: 160px; margin-bottom: 20px;" />
    </div>

    <h2 style="color:#2a3b8f; margin:0 0 10px 0;">Programare nouă – Website</h2>
    <p style="font-size:15px; color:#333; margin:0 0 14px 0;">
      A fost trimisă o programare nouă:
    </p>

    <div style="padding:15px; background:#f2f4f7; border-radius:10px;">
      <p style="margin:0; font-size:15px; color:#222; line-height:1.6;">
        <strong>Nume:</strong> ${N} ${P}<br>
        <strong>Email:</strong> ${E}<br>
        <strong>Telefon:</strong> ${T}<br>
        <strong>Mesaj:</strong> ${M || "–"}
      </p>

      <div style="margin-top:14px; text-align:center;">
        <a href="tel:${telefonLink}"
           style="display:inline-block; padding:12px 22px; background-color:#2a3b8f; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:15px;">
          Sună pacientul
        </a>
      </div>

      <p style="margin:14px 0 0 0; font-size:12px; color:#666; text-align:center;">
        Ref: ${ref}
      </p>
    </div>

    <p style="margin-top:20px; font-size:13px; color:#777;">
      Trimiteți-i clientului un răspuns cât mai rapid.
    </p>
  </div>
  `;

  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromClient = `Artisan Stoma <${fromEmail}>`;
  const fromAdmin = `Programări Website <${fromEmail}>`;

  // ✅ subject-uri unice => Gmail nu mai colapsează mailurile ca „text citat”
  const clientSubject = `Confirmare programare – Artisan Stoma`;
  const adminSubject = `Programare nouă – ${N} ${P} – ${stamp} – ${ref.slice(0, 6)}`;

  try {
    await Promise.all([
      resend.emails.send({
        from: fromClient,
        to: E,
        subject: clientSubject,
        html: clientHTML,
        text: `Bună ziua, ${N} ${P}, Vă mulțumim pentru solicitare!`,
        replyTo: fromEmail,
        headers: {
          "X-Entity-Ref-ID": ref,
        },
      }),

      resend.emails.send({
        from: fromAdmin,
        to: process.env.ADMIN_EMAIL,
        subject: adminSubject,
        html: adminHTML,
        text: `Programare nouă:
Ref: ${ref}
Nume: ${N} ${P}
Email: ${E}
Telefon: ${T}
Mesaj: ${M || "-"}`,
        replyTo: E,
        headers: {
          "X-Entity-Ref-ID": ref,
        },
      }),
    ]);

    return res.json({ success: true });
  } catch (err) {
    console.error("Eroare Resend:", err);
    return res.status(500).json({ error: "Eroare la trimiterea emailurilor" });
  }
});

module.exports = router;
