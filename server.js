import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = process.env.PORT || 3000;

// ==============================
// VARIÁVEIS DE AMBIENTE
// ==============================

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GRAPH_API_VERSION =
  process.env.GRAPH_API_VERSION || "v23.0";

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.6-flash";

// ==============================
// GEMINI
// ==============================

if (!GEMINI_API_KEY) {
  console.error("ERRO: GEMINI_API_KEY não foi configurada.");
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});


// ==============================
// EXPRESS
// ==============================

app.use(express.json({ limit: "1mb" }));


// ==============================
// CORS
// Permite que o site converse
// com o servidor Render.
// ==============================

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});


// ==============================
// PÁGINA INICIAL
// ==============================

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Leilac AI</title>
      <style>
        body {
          background: #080808;
          color: white;
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          text-align: center;
        }

        div {
          max-width: 600px;
          padding: 30px;
        }

        h1 {
          font-size: 45px;
        }

        p {
          color: #999;
          font-size: 18px;
        }
      </style>
    </head>

    <body>
      <div>
        <h1>✦ Leilac AI</h1>

        <p>
          Assistente de inteligência artificial
          funcionando normalmente.
        </p>
      </div>
    </body>
    </html>
  `);
});


// ==============================
// PÁGINA BUSINESS
// ==============================

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

      <p>
        Assistente de inteligência artificial
        para ajudar os utilizadores através
        de conversas e respostas inteligentes.
      </p>

      <p>
        A Leilac AI utiliza tecnologia de
        inteligência artificial para responder
        perguntas e auxiliar em diferentes tarefas.
      </p>
    </body>
    </html>
  `);
});


// ==============================
// HEALTH CHECK
// ==============================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Leilac AI",
    gemini: GEMINI_API_KEY
      ? "configured"
      : "missing"
  });
});


// ==================================================
// CHAT DO SITE
// ==================================================

app.post("/chat", async (req, res) => {

  try {

    const message = req.body?.message;

    // ------------------------------
    // Verificação da mensagem
    // ------------------------------

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: "Mensagem inválida."
      });
    }


    // ------------------------------
    // Verificação da chave Gemini
    // ------------------------------

    if (!GEMINI_API_KEY) {

      return res.status(500).json({
        error: "A chave da IA não está configurada no servidor."
      });

    }


    console.log(
      "Mensagem recebida pelo site:",
      message
    );


    // ------------------------------
    // Gemini
    // ------------------------------

    const response =
      await ai.models.generateContent({

        model: GEMINI_MODEL,

        contents: message,

        config: {

          systemInstruction:
            "Você é o Leilac AI, um assistente de inteligência artificial. " +
            "Responda em português de forma natural, amigável, clara e útil. " +
            "Seja objetivo, mas explique quando necessário. " +
            "Não diga que é humano. " +
            "Nunca invente informações. " +
            "Quando não souber algo, diga claramente que não sabe."
        }

      });


    const reply =
      response.text ||
      "Desculpa, não consegui gerar uma resposta agora.";


    console.log(
      "Resposta enviada pelo site:",
      reply
    );


    // ------------------------------
    // Resposta para o site
    // ------------------------------

    return res.json({
      reply
    });


  } catch (error) {

    console.error(
      "Erro no /chat:",
      error
    );


    return res.status(500).json({
      error:
        "Ocorreu um erro ao processar a mensagem."
    });

  }

});


// ==================================================
// WEBHOOK - VERIFICAÇÃO META
// ==================================================

app.get("/webhook", (req, res) => {

  const mode =
    req.query["hub.mode"];

  const token =
    req.query["hub.verify_token"];

  const challenge =
    req.query["hub.challenge"];


  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {

    console.log(
      "Webhook verificado pela Meta."
    );

    return res
      .status(200)
      .send(challenge);

  }


  console.log(
    "Falha na verificação do webhook."
  );

  return res.sendStatus(403);

});


// ==================================================
// WEBHOOK - RECEBER MENSAGENS DO WHATSAPP
// ==================================================

app.post("/webhook", async (req, res) => {

  // Respondemos imediatamente para a Meta
  res.sendStatus(200);


  try {

    const body = req.body;


    // ------------------------------
    // Verificar tipo de evento
    // ------------------------------

    if (
      body.object !==
      "whatsapp_business_account"
    ) {
      return;
    }


    const entries =
      body.entry || [];


    // ------------------------------
    // Percorrer eventos
    // ------------------------------

    for (const entry of entries) {

      const changes =
        entry.changes || [];


      for (const change of changes) {

        const value =
          change.value;


        if (
          !value ||
          !value.messages
        ) {
          continue;
        }


        // ------------------------------
        // Percorrer mensagens
        // ------------------------------

        for (
          const message
          of value.messages
        ) {


          // Atualmente aceitamos texto
          if (
            message.type !== "text"
          ) {
            continue;
          }


          const from =
            message.from;

          const userMessage =
            message.text?.body;


          if (
            !from ||
            !userMessage
          ) {
            continue;
          }


          console.log(
            "Mensagem recebida pelo WhatsApp:",
            userMessage
          );


          // ------------------------------
          // Gemini
          // ------------------------------

          const response =
            await ai.models.generateContent({

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


          console.log(
            "Resposta da IA:",
            aiReply
          );


          // ------------------------------
          // Enviar resposta para WhatsApp
          // ------------------------------

          await sendWhatsAppMessage(
            from,
            aiReply
          );

        }

      }

    }


  } catch (error) {

    console.error(
      "Erro no webhook:",
      error
    );

  }

});


// ==================================================
// ENVIAR MENSAGEM PELO WHATSAPP
// ==================================================

async function sendWhatsAppMessage(
  to,
  text
) {

  const url =
    `https://graph.facebook.com/` +
    `${GRAPH_API_VERSION}/` +
    `${PHONE_NUMBER_ID}/messages`;


  const response =
    await fetch(
      url,
      {
        method: "POST",

        headers: {

          "Authorization":
            `Bearer ${WHATSAPP_TOKEN}`,

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            messaging_product:
              "whatsapp",

            recipient_type:
              "individual",

            to,

            type:
              "text",

            text: {

              preview_url:
                false,

              body:
                text

            }

          })

      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    console.error(
      "Erro ao enviar WhatsApp:",
      data
    );

    throw new Error(
      JSON.stringify(data)
    );

  }


  console.log(
    "Mensagem enviada pelo WhatsApp:",
    data
  );

}


// ==================================================
// INICIAR SERVIDOR
// ==================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Leilac AI rodando em 0.0.0.0:${PORT}`
    );

  }
);
