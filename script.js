/* ================================
   DOM ELEMENTS
================================ */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const productGrid = document.getElementById("productGrid");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const searchSuggestions = document.getElementById("searchSuggestions"); // New dropdown
const selectedProductsDiv = document.getElementById("selectedProducts");
const generateRoutineBtn = document.getElementById("generateRoutineBtn");
const clearSelectedBtn = document.getElementById("clearSelectedBtn");
const loadingScreen = document.getElementById("loadingScreen");
const mainContent = document.getElementById("mainContent");
const toggleButtons = document.querySelectorAll(".toggle-section-btn");

/* ================================
   STATE
================================ */
let allProducts = [];
// Load selected products from localStorage on page load
let selectedProducts =
  JSON.parse(localStorage.getItem("selectedProducts")) || [];
let searchQuery = ""; // Track current search query

let conversationHistory = [
  {
    role: "system",
    content:
      "You are Scott, a warm, friendly, and enthusiastic L'Oréal beauty advisor chatbot. When someone tells you their name, always greet them warmly using their name and introduce yourself as Scott. For example: 'Hi [Name]! I'm Scott, your L'Oréal beauty advisor! 💄✨' Remember their name throughout the conversation and use it occasionally to personalize responses. Your ONLY role is to help customers with L'Oréal products, skincare routines, makeup tips, and haircare recommendations. You must ONLY answer questions related to L'Oréal products, beauty, skincare, haircare, and makeup. If someone asks about ANY topic unrelated to L'Oréal or beauty (including other brands, politics, general knowledge, math, coding, or anything else), you must politely refuse by saying: 'I'm here to help with L'Oréal products and beauty advice. How can I assist you with your beauty needs today?' Do not answer off-topic questions under any circumstances. Keep all responses helpful, friendly, and under 100 words. Use encouraging phrases like 'Yass queen!', 'Slay!', 'You're serving looks!', 'Iconic!', 'Stunning!', 'Living for this!', 'Obsessed!', 'That's giving main character vibes!', 'Werk it!' to make users feel fabulous and confident. When providing lists or recommendations, use clear formatting with bullet points. Use emojis throughout your responses to make them more engaging and friendly (💄 💅 ✨ 💖 🌟 😊 👍 🎉 💆‍♀️ 🧴 👑 🔥 etc.)",
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

    // Display selected products from localStorage if any exist
    if (selectedProducts.length > 0) {
      updateSelectedProductsUI();
    }

    // Start fade-out after 3 seconds
    setTimeout(() => {
      // Add fade-out class to trigger smooth opacity transition
      loadingScreen.classList.add("fade-out");

      // Show main content
      mainContent.style.display = "grid";

      // Remove loading screen from DOM after fade completes (3s transition + small buffer)
      setTimeout(() => {
        loadingScreen.style.display = "none";

        // Show typing indicator for 3 seconds before greeting
        const typingBubble = addChatBubble(
          '<span class="typing-indicator"><span></span><span></span><span></span></span>',
          "ai"
        );

        // After 3 seconds, remove typing indicator and show Scott's greeting
        setTimeout(() => {
          typingBubble.remove();
          addScottGreeting();
        }, 3000); // Wait 3 seconds while "typing"
      }, 3100); // Wait for 3-second fade-out to complete
    }, 3000); // Wait 3 seconds before starting fade-out
  } catch (err) {
    console.error("Error loading products:", err);

    // Show error and hide loading screen
    productGrid.innerHTML =
      "<p>Error loading products. Please try again later.</p>";

    // Fade out even on error
    loadingScreen.classList.add("fade-out");
    mainContent.style.display = "grid";

    setTimeout(() => {
      loadingScreen.style.display = "none";

      // Show typing indicator even on error
      const typingBubble = addChatBubble(
        '<span class="typing-indicator"><span></span><span></span><span></span></span>',
        "ai"
      );

      setTimeout(() => {
        typingBubble.remove();
        addScottGreeting();
      }, 3000);
    }, 3100);
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

  // Save to localStorage whenever UI updates
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

function removeSelectedProduct(id) {
  selectedProducts = selectedProducts.filter((p) => p.id !== id);
  updateSelectedProductsUI();
  displayProducts();

  // Save to localStorage after removal
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* ================================
   DISPLAY PRODUCT GRID
================================ */
function displayProducts() {
  productGrid.innerHTML = "";

  const category = categoryFilter.value;

  // Get products that aren't already selected
  let visible = getVisibleProducts();

  // Filter by category if not "all"
  if (category && category !== "all") {
    visible = visible.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Filter by search query if user has typed something
  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase();
    visible = visible.filter((p) => {
      // Search in name, brand, category, and description
      return (
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    });
  }

  // Show message if no category selected and no search query
  if (category === "all" && searchQuery.trim() === "") {
    productGrid.innerHTML =
      "<p class='empty-message'>Select a category or search for products.</p>";
    return;
  }

  // Show message if no products match the filters
  if (visible.length === 0) {
    const message =
      searchQuery.trim() !== ""
        ? `No products found matching "${searchQuery}".`
        : "No products found in this category.";
    productGrid.innerHTML = `<p class='empty-message'>${message}</p>`;
    return;
  }

  // Display matching products
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
   EVENT: SEARCH INPUT
================================ */
// Show suggestions when user focuses on search input
searchInput.addEventListener("focus", () => {
  // Only show suggestions if search field is empty
  if (searchInput.value.trim() === "") {
    searchSuggestions.classList.remove("hidden");
  }
});

// Hide suggestions when user clicks outside
document.addEventListener("click", (e) => {
  // If click is outside search input and suggestions, hide dropdown
  if (
    !searchInput.contains(e.target) &&
    !searchSuggestions.contains(e.target)
  ) {
    searchSuggestions.classList.add("hidden");
  }
});

// Listen for user typing in the search field
searchInput.addEventListener("input", (e) => {
  // Update search query
  searchQuery = e.target.value;

  // Hide suggestions when user starts typing
  if (searchQuery.trim() !== "") {
    searchSuggestions.classList.add("hidden");
  } else {
    searchSuggestions.classList.remove("hidden");
  }

  // Re-display products with new search filter
  displayProducts();
});

// Handle clicking on a suggestion
searchSuggestions.addEventListener("click", (e) => {
  // Check if user clicked on a suggestion item
  const suggestionItem = e.target.closest(".suggestion-item");

  if (suggestionItem) {
    // Get the keyword from the data attribute
    const keyword = suggestionItem.dataset.keyword;

    // Set the search input value to the keyword
    searchInput.value = keyword;

    // Update search query and display products
    searchQuery = keyword;
    displayProducts();

    // Hide the suggestions dropdown
    searchSuggestions.classList.add("hidden");
  }
});

/* ================================
   EVENT: CLEAR SELECTED
================================ */
clearSelectedBtn.addEventListener("click", () => {
  selectedProducts = [];
  updateSelectedProductsUI();
  displayProducts();

  // Clear from localStorage when clearing all
  localStorage.removeItem("selectedProducts");
});

/* ================================
   EVENT: GENERATE ROUTINE
================================ */
if (generateRoutineBtn) {
  generateRoutineBtn.addEventListener("click", async () => {
    // STEP 1: Gather selected products (check if any exist)
    if (selectedProducts.length === 0) {
      addChatBubble(
        "Please select at least one product to generate your routine!",
        "ai"
      );
      return;
    }

    // STEP 2: Extract names and descriptions from products.json
    // (selectedProducts array already contains full product objects from products.json)
    const productData = selectedProducts.map((product) => ({
      name: product.name, // Product name
      brand: product.brand, // Product brand
      category: product.category, // Product category
      description: product.description, // Product description
    }));

    // Show loading indicator while waiting for AI response
    const loadingBubble = addChatBubble(
      '<span class="typing-indicator"><span></span><span></span><span></span></span>',
      "ai"
    );

    try {
      // STEP 3: Send product data to AI and ask it to create a routine
      const routineMessages = [
        {
          role: "system",
          content: `You are Scott, a friendly L'Oréal beauty advisor. Create a step-by-step daily beauty routine using ONLY the provided products.

Follow these formatting rules from generate-routine.md:

## 🧼 Step 1: Cleanse
- Short, clear sentence (max 1–2 lines)
- Include product name and brand
- Simple instructions

## 💧 Step 2: Tone (Optional)
- Brief purpose of step
- Beginner-friendly language
          
## 🧴 Step 3: Treat
- Serum, actives, or targeted treatments
- Simple caution for strong ingredients (AHA, BHA, retinol)

## 🧽 Step 4: Moisturize
- One sentence explaining how to apply
- Mention morning/night variations if needed

## 🔆 Step 5: SPF (AM only)
- Keep it VERY simple
- Reminder: at least SPF 30

Use bullet points, not paragraphs. Do not use hashtags or stars for emphasis. Keep language at 8th-grade reading level. Use consistent emoji headers. End with a "Quick Highlights" summary and a follow-up question related to the products selected.`,
        },
        {
          role: "user",
          content: `Create a daily beauty routine using these L'Oréal products:\n\n${productData
            .map(
              (p, index) =>
                `${index + 1}. **${p.name}** by ${p.brand}\n   - Category: ${
                  p.category
                }\n   - Description: ${p.description}`
            )
            .join(
              "\n\n"
            )}\n\nPlease format according to the generate-routine.md structure.`,
        },
      ];

      // Send request to Cloudflare Worker (which forwards to OpenAI)
      const response = await fetch(
        "https://round-hill-afb6.rherma26-a5b.workers.dev/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: routineMessages, // Send product data and instructions
            max_tokens: 1000, // Allow up to 1000 tokens for longer responses
            temperature: 0.7, // Controls creativity (0.7 is balanced)
          }),
        }
      );

      // Parse the response from the API
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

      // Get the raw AI-generated routine
      const aiRoutine = data.choices[0].message.content;

      // STEP 4: Parse the response through generate-routine.md formatting rules
      const formattedRoutine = formatRoutineResponse(aiRoutine);

      // STEP 5: Display the parsed response in the chatbox
      addChatBubble(formattedRoutine, "ai");

      // Add to conversation history for follow-up questions
      conversationHistory.push({
        role: "user",
        content: `Create a beauty routine with these products: ${productData
          .map((p) => p.name)
          .join(", ")}`,
      });
      conversationHistory.push({
        role: "assistant",
        content: aiRoutine,
      });
    } catch (error) {
      console.error("Error generating routine:", error);

      // Show error message in the chatbox
      addChatBubble(
        "Sorry, I couldn't generate your routine. Please try again later.",
        "ai"
      );
    } finally {
      // Remove the loading indicator
      loadingBubble.remove();
    }
  });
} else {
  console.error("❌ Generate Routine button NOT found in DOM!"); // Debug log
}

/* ================================
   HELPER: FORMAT ROUTINE RESPONSE
================================ */
function formatRoutineResponse(rawRoutine) {
  // This function parses the AI response and converts Markdown to HTML

  let formatted = "";

  // Add title with emojis
  formatted += "<h2>✨ Your Daily Beauty Routine ✨</h2><hr>";

  // Split response into lines for parsing
  const lines = rawRoutine.split("\n");

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (trimmedLine.length === 0) return;

    // Detect Markdown headers (## heading) and convert to HTML
    if (trimmedLine.startsWith("##")) {
      // Remove the ## and convert to <h3>
      const headerText = trimmedLine.replace(/^##\s*/, "");
      formatted += `<h3>${headerText}</h3>`;
      return;
    }

    // Detect single # headers (less common but handle it)
    if (trimmedLine.startsWith("#") && !trimmedLine.startsWith("##")) {
      const headerText = trimmedLine.replace(/^#\s*/, "");
      formatted += `<h2>${headerText}</h2>`;
      return;
    }

    // Detect product names with **bold** markdown
    if (trimmedLine.includes("**")) {
      // Convert **text** to <strong>text</strong>
      const boldConverted = trimmedLine.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
      );
      formatted += `<p>${boldConverted}</p>`;
      return;
    }

    // Detect bullet points (- or •)
    if (trimmedLine.startsWith("-") || trimmedLine.startsWith("•")) {
      // Remove the bullet symbol and add margin
      const bulletText = trimmedLine.replace(/^[-•]\s*/, "");
      formatted += `<p style="margin-left: 20px;">• ${bulletText}</p>`;
      return;
    }

    // Detect "Quick Highlights" or similar sections
    if (
      trimmedLine.toLowerCase().includes("quick highlight") ||
      trimmedLine.toLowerCase().includes("pro tip")
    ) {
      formatted += `<h3>💡 ${trimmedLine}</h3>`;
      return;
    }

    // Regular text - just wrap in <p> tags
    formatted += `<p>${trimmedLine}</p>`;
  });

  return formatted;
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

    // Save to localStorage after adding product
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
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
   SECTION TOGGLE FUNCTIONALITY
================================ */
// Add click event listeners to all toggle buttons
toggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Find the parent section
    const section = button.closest("section");

    // Find the content to toggle
    const content = section.querySelector(".section-content");

    if (!content) return;

    // Toggle the collapsed state
    const isCollapsed = content.classList.contains("collapsed");

    if (isCollapsed) {
      // Expand the section
      content.classList.remove("collapsed");
      button.textContent = "−"; // Change to minus sign
      button.setAttribute("aria-label", `Hide ${section.className} section`);
    } else {
      // Collapse the section
      content.classList.add("collapsed");
      button.textContent = "+"; // Change to plus sign
      button.setAttribute("aria-label", `Show ${section.className} section`);
    }
  });
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

/* ================================
   SCOTT'S GREETING
================================ */
function addScottGreeting() {
  // First part of Scott's greeting
  const greeting1 = `
    <p>Hi there! I'm Scott, your L'Oréal beauty advisor! 💄✨</p>
    <p>I'm here to help you:</p>
    <ul>
      <li>🔍 Browse our amazing L'Oréal products</li>
      <li>✨ Create personalized beauty routines</li>
      <li>💡 Get expert skincare, makeup, and haircare tips</li>
    </ul>
  `;

  // Add first part of greeting
  addChatBubble(greeting1, "ai");

  // Show typing indicator for 2 seconds
  const typingBubble = addChatBubble(
    '<span class="typing-indicator"><span></span><span></span><span></span></span>',
    "ai"
  );

  // After 2 seconds, remove typing indicator and show second part
  setTimeout(() => {
    typingBubble.remove();

    // Second part of Scott's greeting
    const greeting2 = `
      <p>Select some products from the grid and I'll help you build your perfect routine! What are you looking for today? 😊</p>
    `;

    addChatBubble(greeting2, "ai");
  }, 2000); // Wait 2 seconds
}
