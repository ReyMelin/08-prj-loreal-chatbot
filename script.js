/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const productGrid = document.getElementById("productGrid");
const categoryFilter = document.getElementById("categoryFilter");
const selectedProductsDiv = document.getElementById("selectedProducts");
const generateRoutineBtn = document.getElementById("generateRoutineBtn");
const clearSelectedBtn = document.getElementById("clearSelectedBtn");

// Array to store all products
let allProducts = [];

// Load products from JSON file when page loads
async function loadProducts() {
  try {
    // Fetch the products.json file
    const response = await fetch("products.json");
    const data = await response.json();

    // Store products in our array
    allProducts = data.products;

    // Display all products initially
    displayProducts(allProducts);
  } catch (error) {
    console.error("Error loading products:", error);
    productGrid.innerHTML =
      "<p>Error loading products. Please try again later.</p>";
  }
}

// Update selected products UI
function updateSelectedProductsUI() {
  // Clear selected products div
  selectedProductsDiv.innerHTML = "";

  if (selectedProducts.length === 0) {
    selectedProductsDiv.innerHTML = `<p class="empty-message">No products selected yet. Click on products above to add them!</p>`;
    return;
  }

  // Show each selected product as a tag/card
  selectedProducts.forEach((product) => {
    const tag = document.createElement("div");
    tag.className = "selected-product-tag";
    tag.innerHTML = `
      <img src="${product.image}" alt="${product.name}" style="width:32px;height:32px;object-fit:contain;border-radius:6px;">
      <span>${product.name}</span>
      <button class="remove-btn" title="Remove">&times;</button>
    `;
    // Remove button handler
    tag.querySelector(".remove-btn").onclick = () => {
      // Remove from selectedProducts
      selectedProducts = selectedProducts.filter((p) => p.id !== product.id);
      // Show product again in grid
      displayProducts(getVisibleProducts());
      // Update selected products UI
      updateSelectedProductsUI();
    };
    selectedProductsDiv.appendChild(tag);
  });
}

// Get products not selected (for grid)
function getVisibleProducts() {
  return allProducts.filter(
    (product) => !selectedProducts.some((sel) => sel.id === product.id)
  );
}

// Display products in the grid (hide selected, only show for chosen category)
function displayProducts(products) {
  productGrid.innerHTML = "";

  // If no category is selected or "all", show nothing
  if (!categoryFilter.value || categoryFilter.value === "all") {
    productGrid.innerHTML =
      "<p class='empty-message'>Select a category to view products.</p>";
    return;
  }

  // Filter products to only those in the selected category and not selected
  const visibleProducts = products.filter(
    (product) =>
      product.category.toLowerCase() === categoryFilter.value.toLowerCase() &&
      !selectedProducts.some((sel) => sel.id === product.id)
  );

  if (visibleProducts.length === 0) {
    productGrid.innerHTML = "<p>No products found in this category.</p>";
    return;
  }

  visibleProducts.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = product.id;
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <div class="brand">${product.brand}</div>
      <h3>${product.name}</h3>
      <div class="category">${product.category}</div>
      <button class="more-info-btn" title="More Info">i</button>
    `;
    productGrid.appendChild(card);
  });
}

// Filter products by category (hide selected)
function filterProducts(category) {
  // Only show products for the selected category and not selected
  displayProducts(allProducts);
}

// Listen for category dropdown changes
categoryFilter.addEventListener("change", (e) => {
  const selectedCategory = e.target.value;
  if (selectedCategory === "all") {
    productGrid.innerHTML =
      "<p class='empty-message'>Select a category to view products.</p>";
  } else {
    filterProducts(selectedCategory);
  }
});

// Load products when the page loads
loadProducts();

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

  // Show typing indicator while waiting for AI response
  const loadingBubble = document.createElement("div");
  loadingBubble.className = "msg-bubble ai-bubble loading";
  loadingBubble.innerHTML =
    '<span class="typing-indicator"><span></span><span></span><span></span></span>';
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

// Placeholder: Array to store selected products
let selectedProducts = [];

// Product selection: move to selected section and hide from grid
productGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (!card) return;
  const productId = Number(card.dataset.id);
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;
  // Add to selected if not already there
  if (!selectedProducts.some((p) => p.id === productId)) {
    selectedProducts.push(product);
    // After selection, re-filter to hide selected product and keep others hidden
    filterProducts(categoryFilter.value);
    updateSelectedProductsUI();
  }
});

// Clear all selected products
clearSelectedBtn.addEventListener("click", () => {
  // Remove all selected products
  selectedProducts = [];
  // Show all products again for the selected category
  filterProducts(categoryFilter.value);
  // Update selected products UI
  updateSelectedProductsUI();
});

// Generate routine and display in chat window
generateRoutineBtn.addEventListener("click", async () => {
  // If no products selected, show a message
  if (selectedProducts.length === 0) {
    const routineBubble = document.createElement("div");
    routineBubble.className = "msg-bubble ai-bubble";
    routineBubble.textContent =
      "Please select at least one product to generate your routine!";
    chatWindow.appendChild(routineBubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return;
  }

  // Prepare the data to send to the OpenAI API
  const productData = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  // Add a loading bubble to indicate the routine is being generated
  const loadingBubble = document.createElement("div");
  loadingBubble.className = "msg-bubble ai-bubble loading";
  loadingBubble.innerHTML =
    '<span class="typing-indicator"><span></span><span></span><span></span></span>';
  chatWindow.appendChild(loadingBubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Make the API request to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer YOUR_OPENAI_API_KEY`, // Replace with your OpenAI API key
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are Scott, a friendly L'Oréal beauty advisor. Generate a skincare, makeup, or haircare routine based on the provided products. Keep the routine clear, concise, and under 100 words.",
          },
          {
            role: "user",
            content: `Here are the selected products: ${JSON.stringify(
              productData
            )}. Please create a routine.`,
          },
        ],
      }),
    });

    // Parse the response
    const data = await response.json();

    // Check for errors
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to generate routine.");
    }

    // Get the AI-generated routine
    const aiRoutine = data.choices[0].message.content;

    // Remove the loading bubble
    loadingBubble.remove();

    // Display the AI-generated routine in the chat window
    const routineBubble = document.createElement("div");
    routineBubble.className = "msg-bubble ai-bubble";
    routineBubble.innerHTML = aiRoutine;
    chatWindow.appendChild(routineBubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    // Remove the loading bubble
    loadingBubble.remove();

    // Display an error message in the chat window
    const errorBubble = document.createElement("div");
    errorBubble.className = "msg-bubble ai-bubble error";
    errorBubble.textContent = `Sorry, there was an error generating your routine: ${error.message}`;
    chatWindow.appendChild(errorBubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    console.error("Error generating routine:", error);
  }
});

// Placeholder: Continue conversation in chat window based on selections
function continueConversationWithSelection() {
  // Students: Add logic to send selected products or routine info
  // as a message to the chatbot, and get a personalized response
  // Example:
  // const userMessage = `Can you recommend a routine using these products: ${selectedProducts.map(p => p.name).join(", ")}?`;
  // // Add to conversationHistory and trigger chat as usual
}
