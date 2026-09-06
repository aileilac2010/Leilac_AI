/*
  URL do servidor da Leilac AI.

  Por enquanto, deixa assim para testar o visual:

  const API_URL = "";

  Depois vamos colocar a URL do Render.
*/

const API_URL = "https://leilac-ai2.onrender.com";

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");


function addMessage(text, type) {

  const message = document.createElement("div");

  message.className = `message ${type}`;

  message.textContent = text;

  chatMessages.appendChild(message);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}


chatForm.addEventListener("submit", async function (event) {

  event.preventDefault();

  const text = messageInput.value.trim();

  if (!text) return;


  // mostra mensagem do usuário

  addMessage(text, "user");

  messageInput.value = "";


  // mostra carregando

  const loading = document.createElement("div");

  loading.className = "message bot";

  loading.textContent = "Pensando...";

  chatMessages.appendChild(loading);

  chatMessages.scrollTop =
    chatMessages.scrollHeight;


  /*
    Caso o servidor ainda não esteja conectado,
    usamos uma resposta temporária.
  */

  if (!API_URL) {

    setTimeout(() => {

      loading.remove();

      addMessage(
        "A interface da Leilac AI está funcionando! 🚀 Agora precisamos conectar este chat ao servidor Gemini.",
        "bot"
      );

    }, 700);

    return;
  }


  try {

    const response = await fetch(
      `${API_URL}/chat`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: text
        })
      }
    );


    const data = await response.json();

    loading.remove();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Erro ao comunicar com o servidor."
      );

    }


    const reply =
      data.reply ||
      data.response ||
      "Não consegui responder agora.";


    addMessage(reply, "bot");


  } catch (error) {

    console.error(error);

    loading.remove();

    addMessage(
      "Desculpa 😕 ocorreu um erro ao falar com o servidor.",
      "bot"
    );

  }

});
