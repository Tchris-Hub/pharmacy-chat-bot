const express = require('express');
const { z } = require('zod');
const supabase = require('../config/supabase');
const validate = require('../middleware/validate');

const router = express.Router();

// No authentication required for AI endpoints (public read-only)

/**
 * GET /api/ai/faqs
 * Get all FAQs for AI knowledge base
 */
router.get('/faqs', async (req, res, next) => {
    try {
        const { data: faqs, error } = await supabase
            .from('faqs')
            .select('id, question, answer, category, priority')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: faqs,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/ai/medicines
 * Get all medicines with stock information
 */
router.get('/medicines', async (req, res, next) => {
    try {
        const { data: medicines, error } = await supabase
            .from('medicines')
            .select('id, name, description, stock_quantity, price, category, requires_prescription')
            .order('name');

        if (error) throw error;

        res.json({
            success: true,
            data: medicines,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/ai/medicines/:id/stock
 * Check specific medicine stock status
 */
const medicineIdSchema = z.object({
    id: z.string().uuid('Invalid medicine ID'),
});

router.get('/medicines/:id/stock', validate(medicineIdSchema, 'params'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: medicine, error } = await supabase
            .from('medicines')
            .select('id, name, stock_quantity')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!medicine) {
            return res.status(404).json({
                success: false,
                error: 'Medicine not found',
            });
        }

        // Determine stock status
        let status = 'in_stock';
        if (medicine.stock_quantity === 0) {
            status = 'out_of_stock';
        } else if (medicine.stock_quantity < 10) {
            status = 'low_stock';
        }

        res.json({
            success: true,
            data: {
                id: medicine.id,
                name: medicine.name,
                stock_quantity: medicine.stock_quantity,
                status,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/ai/ask
 * Main AI chatbot endpoint
 * Handles user questions with symptom support, medicine queries, and FAQs
 */
const { classifyQuery, QUERY_TYPES } = require('../services/queryClassifier');
const { searchBySymptom, searchByName, checkAvailability } = require('../services/medicineSearch');
const { searchFAQs } = require('../services/faqSearch');
const { validateResponse } = require('../services/safetyValidator');
const { generateResponse } = require('../services/aiResponseGenerator');

const askSchema = z.object({
    message: z.string().min(1).max(500, 'Message too long'),
    conversationId: z.string().uuid().optional(),
});

router.post('/ask', validate(askSchema), async (req, res, next) => {
    try {
        const { message, conversationId } = req.body;

        // Step 1: Classify the query
        const { type: queryType, confidence } = classifyQuery(message);

        // Step 2: Search database based on query type
        let searchResults = {};
        let medicines = [];
        let categories = [];

        if (queryType === QUERY_TYPES.SYMPTOM) {
            // Search by symptom
            medicines = await searchBySymptom(message, 10);
            categories = [...new Set(medicines.map(m => m.category))];
            searchResults = { medicines, categories };
        } else if (queryType === QUERY_TYPES.MEDICINE) {
            // Search for specific medicine
            const medicine = await checkAvailability(message);
            searchResults = { medicine };
            if (medicine) medicines = [medicine];
        } else if (queryType === QUERY_TYPES.FAQ) {
            // Search FAQs
            const faqs = await searchFAQs(message, 5);
            searchResults = { faqs };
        }

        // Step 3: Generate AI response
        const aiResult = await generateResponse({
            queryType,
            userMessage: message,
            searchResults,
            context: { conversationId },
        });

        // Step 4: Validate response for safety
        const validation = validateResponse(aiResult.text, {
            userMessage: message,
            medicines,
            queryType,
        });

        // If not safe, use fallback
        if (!validation.safe) {
            return res.json({
                success: true,
                data: {
                    response: validation.fallbackMessage,
                    queryType,
                    confidence,
                    suggestions: [],
                    disclaimer: 'Please consult our pharmacist for personalized advice.',
                },
            });
        }

        // If emergency, return emergency message
        if (validation.isEmergency) {
            return res.json({
                success: true,
                data: {
                    response: validation.response,
                    queryType: 'EMERGENCY',
                    isEmergency: true,
                    disclaimer: validation.disclaimer,
                },
            });
        }

        // Step 5: Build response with suggestions
        const suggestions = medicines.slice(0, 5).map(med => ({
            id: med.id,
            name: med.name,
            category: med.category,
            price: med.price,
            inStock: med.stock_quantity > 0,
            requiresPrescription: med.requires_prescription,
        }));

        res.json({
            success: true,
            data: {
                response: validation.response,
                queryType,
                confidence,
                suggestions,
                warnings: validation.warnings || [],
                disclaimer: validation.disclaimer,
                conversationId: conversationId || null,
                usedGemini: aiResult.usedGemini, // NEW: Indicates if Gemini was used
            },
        });
    } catch (error) {
        console.error('AI ask error:', error);
        next(error);
    }
});

module.exports = router;
