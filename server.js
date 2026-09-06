import express from "express";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 10000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "openrouter/free";

const SYSTEM_INSTRUCTION = `
Você é o Leilac AI, um assistente de inteligência artificial útil, inteligente e amigável.

REGRAS:
- Responda sempre em português, a menos que o utilizador peça outro idioma.
- Responda de forma clara e natural.
- Você pode responder perguntas de conhecimento geral, ciência, história, geografia, tecnologia, música, entretenimento e outros assuntos.
- Quando não tiver certeza de uma informação, diga claramente que não tem certeza.
- Não invente informações.
- Não diga que é o Google, Gemini ou OpenRouter.
- Seu nome é Leilac AI.
- Seja direto, mas dê explicações suficientes para que o utilizador entenda.
`;

console.log("========================================");
console.log("INICIANDO LEILAC AI");
console.log("========================================");
console.log(
  "OpenRouter API Key:",
  OPENROUTER_API_KEY ? "CONFIGURADA" : "NÃO CONFIGURADA"
);
console.log("Modelo:", OPENROUTER_MODEL);
console.log("Porta:", PORT);
console.log("========================================");

// ========================================
// ROTA PRINCIPAL
// ========================================

app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "Leilac AI",
    model: OPENROUTER_MODEL,
    provider: "OpenRouter",
    message: "Leilac AI está funcionando."
  });
});

// ========================================
// HEALTH CHECK
// ========================================

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    openrouter: OPENROUTER_API_KEY
      ? "configured"
      : "missing"
  });
});

// ========================================
// FUNÇÃO DA IA
// ========================================

async function generateAIResponse(message) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY não configurada.");
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://leilac-ai2.onrender.com",
        "X-Title": "Leilac AI"
      },

      body: JSON.stringify({
        model: OPENROUTER_MODEL,

        messages: [
          {
            role: "system",
            content: SYSTEM_INSTRUCTION
          },
          {
            role: "user",
            content: message.trim()
          }
        ],

        temperature: 0.7,

        max_tokens: 1000
      })
    }
  );

  const data = await response.json();

  // ========================================
  // TRATAMENTO DE ERROS
  // ========================================

  if (!response.ok) {
    console.error("ERRO OPENROUTER:");
    console.error(JSON.stringify(data, null, 2));

    const errorMessage =
      data?.error?.message ||
      "Erro desconhecido no OpenRouter.";

    throw new Error(
      `OpenRouter ${response.status}: ${errorMessage}`
    );
  }

  // ========================================
  // EXTRAIR RESPOSTA
  // ========================================

  const answer =
    data?.choices?.[0]?.message?.content;

  if (!answer) {
    console.error("Resposta inesperada:");
    console.error(JSON.stringify(data, null, 2));

    throw new Error(
      "O OpenRouter não retornou uma resposta válida."
    );
  }

  return answer.trim();
}

// ========================================
// ENDPOINT /CHAT
// ========================================

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Envie uma mensagem válida."
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "A mensagem não pode estar vazia."
      });
    }

    console.log(
      `Pergunta recebida: ${message.trim()}`
    );

    const answer = await generateAIResponse(message);

    console.log("Resposta gerada com sucesso.");

    res.json({
      success: true,
      message: answer,
      model: OPENROUTER_MODEL
    });

  } catch (error) {
    console.error("ERRO NO /CHAT:");
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Não foi possível gerar uma resposta.",
      details: error.message
    });
  }
});

// ========================================
// 404
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Rota não encontrada."
  });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log("========================================");
  console.log("🚀 LEILAC AI ONLINE");
  console.log(`🌐 Porta: ${PORT}`);
  console.log(`🤖 Modelo: ${OPENROUTER_MODEL}`);
  console.log("🔌 OpenRouter: ATIVADO");
  console.log("========================================");
});
