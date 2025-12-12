// routes/chat.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Groq API Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Fast and capable - great for JSON extraction
// Alternative models:
// 'mixtral-8x7b-32768' - Good balance of speed and capability
// 'llama-3.1-70b-versatile' - Very capable
// 'gemma2-9b-it' - Faster, lighter weight

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Simple intent classifier - checks before calling AI
function quickIntentCheck(message) {
  const lowerMsg = message.toLowerCase().trim();
  
  // Greetings and casual conversation patterns
  const conversationPatterns = [
    /^(hi|hello|hey|sup|yo|hola|greetings)([!.,?\s]|$)/i,
    /^(good morning|good afternoon|good evening)([!.,?\s]|$)/i,
    /^(how are you|how's it going|what's up|wassup)([!.,?\s]|$)/i,
    /^(thanks|thank you|thx|ty)([!.,?\s]|$)/i,
    /^(bye|goodbye|see ya|later|gtg)([!.,?\s]|$)/i,
    /^(ok|okay|cool|nice|great|awesome)([!.,?\s]|$)/i,
  ];
  
  // Service/help questions
  const helpPatterns = [
    /what (can|do) you (do|help)/i,
    /how (can|do) you (work|help)/i,
    /tell me about (yourself|you|this)/i,
    /what is this/i,
    /who are you/i,
  ];
  
  // Check if it's definitely a conversation
  for (const pattern of conversationPatterns) {
    if (pattern.test(lowerMsg)) {
      return 'conversation';
    }
  }
  
  for (const pattern of helpPatterns) {
    if (pattern.test(lowerMsg)) {
      return 'conversation';
    }
  }
  
  // Product search indicators - must have at least one
  const searchIndicators = [
    /\b(show|find|search|look|looking for|need|want|get me)\b/i,
    /\b(dress|shirt|pants|jeans|shoes|jacket|coat|skirt|blazer|suit)\b/i,
    /\b(under|over|less than|more than|between)\s*\$?\d+/i,
    /\b(red|blue|black|white|green|yellow|pink|purple|orange|brown|gray)\b/i,
    /\b(small|medium|large|xs|s|m|l|xl|xxl)\b/i,
  ];
  
  // If message is very short and has no search indicators, probably conversation
  if (lowerMsg.length < 15 && !searchIndicators.some(pattern => pattern.test(lowerMsg))) {
    return 'conversation';
  }
  
  // Otherwise, let AI decide
  return null;
}

// In-memory conversation store (use Redis in production)
const conversationStore = new Map();
const CONVERSATION_TTL = 30 * 60 * 1000; // 30 minutes

// Enhanced system prompt with navigation logic
const SYSTEM_PROMPT = `You are a fashion e-commerce assistant that converts natural language queries into structured search parameters AND determines navigation actions.

CRITICAL: First determine if the user is actually searching for products or just conversating casually.

Your task is to analyze user messages and extract relevant search parameters for a product database, plus decide what page the user should be on.

Available parameters:
- q: Main search query (string) - extract the core product description
- category: Product category (string) - e.g., "dress", "shirt", "pants", "shoes", "accessories"
- priceMin: Minimum price (number)
- priceMax: Maximum price (number)
- colors: Array of colors (array of strings) - e.g., ["black", "red", "blue"]
- sizes: Array of sizes (array of strings) - e.g., ["S", "M", "L", "XL"]
- occasion: Event type (string) - e.g., "wedding", "party", "casual", "formal", "business"
- style: Style preference (string) - e.g., "modern", "vintage", "bohemian", "classic"

Navigation actions:
- "conversation": User is just chatting, greeting, asking about the service, or casual talk (e.g., "hello", "hi", "how are you", "what can you do", "thanks")
- "search_products": User is searching for products → navigate to /suggestions
- "view_product": User wants details about a specific product → navigate to /products/:id
- "general_question": User asking questions about fashion, style advice, but NOT searching for specific products
- "refine_search": User is refining previous search on the same page
- "compare_products": User wants to compare specific products

Context awareness:
- currentPage: The page user is currently on (e.g., "/", "/suggestions", "/products/123")
- previousResults: Products from the last search (if available)
- If user is on /suggestions and asks to "show me more details about the first one", set action to "view_product"
- If user is on /products/:id and asks "show me similar products", do a search with action "search_products"
- If user asks specific questions about a product they're viewing, keep them on the same page with action "general_question"

Important rules:
1. DETERMINE USER INTENT FIRST:
   - Greetings/casual chat → action: "conversation", searchParams can be null
   - General questions about service/capabilities → action: "conversation"
   - Fashion advice without product search → action: "general_question", searchParams can be null
   - Actual product search intent → action: "search_products", extract searchParams
   
2. Extract ALL relevant information from the user's message ONLY if they're searching for products
3. Consider conversation history to maintain context
4. If user refines their search (e.g., "make it red" or "under $100"), update only the relevant parameters and set action to "refine_search"
5. Keep the main query (q) descriptive but concise
6. Infer categories from context (e.g., "party dress" → category: "dress")
7. When user references products by position ("the first one", "the third product"), extract that info in productReference
8. Determine appropriate navigation action based on user intent
9. For product-specific questions on product page, provide helpful answers without navigation

Examples of "conversation" action:
- "hello", "hi", "hey", "good morning"
- "how are you", "what's up"
- "what can you help me with", "what do you do"
- "thanks", "thank you", "goodbye"
- "tell me about yourself"

Examples of "general_question" action:
- "what's trending in fashion"
- "how should I dress for a wedding"
- "what colors go well together"
- "fashion tips for summer"

Examples of "search_products" action:
- "show me red dresses"
- "I need a black blazer under $100"
- "looking for casual summer outfits"
- "find me running shoes"

You must respond ONLY with valid JSON in this exact format:
{
  "searchParams": {
    "q": "search query here or null if not searching",
    "category": "category name or null",
    "priceMin": number or null,
    "priceMax": number or null,
    "colors": ["color1"] or null,
    "sizes": ["S", "M"] or null,
    "k": 20,
    "limit": 10
  },
  "action": "conversation | search_products | view_product | general_question | refine_search | compare_products",
  "productReference": {
    "position": number or null,
    "productId": "string or null"
  },
  "userIntent": "brief description of what user wants",
  "conversationSummary": "friendly response to show user (be enthusiastic and helpful)"
}

IMPORTANT: 
- If action is "conversation", set searchParams.q to null
- If action is "general_question" and user is NOT searching for products, set searchParams.q to null
- Only populate searchParams when user is actually searching for products

Do not include any markdown, explanations, or additional text. Only output the JSON object.`;

// Clean conversation history
function cleanupConversations() {
  const now = Date.now();
  for (const [sessionId, data] of conversationStore.entries()) {
    if (now - data.lastActivity > CONVERSATION_TTL) {
      conversationStore.delete(sessionId);
    }
  }
}

// Get or create conversation session
function getConversation(sessionId) {
  if (!conversationStore.has(sessionId)) {
    conversationStore.set(sessionId, {
      messages: [],
      searchHistory: [],
      lastResults: [],
      lastActivity: Date.now()
    });
  }
  const conv = conversationStore.get(sessionId);
  conv.lastActivity = Date.now();
  return conv;
}

// Call Groq API
async function callGroq(conversation, userMessage, currentPage) {
  try {
    // Build context from conversation history
    let contextText = '';
    
    // Add current page context
    contextText += `Current page: ${currentPage}\n\n`;
    
    // Add recent conversation (last 5 exchanges)
    const recentMessages = conversation.messages.slice(-10);
    if (recentMessages.length > 0) {
      contextText += 'Previous conversation:\n';
      recentMessages.forEach(msg => {
        contextText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      contextText += '\n';
    }
    
    // Add last search results if available
    if (conversation.lastResults && conversation.lastResults.length > 0) {
      contextText += 'Previous search results:\n';
      conversation.lastResults.slice(0, 5).forEach((product, idx) => {
        contextText += `${idx + 1}. ${product.name} - $${product.price} (ID: ${product._id})\n`;
      });
      contextText += '\n';
    }
    
    contextText += `Current user message: ${userMessage}`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: contextText
          }
        ],
        temperature: 0.2,
        max_tokens: 2048,
        top_p: 0.95,
        response_format: { type: "json_object" } // Forces JSON output
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid Groq API response');
    }

    let responseText = response.data.choices[0].message.content;
    
    // Clean up response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON
    const parsed = JSON.parse(responseText);
    return parsed;

  } catch (error) {
    console.error('Groq API error:', error.response?.data || error.message);
    
    // Fallback response if Groq fails
    return {
      searchParams: {
        q: userMessage,
        category: null,
        priceMin: null,
        priceMax: null,
        colors: null,
        sizes: null,
        k: 20,
        limit: 10
      },
      action: 'search_products',
      productReference: {
        position: null,
        productId: null
      },
      userIntent: 'Search for products',
      conversationSummary: "I'll search for that. Let me find what you're looking for!"
    };
  }
}

// Call internal search API
async function performSearch(searchParams, req) {
  try {
    const protocol = req.protocol;
    const host = req.get('host');
    const searchUrl = `${protocol}://${host}/api/vector/search`;

    const response = await axios.post(searchUrl, searchParams, {
      timeout: 25000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Search API error:', error.message);
    throw new Error('Failed to search products');
  }
}

// Main chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId, currentPage = '/' } = req.body;

    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'message (non-empty string) is required' 
      });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ 
        ok: false, 
        error: 'sessionId (string) is required' 
      });
    }

    // Cleanup old conversations periodically
    if (Math.random() < 0.1) cleanupConversations();

    // Get conversation history
    const conversation = getConversation(sessionId);
    
    // Add current user message to history
    const userMessage = { role: 'user', content: message };
    conversation.messages.push(userMessage);

    // Quick intent check - skip AI for obvious conversations
    const quickIntent = quickIntentCheck(message);
    
    if (quickIntent === 'conversation') {
      console.log('Quick intent: conversation - skipping AI call');
      
      // Generate a friendly response based on the message
      let conversationSummary = "Hello! I'm your fashion assistant. I can help you find dresses, shirts, shoes, and more. What are you looking for today?";
      
      const lowerMsg = message.toLowerCase().trim();
      if (lowerMsg.match(/^(hi|hello|hey)/)) {
        conversationSummary = "Hello! 👋 I'm here to help you find the perfect outfit. What are you shopping for today?";
      } else if (lowerMsg.includes('thank')) {
        conversationSummary = "You're welcome! Feel free to ask if you need help finding anything else.";
      } else if (lowerMsg.match(/bye|goodbye/)) {
        conversationSummary = "Goodbye! Come back anytime you need fashion help!";
      } else if (lowerMsg.includes('what') && (lowerMsg.includes('do') || lowerMsg.includes('help'))) {
        conversationSummary = "I can help you find fashion items! Just tell me what you're looking for - like 'show me red dresses under $100' or 'find me casual shoes'. I can search by color, price, size, style, and more!";
      } else if (lowerMsg.match(/how are you|what's up/)) {
        conversationSummary = "I'm doing great, thanks for asking! Ready to help you find some amazing fashion items. What can I help you discover today?";
      }
      
      conversation.messages.push({
        role: 'assistant',
        content: conversationSummary
      });
      
      return res.json({
        ok: true,
        message: conversationSummary,
        userIntent: 'Casual conversation',
        action: 'conversation',
        searchParams: null,
        results: [],
        resultCount: 0,
        navigationPath: null,
        productId: null,
        sessionId,
        tookMs: 0
      });
    }

    // Call Groq to extract search parameters and determine action
    console.log('Calling Groq with message:', message);
    const aiResponse = await callGroq(conversation, message, currentPage);

    console.log('Groq response:', JSON.stringify(aiResponse, null, 2));

    const { searchParams, action, productReference, userIntent, conversationSummary } = aiResponse;

    let searchResults = null;
    let navigationPath = null;
    let productId = null;

    // Handle different actions
    if (action === 'conversation' || action === 'general_question') {
      // User is just chatting or asking general questions - no search needed
      // searchParams.q should be null for these cases
      
      // Update conversation history
      conversation.messages.push({
        role: 'assistant',
        content: conversationSummary || 'How can I help you today?'
      });

      return res.json({
        ok: true,
        message: conversationSummary,
        userIntent,
        action,
        searchParams: null,
        results: [],
        resultCount: 0,
        navigationPath: null,
        productId: null,
        sessionId,
        tookMs: 0
      });

    } else if (action === 'search_products' || action === 'refine_search') {
      if (!searchParams || !searchParams.q) {
        return res.status(400).json({
          ok: false,
          error: 'Could not understand the search query. Please be more specific.'
        });
      }

      // Perform the search
      console.log('Performing search with params:', searchParams);
      searchResults = await performSearch(searchParams, req);
      
      // Store results in conversation
      conversation.lastResults = searchResults.results || [];
      
      // Set navigation
      if (currentPage !== '/suggestions') {
        navigationPath = '/suggestions';
      }

      // Store search in history
      conversation.searchHistory.push({
        timestamp: Date.now(),
        query: message,
        searchParams,
        resultCount: searchResults.results?.length || 0
      });

    } else if (action === 'view_product') {
      // User wants to view a specific product
      if (productReference?.productId) {
        productId = productReference.productId;
        navigationPath = `/products/${productId}`;
      } else if (productReference?.position && conversation.lastResults?.length > 0) {
        // Get product by position from last results
        const position = productReference.position - 1; // Convert to 0-based index
        if (position >= 0 && position < conversation.lastResults.length) {
          const product = conversation.lastResults[position];
          productId = product._id;
          navigationPath = `/products/${productId}`;
        }
      }
      
      // Update conversation history
      conversation.messages.push({
        role: 'assistant',
        content: conversationSummary || 'Let me show you that product.'
      });

      return res.json({
        ok: true,
        message: conversationSummary,
        userIntent,
        action,
        searchParams: null,
        results: [],
        resultCount: 0,
        navigationPath,
        productId,
        sessionId,
        tookMs: 0
      });
    }

    // Update conversation history
    conversation.messages.push({
      role: 'assistant',
      content: conversationSummary || 'How can I help you further?'
    });

    // Return results
    return res.json({
      ok: true,
      message: conversationSummary,
      userIntent,
      action,
      searchParams: action === 'search_products' || action === 'refine_search' ? searchParams : null,
      results: searchResults?.results || [],
      resultCount: searchResults?.results?.length || 0,
      navigationPath,
      productId,
      sessionId,
      tookMs: searchResults?.tookMs || 0
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get conversation history
router.get('/chat/history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!conversationStore.has(sessionId)) {
      return res.json({
        ok: true,
        messages: [],
        searchHistory: []
      });
    }

    const conversation = getConversation(sessionId);
    return res.json({
      ok: true,
      messages: conversation.messages,
      searchHistory: conversation.searchHistory
    });
  } catch (error) {
    console.error('History endpoint error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Clear conversation
router.delete('/chat/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    conversationStore.delete(sessionId);
    return res.json({
      ok: true,
      message: 'Conversation cleared'
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;