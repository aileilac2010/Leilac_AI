import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.2";
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v23.0";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.send("Leilac AI está funcionando!");
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        if (!value?.messages) continue;

        for (const message of value.messages) {
          if (message.type !== "text") continue;

          const from = message.from;
          const userMessage = message.text?.body;

          if (!from || !userMessage) continue;

          console.log("Mensagem:", userMessage);

          const response = await openai.responses.create({
            model: OPENAI_MODEL,
            instructions:
              "Você é o assistente oficial deste WhatsApp. " +
              "Responda em português, de forma natural, amigável e objetiva.",
            input: userMessage
          });

          const reply =
            response.output_text ||
            "Desculpa, não consegui responder agora.";

          await sendWhatsAppMessage(from, reply);
        }
      }
    }
  } catch (error) {
    console.error("Erro:", error);
  }
});

async function sendWhatsAppMessage(to, text) {
  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/` +
    `${PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: text
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro do WhatsApp:", data);
    throw new Error(JSON.stringify(data));
  }

  console.log("Resposta enviada!");
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
