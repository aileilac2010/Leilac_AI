import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GRAPH_API_VERSION =
  process.env.GRAPH_API_VERSION || "v23.0";

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
  console.error("ERRO: GEMINI_API_KEY não foi configurada.");
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});

// Página principal
app.get("/", (req, res) => {
  res.send("Leilac AI WhatsApp está funcionando!");
});

// Página para a Meta verificar como site comercial
app.get("/business", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Leilac AI</title>
    </head>
    <body>
      <h1>Leilac AI</h1>
      <p>Assistente de inteligência artificial para WhatsApp.</p>
      <p>
        A Leilac AI utiliza inteligência artificial para
        responder mensagens e ajudar os utilizadores.
      </p>
    </body>
    </html>
  `);
});

// Verificação do Webhook pela Meta
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado pela Meta.");
    return res.status(200).send(challenge);
  }

  console.log("Falha na verificação do webhook.");
  return res.sendStatus(403);
});

// Receber mensagens do WhatsApp
app.post("/webhook", async (req, res) => {
  // Responde imediatamente à Meta
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      return;
    }

    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;

        if (!value || !value.messages) {
          continue;
        }

        for (const message of value.messages) {
          // Por enquanto, só processamos mensagens de texto
          if (message.type !== "text") {
            continue;
          }

          const from = message.from;
          const userMessage = message.text?.body;

          if (!from || !userMessage) {
            continue;
          }

          console.log("Mensagem recebida:", userMessage);

          // Enviar mensagem para Gemini
          const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: userMessage,
            config: {
              systemInstruction:
                "Você é o Leilac AI, um assistente de WhatsApp. " +
                "Responda em português de forma natural, amigável, clara e objetiva. " +
                "Não diga que é humano. " +
                "Se não souber uma informação, diga claramente que não sabe."
            }
          });

          const aiReply =
            response.text ||
            "Desculpa, não consegui gerar uma resposta agora.";

          console.log("Resposta da IA:", aiReply);

          // Enviar resposta para o WhatsApp
          await sendWhatsAppMessage(from, aiReply);
        }
      }
    }
  } catch (error) {
    console.error("Erro no webhook:", error);
  }
});

// Enviar mensagem pelo WhatsApp Cloud API
async function sendWhatsAppMessage(to, text) {
  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/` +
    `${PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: {
        preview_url: false,
        body: text
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro ao enviar WhatsApp:", data);
    throw new Error(JSON.stringify(data));
  }

  console.log("Mensagem enviada:", data);
}

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando em 0.0.0.0:${PORT}`);
});
