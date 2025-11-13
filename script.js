/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Array to store conversation history for context
const conversationHistory = [
  {
    role: "system",
    content:
      "You are Scott, a warm, friendly, and enthusiastic L'Oréal beauty advisor chatbot. When someone tells you their name, always greet them warmly using their name and introduce yourself as Scott. For example: 'Hi [Name]! I'm Scott, your L'Oréal beauty advisor! 💄✨' Remember their name throughout the conversation and use it occasionally to personalize responses. Your ONLY role is to help customers with L'Oréal products, skincare routines, makeup tips, and haircare recommendations. You must ONLY answer questions related to L'Oréal products, beauty, skincare, haircare, and makeup. If someone asks about ANY topic unrelated to L'Oréal or beauty (including other brands, politics, general knowledge, math, coding, or anything else), you must politely refuse by saying: 'I'm here to help with L'Oréal products and beauty advice. How can I assist you with your beauty needs today?' Do not answer off-topic questions under any circumstances. Keep all responses helpful, friendly, and under 100 words. Use encouraging phrases like 'Yass queen!', 'Slay!', 'You're serving looks!', 'Iconic!', 'Stunning!', 'Living for this!', 'Obsessed!', 'That's giving main character energy!', 'Werk it!' to make users feel fabulous and confident. When providing lists or recommendations, use clear formatting with bullet points. Use emojis throughout your responses to make them more engaging and friendly (💄 💅 ✨ 💖 🌟 😊 👍 🎉 💆‍♀️ 🧴 👑 🔥 etc.).",
  },
];

// Function to format AI response with HTML for better readability
function formatAIMessage(message) {
  // Replace **bold** with <strong>
  let formatted = message.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Replace bullet points (-, *, •) with proper HTML list items
  formatted = formatted.replace(/^[\-\*•]\s+(.+)$/gm, "<li>$1</li>");

  // Wrap consecutive list items in <ul> tags
  formatted = formatted.replace(/(<li>.*<\/li>\s*)+/gs, "<ul>$&</ul>");

  // Replace numbered lists (1. 2. 3.) with ordered list items
  formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");

  // Wrap consecutive numbered items in <ol> tags
  formatted = formatted.replace(/(<li>.*<\/li>\s*)+/gs, (match) => {
    // Check if it's already wrapped in <ul>
    if (match.includes("<ul>")) return match;
    return "<ol>" + match + "</ol>";
  });

  // Replace line breaks with <br> tags
  formatted = formatted.replace(/\n/g, "<br>");

  return formatted;
}

// Set initial message with a bubble
chatWindow.innerHTML = `<div class="msg-bubble ai-bubble">👋 Hello beautiful! You deserve the best beauty advice! I am here to help! </div>`;

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's message
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Add user's message to conversation history
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  // Create and display user's message bubble
  const userBubble = document.createElement("div");
  userBubble.className = "msg-bubble user-bubble";
  userBubble.textContent = userMessage;
  chatWindow.appendChild(userBubble);

  // Clear input field
  userInput.value = "";

  // Create and show loading message bubble
  const loadingBubble = document.createElement("div");
  loadingBubble.className = "msg-bubble ai-bubble loading";
  loadingBubble.textContent = "Humm, let me think about that...";
  chatWindow.appendChild(loadingBubble);

  // Scroll to bottom of chat
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Make API request through Cloudflare Worker
    // Send the entire conversation history for context
    const response = await fetch(
      "https://round-hill-afb6.rherma26-a5b.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory, // Send full conversation history
        }),
      }
    );

    // Parse the response
    const data = await response.json();

    // Check for errors
    if (!response.ok) {
      throw new Error(data.error?.message || "API request failed");
    }

    // Get AI's response from the data
    const aiMessage = data.choices[0].message.content;

    // Add AI's response to conversation history
    conversationHistory.push({
      role: "assistant",
      content: aiMessage,
    });

    // Remove loading bubble and display AI response bubble
    loadingBubble.remove();
    const aiBubble = document.createElement("div");
    aiBubble.className = "msg-bubble ai-bubble";
    // Use innerHTML to display formatted content with HTML tags
    aiBubble.innerHTML = formatAIMessage(aiMessage);
    chatWindow.appendChild(aiBubble);
  } catch (error) {
    // Display error message in a bubble
    loadingBubble.remove();
    const errorBubble = document.createElement("div");
    errorBubble.className = "msg-bubble ai-bubble error";
    errorBubble.textContent = `Sorry, there was an error: ${error.message}`;
    chatWindow.appendChild(errorBubble);
    console.error("Error details:", error);
  }

  // Scroll to bottom of chat
  chatWindow.scrollTop = chatWindow.scrollHeight;
});
