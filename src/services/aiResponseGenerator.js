const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AI Response Generator using Google Gemini
 * Generates friendly, safe pharmacy assistant responses
 */

// Initialize Gemini
let genAI;
let model;

function initializeGemini() {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  GEMINI_API_KEY not set. AI responses will be disabled.');
        return false;
    }

    try {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        console.log('✅ Gemini AI initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Gemini initialization error:', error.message);
        return false;
    }
}

// System prompt for the AI
const SYSTEM_PROMPT = `You are a friendly pharmacy assistant chatbot. Your tone is warm, conversational, and helpful.

STRICT RULES YOU MUST FOLLOW:
1. NEVER diagnose medical conditions
2. NEVER prescribe medications
3. NEVER give dosage instructions
4. NEVER tell users what medication to take
5. NEVER claim to cure diseases
6. Only provide factual information about product availability
7. Always redirect complex medical questions to a pharmacist

YOUR ROLE:
- Help users find products in the pharmacy
- Answer questions about store hours, delivery, payment, etc.
- Provide general information about product categories
- Be friendly and conversational (use "Hey!", "What's up?", etc.)

RESPONSE STYLE:
- Keep responses concise (2-3 sentences max)
- Use friendly, casual language
- Use emojis occasionally 😊
- Be helpful and warm

When discussing medicines for symptoms:
- Say "we have products that may help" instead of "you should take"
- Mention categories, not specific recommendations
- Always suggest speaking with the pharmacist for personalized advice`;

/**
 * Generate AI response
 * @param {Object} params - Generation parameters
 * @returns {Promise<Object>} Generated response with metadata
 */
async function generateResponse({ queryType, userMessage, searchResults, context = {} }) {
    // Try to initialize if not done or if previous init failed
    if (!model) {
        const initialized = initializeGemini();
        if (!initialized) {
            console.log('⚠️  Using fallback response - Gemini not initialized');
            return {
                text: getFallbackResponse(queryType, searchResults),
                usedGemini: false,
            };
        }
    }

    try {
        // Build the prompt based on query type
        const prompt = buildPrompt(queryType, userMessage, searchResults, context);

        // Generate response with timeout
        const result = await Promise.race([
            model.generateContent(prompt),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Gemini API timeout')), 10000)
            )
        ]);

        const response = result.response;
        const text = response.text();

        console.log('✅ Gemini response generated successfully');
        return {
            text,
            usedGemini: true,
        };
    } catch (error) {
        console.error('❌ Gemini API error:', error.message);

        // If it's an API key error, reset model to try reinitializing next time
        if (error.message && error.message.includes('API key')) {
            console.error('⚠️  API key issue detected - will retry initialization on next request');
            model = null;
        }

        return {
            text: getFallbackResponse(queryType, searchResults),
            usedGemini: false,
        };
    }
}

/**
 * Build prompt for Gemini
 * @param {string} queryType - Type of query
 * @param {string} userMessage - User's message
 * @param {Object} searchResults - Database search results
 * @param {Object} context - Additional context
 * @returns {string} Complete prompt
 */
function buildPrompt(queryType, userMessage, searchResults, context) {
    let prompt = `${SYSTEM_PROMPT}\n\n`;

    prompt += `USER QUESTION: "${userMessage}"\n\n`;
    prompt += `QUERY TYPE: ${queryType}\n\n`;

    // Add search results based on type
    if (queryType === 'SYMPTOM') {
        prompt += buildSymptomPrompt(searchResults);
    } else if (queryType === 'MEDICINE') {
        prompt += buildMedicinePrompt(searchResults);
    } else if (queryType === 'FAQ') {
        prompt += buildFAQPrompt(searchResults);
    } else {
        prompt += buildGeneralPrompt();
    }

    prompt += `\n\nGenerate a friendly, helpful response. Remember: be conversational, don't diagnose or prescribe, and keep it brief!`;

    return prompt;
}

/**
 * Build prompt for symptom queries
 */
function buildSymptomPrompt(searchResults) {
    const { medicines = [], categories = [] } = searchResults;

    let prompt = `AVAILABLE PRODUCTS:\n`;

    if (medicines.length === 0) {
        prompt += `No specific products found in our database.\n`;
    } else {
        prompt += `We have ${medicines.length} products that might help:\n`;
        medicines.slice(0, 5).forEach(med => {
            prompt += `- ${med.name} (${med.category}) - $${med.price || 'N/A'} - ${med.stock_quantity > 0 ? 'In stock' : 'Out of stock'}${med.requires_prescription ? ' [Prescription required]' : ''}\n`;
        });
    }

    if (categories.length > 0) {
        prompt += `\nRELEVANT CATEGORIES: ${categories.join(', ')}\n`;
    }

    prompt += `\nIMPORTANT: Do NOT recommend specific products. Just mention that we have options available and suggest speaking with the pharmacist.`;

    return prompt;
}

/**
 * Build prompt for medicine queries
 */
function buildMedicinePrompt(searchResults) {
    const { medicine } = searchResults;

    let prompt = `PRODUCT INFORMATION:\n`;

    if (!medicine) {
        prompt += `This product was not found in our inventory.\n`;
    } else {
        prompt += `Name: ${medicine.name}\n`;
        prompt += `Category: ${medicine.category}\n`;
        prompt += `Price: $${medicine.price || 'N/A'}\n`;
        prompt += `Stock: ${medicine.stock_quantity > 0 ? `${medicine.stock_quantity} available` : 'Out of stock'}\n`;
        prompt += `Prescription: ${medicine.requires_prescription ? 'Required' : 'Not required'}\n`;
        if (medicine.description) {
            prompt += `Description: ${medicine.description}\n`;
        }
    }

    return prompt;
}

/**
 * Build prompt for FAQ queries
 */
function buildFAQPrompt(searchResults) {
    const { faqs = [] } = searchResults;

    let prompt = `RELEVANT FAQs:\n`;

    if (faqs.length === 0) {
        prompt += `No specific FAQ found. Provide a general helpful response.\n`;
    } else {
        faqs.slice(0, 3).forEach(faq => {
            prompt += `Q: ${faq.question}\n`;
            prompt += `A: ${faq.answer}\n\n`;
        });
    }

    return prompt;
}

/**
 * Build prompt for general queries
 */
function buildGeneralPrompt() {
    return `This is a general greeting or question. Respond warmly and ask how you can help them today.`;
}

/**
 * Get fallback response when AI is unavailable
 */
function getFallbackResponse(queryType, searchResults) {
    if (queryType === 'SYMPTOM') {
        const { medicines = [] } = searchResults;
        if (medicines.length > 0) {
            return `Hey! We have some products that might help with that. I found ${medicines.length} options in our inventory. Want me to tell you more, or would you like to speak with our pharmacist for personalized advice? 😊`;
        }
        return `Hey! I'd love to help you find something for that. Let me connect you with our pharmacist who can give you the best advice! 😊`;
    }

    if (queryType === 'MEDICINE') {
        const { medicine } = searchResults;
        if (medicine) {
            return `Yes! We have ${medicine.name} in stock. ${medicine.stock_quantity} available at $${medicine.price || 'N/A'}. ${medicine.requires_prescription ? 'You\'ll need a prescription for this one.' : 'No prescription needed!'} 😊`;
        }
        return `Hmm, I couldn't find that exact product in our system. Want me to check for something similar, or would you like to speak with our pharmacist? 😊`;
    }

    if (queryType === 'FAQ') {
        const { faqs = [] } = searchResults;
        if (faqs.length > 0) {
            return faqs[0].answer;
        }
        return `Great question! Let me connect you with our team who can help with that. You can also call us or check our website for more info! 😊`;
    }

    return `Hey there! 👋 What can I help you find today?`;
}

module.exports = {
    generateResponse,
    initializeGemini,
};
