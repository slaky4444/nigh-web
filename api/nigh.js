/**
 * NIGH — Función de IA, 100% GRATIS (Google Gemini)
 * -----------------------------------------------------
 * Va en la carpeta api/ de tu MISMO repositorio de la web
 * (el mismo que contiene index.html). No hace falta ningún
 * repo separado ni copiar ninguna URL: al desplegar todo junto
 * en Vercel, la web y esta función viven en el mismo sitio.
 *
 * ÚNICOS PASOS QUE HAY QUE HACER A MANO:
 *
 * 1. Consigue una clave gratis (sin tarjeta) en:
 *    https://aistudio.google.com/app/apikey -> "Create API key"
 *
 * 2. En tu repositorio de GitHub (el mismo de index.html),
 *    crea una carpeta llamada "api" y sube este archivo dentro
 *    con el nombre exacto: nigh.js
 *    Así te queda: index.html en la raíz, y api/nigh.js al lado.
 *
 * 3. Ve a https://vercel.com -> "Sign Up" -> "Continue with GitHub".
 *
 * 4. "Add New" -> "Project" -> elige ese mismo repositorio.
 *    Antes de pulsar "Deploy", abre "Environment Variables" y añade:
 *      Name: GEMINI_API_KEY
 *      Value: (tu clave del paso 1)
 *    Pulsa "Deploy".
 *
 * A partir de aquí, cada vez que subas cambios a GitHub,
 * Vercel actualiza la web sola. No hay que tocar más nada.
 */

export const config = {
  maxDuration: 30, // le damos hasta 30s en vez de los 10s por defecto, para que no se corte
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta configurar GEMINI_API_KEY en Vercel" });
  }

  const { system, message } = req.body || {};
  const userMessage = typeof message === "string" ? message.slice(0, 4000) : "";
  const systemPrompt = typeof system === "string" ? system.slice(0, 3000) : undefined;

  if (!userMessage) {
    return res.status(400).json({ error: "Falta el campo message" });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
        }),
      }
    );

    const data = await geminiRes.json();
    const text =
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
        ? data.candidates[0].content.parts[0].text
        : "";

    return res.status(200).json({ text: text || "", errorCode: text ? undefined : (data && data.error && data.error.code) });
  } catch (err) {
    return res.status(500).json({ error: "Error al llamar a Gemini", detail: String(err) });
  }
}
