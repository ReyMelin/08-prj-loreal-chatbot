/* ================================
   DOM ELEMENTS
================================ */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const productGrid = document.getElementById("productGrid");
const categoryFilter = document.getElementById("categoryFilter");
const selectedProductsDiv = document.getElementById("selectedProducts");
const generateRoutineBtn = document.getElementById("generateRoutineBtn");
const clearSelectedBtn = document.getElementById("clearSelectedBtn");

/* ================================
   STATE
================================ */
let allProducts = [];
let selectedProducts = [];

let conversationHistory = [
  {
    role: "system",
    content:
      "You are Scott, a warm, friendly, and enthusiastic L'Oréal beauty advisor chatbot. When someone tells you their name, always greet them warmly using their name and introduce yourself as Scott. For example: 'Hi [Name]! I'm Scott, your L'Oréal beauty advisor! 💄✨' Remember their name throughout the conversation and use it occasionally to personalize responses. Your ONLY role is to help customers with L'Oréal products, skincare routines, makeup tips, and haircare recommendations. You must ONLY answer questions related to L'Oréal products, beauty, skincare, haircare, and makeup. If someone asks about ANY topic unrelated to L'Oréal or beauty (including other brands, politics, general knowledge, math, coding, or anything else), you must politely refuse by saying: 'I'm here to help with L'Oréal products and beauty advice. How can I assist you with your beauty needs today?' Do not answer off-topic questions under any circumstances. Keep all responses helpful, friendly, and under 100 words. Use encouraging phrases like 'Yass queen!', 'Slay!', 'You're serving looks!', 'Iconic!', 'Stunning!', 'Living for this!', 'Obsessed!', 'That's giving main character energy!', 'Werk it!' to make users feel fabulous and confident. When providing lists or recommendations, use clear formatting with bullet points. Use emojis throughout your responses to make them more engaging and friendly (💄 💅 ✨ 💖 🌟 😊 👍 🎉 💆‍♀️ 🧴 👑 🔥 etc.)",
  },
];

/* ================================
   LOAD PRODUCTS
================================ */
async function loadProducts() {
  try {
    // Fetch the products.json file
    const res = await fetch("products.json");
    const data = await res.json();

    // Store products in the allProducts array
    allProducts = data.products;

    // Display products in the grid
    displayProducts();
  } catch (err) {
    console.error("Error loading products:", err);

    // Show an error message in the product grid
    productGrid.innerHTML =
      "<p>Error loading products. Please try again later.</p>";
  }
}

// Call loadProducts to fetch and display products when the page loads
loadProducts();

/* ================================
   UI HELPERS
================================ */
function getVisibleProducts() {
  return allProducts.filter(
    (p) => !selectedProducts.some((sel) => sel.id === p.id)
  );
}

function updateSelectedProductsUI() {
  selectedProductsDiv.innerHTML = "";

  if (selectedProducts.length === 0) {
    selectedProductsDiv.innerHTML = `<p class="empty-message">No products selected yet. Click to add some!</p>`;
    return;
  }

  selectedProducts.forEach((product) => {
    const tag = document.createElement("div");
    tag.className = "selected-product-tag";

    tag.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <span>${product.name}</span>
      <button class="remove-btn">&times;</button>
    `;

    tag.querySelector(".remove-btn").addEventListener("click", () => {
      removeSelectedProduct(product.id);
    });

    selectedProductsDiv.appendChild(tag);
  });
}

function removeSelectedProduct(id) {
  selectedProducts = selectedProducts.filter((p) => p.id !== id);
  updateSelectedProductsUI();
  displayProducts();
}

/* ================================
   DISPLAY PRODUCT GRID
================================ */
function displayProducts() {
  productGrid.innerHTML = "";

  const category = categoryFilter.value;

  if (!category || category === "all") {
    productGrid.innerHTML =
      "<p class='empty-message'>Select a category to view products.</p>";
    return;
  }

  const visible = getVisibleProducts().filter(
    (p) => p.category.toLowerCase() === category.toLowerCase()
  );

  if (visible.length === 0) {
    productGrid.innerHTML = "<p>No products found in this category.</p>";
    return;
  }

  visible.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = product.id;

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <div class="brand">${product.brand}</div>
      <h3>${product.name}</h3>
      <div class="category">${product.category}</div>
      <button class="more-info-btn">i</button>
    `;

    productGrid.appendChild(card);
  });
}

/* ================================
   EVENT: CATEGORY CHANGE
================================ */
categoryFilter.addEventListener("change", () => {
  displayProducts();
});

/* ================================
   EVENT: CLEAR SELECTED
================================ */
clearSelectedBtn.addEventListener("click", () => {
  selectedProducts = [];
  updateSelectedProductsUI();
  displayProducts();
});

/* ================================
   EVENT: GENERATE ROUTINE
================================ */
if (generateRoutineBtn) {
  generateRoutineBtn.addEventListener("click", async () => {
    // Collect selected products
    if (selectedProducts.length === 0) {
      addChatBubble(
        "Please select at least one product to generate your routine!",
        "ai"
      );
      return;
    }

    // Prepare product data to send to the API
    const productData = selectedProducts.map((product) => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
    }));

    // Add a loading message to the chat window
    const loadingBubble = addChatBubble(
      '<span class="typing-indicator"><span></span><span></span><span></span></span>',
      "ai"
    );

    try {
      // Create a special message for generating the routine
      const routineMessages = [
        {
          role: "system",
          content:
            "You are a friendly L'Oréal beauty advisor named Scott. Create a step-by-step daily beauty routine using ONLY the provided products. Make it clear, professional, and easy to follow. Include the order of application and when to use each product (morning/night). Tailor recommendations based on their key functions. Use emojis and encouraging phrases to make it engaging.",
        },
        {
          role: "user",
          content: `Using the following selected L'Oréal products, suggest a daily beauty routine. Tailor recommendations based on their key functions:\n\n${productData
            .map(
              (p, index) =>
                `${index + 1}. **${p.name}** by ${p.brand}\n   - Category: ${
                  p.category
                }\n   - Description: ${p.description}`
            )
            .join(
              "\n\n"
            )}\n\nPlease create a personalized daily beauty routine using these products.`,
        },
      ];

      // Send the routine request to Cloudflare Worker
      const response = await fetch(
        "https://round-hill-afb6.rherma26-a5b.workers.dev/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: routineMessages, // Send routine-specific messages
          }),
        }
      );

      // Parse the response
      const data = await response.json();

      // Check for errors in the AI response
      if (!response.ok) {
        throw new Error(
          data.error?.message ||
            `API request failed with status ${response.status}`
        );
      }

      // Verify the response structure
      if (
        !data.choices ||
        !data.choices[0] ||
        !data.choices[0].message ||
        !data.choices[0].message.content
      ) {
        throw new Error("Invalid response structure from OpenAI API");
      }

      // Get the AI-generated routine
      const aiRoutine = data.choices[0].message.content;

      // Display the AI-generated routine in the chat window
      addChatBubble(aiRoutine, "ai");

      // Add to conversation history so user can ask follow-up questions
      conversationHistory.push({
        role: "user",
        content: "Please create a routine with my selected products.",
      });
      conversationHistory.push({
        role: "assistant",
        content: aiRoutine,
      });
    } catch (error) {
      console.error("Error generating routine:", error);

      // Show an error message in the chat window
      addChatBubble(
        "Sorry, I couldn't generate your routine. Please try again later.",
        "ai"
      );
    } finally {
      // Remove the loading message
      loadingBubble.remove();
    }
  });
}

/* ================================
   PRODUCT GRID CLICK HANDLING
================================ */
productGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (!card) return;

  const id = Number(card.dataset.id);
  const product = allProducts.find((p) => p.id === id);

  if (!product) return;

  if (e.target.classList.contains("more-info-btn")) {
    toggleDescriptionBubble(card, product);
    return;
  }

  // Single click = select product
  if (!selectedProducts.some((p) => p.id === id)) {
    selectedProducts.push(product);
    updateSelectedProductsUI();
    displayProducts();
  }
});

/* ================================
   DESCRIPTION BUBBLE
================================ */
function toggleDescriptionBubble(card, product) {
  // Check if a modal already exists on the page
  let existingModal = document.querySelector(".product-modal");

  if (existingModal) {
    // Remove existing modal if user clicks info button again
    existingModal.remove();
    return;
  }

  // Create a modal overlay
  const modal = document.createElement("div");
  modal.className = "product-modal";

  // Create modal content
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close">&times;</button>
      <img src="${product.image}" alt="${product.name}" class="modal-image" />
      <h3>${product.name}</h3>
      <p class="modal-brand">${product.brand}</p>
      <p class="modal-category">${product.category}</p>
      <p class="modal-description">${product.description}</p>
    </div>
  `;

  // Append modal to body
  document.body.appendChild(modal);

  // Close modal when clicking the X button
  modal.querySelector(".modal-close").addEventListener("click", () => {
    modal.remove();
  });

  // Close modal when clicking outside the content
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", function closeOnEscape(e) {
    if (e.key === "Escape") {
      modal.remove();
      document.removeEventListener("keydown", closeOnEscape);
    }
  });
}

/* ================================
   CHATBOT LOGIC
================================ */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's message
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Add user's message to the chat window
  addChatBubble(userMessage, "user");

  // Add user's message to conversation history
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  // Clear the input field
  userInput.value = "";

  // Show a typing indicator while waiting for the AI response
  const loadingBubble = addChatBubble(
    '<span class="typing-indicator"><span></span><span></span><span></span></span>',
    "ai"
  );

  try {
    // Send the messages array to the Cloudflare Worker
    const response = await fetch(
      "https://round-hill-afb6.rherma26-a5b.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory, // Send the full conversation history
        }),
      }
    );

    // Parse the response
    const data = await response.json();

    // Check for errors in the AI response
    if (!response.ok) {
      throw new Error(
        data.error?.message ||
          `API request failed with status ${response.status}`
      );
    }

    // Verify the response structure before accessing the content
    if (
      !data.choices ||
      !data.choices[0] ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      throw new Error("Invalid response structure from OpenAI API");
    }

    // Extract the AI's response using data.choices[0].message.content
    const aiMessage = data.choices[0].message.content;

    // Add the AI's response to the chat window
    addChatBubble(aiMessage, "ai");

    // Add the AI's response to the conversation history
    conversationHistory.push({
      role: "assistant",
      content: aiMessage,
    });
  } catch (error) {
    console.error("Error communicating with the AI:", error);

    // Show an error message in the chat window
    addChatBubble(
      "Sorry, I couldn't process your request. Please try again later.",
      "ai"
    );
  } finally {
    // Remove the typing indicator
    loadingBubble.remove();
  }
});

/* ================================
   HELPER: ADD CHAT BUBBLE
================================ */
function addChatBubble(message, sender) {
  const bubble = document.createElement("div");
  bubble.className = `msg-bubble ${
    sender === "user" ? "user-bubble" : "ai-bubble"
  }`;
  bubble.innerHTML = message;
  chatWindow.appendChild(bubble);

  // Scroll to the bottom of the chat window
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return bubble;
}
