import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = process.env.PORT || 3000;

// ========================================
// VARIÁVEIS DE AMBIENTE
// ========================================

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GRAPH_API_VERSION =
  process.env.GRAPH_API_VERSION || "v23.0";

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.8-flash";


// ========================================
// GEMINI
// ========================================

if (!GEMINI_API_KEY) {
  console.error(
    "ERRO: GEMINI_API_KEY não foi configurada."
  );
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});


// ========================================
// EXPRESS
// ========================================

app.use(
  express.json({
    limit: "1mb"
  })
);


// ========================================
// CORS
// ========================================

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


// ========================================
// PÁGINA INICIAL
// ========================================

app.get("/", (req, res) => {

  res.send(`
    <!DOCTYPE html>

    <html lang="pt">

    <head>

      <meta charset="UTF-8">

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      >

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


// ========================================
// PÁGINA BUSINESS
// ========================================

app.get("/business", (req, res) => {

  res.send(`
    <!DOCTYPE html>

    <html lang="pt">

    <head>

      <meta charset="UTF-8">

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      >

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


// ========================================
// HEALTH CHECK
// ========================================

app.get("/health", (req, res) => {

  res.json({

    status: "ok",

    service: "Leilac AI",

    gemini: GEMINI_API_KEY
      ? "configured"
      : "missing",

    model: GEMINI_MODEL

  });

});


// ========================================
// FUNÇÃO CENTRAL DA IA
// ========================================

async function generateAIResponse(message) {

  const response =
    await ai.models.generateContent({

      model: GEMINI_MODEL,

      contents: message,

      config: {

        // ==================================
        // RACIOCÍNIO
        // ==================================

        thinkingConfig: {

          thinkingLevel: "high"

        },


        // ==================================
        // GOOGLE SEARCH
        // ==================================

        tools: [

          {
            googleSearch: {}
          }

        ],


        // ==================================
        // PERSONALIDADE DA LEILAC
        // ==================================

        systemInstruction:

          "Você é a Leilac AI, uma assistente de inteligência artificial avançada. " +

          "Responda sempre em português, salvo quando o utilizador pedir outro idioma. " +

          "Você deve conseguir responder perguntas de conhecimento geral, escolares, científicas, matemáticas, tecnológicas, culturais e históricas. " +

          "Quando souber a resposta com segurança, responda diretamente. " +

          "Quando a pergunta envolver informações recentes, atuais, pessoas, acontecimentos, notícias, resultados, preços, lançamentos ou qualquer informação que possa ter mudado, use a Pesquisa Google para verificar os dados antes de responder. " +

          "Use a Pesquisa Google também quando ela puder melhorar significativamente a precisão da resposta. " +

          "Não diga ao utilizador que você não consegue pesquisar se a ferramenta estiver disponível. " +

          "Depois de pesquisar, sintetize as informações encontradas de forma clara e natural. " +

          "Para perguntas simples, seja direto. " +

          "Para perguntas complexas, explique cuidadosamente. " +

          "Em matemática, faça os cálculos corretamente e mostre os passos quando forem úteis. " +

          "Em programação, forneça soluções corretas e código funcional quando apropriado. " +

          "Em assuntos escolares, explique de maneira didática e fácil de entender. " +

          "Não invente fatos ou fontes. " +

          "Se existirem informações conflitantes, diga isso claramente. " +

          "Não diga que é humano. " +

          "Seja útil, natural, educada e objetiva."

      }

    });


  const answer =
    response.text;


  if (!answer) {

    return (
      "Desculpa, não consegui gerar uma resposta agora."
    );

  }


  return answer;

}


// ========================================
// CHAT DO SITE
// ========================================

app.post("/chat", async (req, res) => {

  try {

    const message =
      req.body?.message;


    // -----------------------------
    // VALIDAR MENSAGEM
    // -----------------------------

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {

      return res.status(400).json({

        error:
          "Mensagem inválida."

      });

    }


    // -----------------------------
    // VALIDAR GEMINI
    // -----------------------------

    if (!GEMINI_API_KEY) {

      return res.status(500).json({

        error:
          "A chave da IA não está configurada no servidor."

      });

    }


    console.log(
      "Mensagem recebida pelo site:",
      message
    );


    // -----------------------------
    // GERAR RESPOSTA
    // -----------------------------

    const reply =
      await generateAIResponse(
        message
      );


    console.log(
      "Resposta enviada pelo site:",
      reply
    );


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


// ========================================
// WEBHOOK META - VERIFICAÇÃO
// ========================================

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


// ========================================
// WEBHOOK META - RECEBER MENSAGENS
// ========================================

app.post("/webhook", async (req, res) => {

  // Responder imediatamente à Meta
  res.sendStatus(200);


  try {

    const body =
      req.body;


    // -----------------------------
    // VALIDAR EVENTO
    // -----------------------------

    if (
      body.object !==
      "whatsapp_business_account"
    ) {

      return;

    }


    const entries =
      body.entry || [];


    // -----------------------------
    // PROCESSAR ENTRADAS
    // -----------------------------

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


        // ---------------------------
        // PROCESSAR MENSAGENS
        // ---------------------------

        for (
          const message
          of value.messages
        ) {


          // Apenas texto

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


          // ---------------------------
          // GEMINI + GOOGLE SEARCH
          // ---------------------------

          const aiReply =
            await generateAIResponse(
              userMessage
            );


          console.log(
            "Resposta da IA:",
            aiReply
          );


          // ---------------------------
          // ENVIAR PARA WHATSAPP
          // ---------------------------

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


// ========================================
// ENVIAR MENSAGEM PELO WHATSAPP
// ========================================

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


// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Leilac AI rodando em 0.0.0.0:${PORT}`
    );

  }
);
