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

module.exports = router;
