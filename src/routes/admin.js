const express = require('express');
const { z } = require('zod');
const supabase = require('../config/supabase');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);

// ============ MEDICINE MANAGEMENT ============

// Validation schemas
const createMedicineSchema = z.object({
    name: z.string().min(1, 'Medicine name is required'),
    description: z.string().optional(),
    stock_quantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
    price: z.number().positive('Price must be positive').optional(),
    category: z.string().optional(),
    requires_prescription: z.boolean().optional(),
});

const updateMedicineSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    stock_quantity: z.number().int().min(0).optional(),
    price: z.number().positive().optional(),
    category: z.string().optional(),
    requires_prescription: z.boolean().optional(),
});

const medicineIdSchema = z.object({
    id: z.string().uuid('Invalid medicine ID'),
});

/**
 * GET /api/admin/medicines
 * List all medicines with pagination
 */
router.get('/medicines', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const { data: medicines, error, count } = await supabase
            .from('medicines')
            .select('*', { count: 'exact' })
            .order('name')
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                medicines,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/medicines
 * Create new medicine
 */
router.post('/medicines', validate(createMedicineSchema), async (req, res, next) => {
    try {
        const { data: medicine, error } = await supabase
            .from('medicines')
            .insert(req.body)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: medicine,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/admin/medicines/:id
 * Update medicine
 */
router.put('/medicines/:id', validate(medicineIdSchema, 'params'), validate(updateMedicineSchema), async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: medicine, error } = await supabase
            .from('medicines')
            .update(req.body)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!medicine) {
            return res.status(404).json({
                success: false,
                error: 'Medicine not found',
            });
        }

        res.json({
            success: true,
            data: medicine,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/admin/medicines/:id
 * Delete medicine
 */
router.delete('/medicines/:id', validate(medicineIdSchema, 'params'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('medicines')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Medicine deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

// ============ FAQ MANAGEMENT ============

// Validation schemas
const createFaqSchema = z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
    category: z.string().optional(),
    priority: z.number().int().optional(),
});

const updateFaqSchema = z.object({
    question: z.string().min(1).optional(),
    answer: z.string().min(1).optional(),
    category: z.string().optional(),
    priority: z.number().int().optional(),
});

const faqIdSchema = z.object({
    id: z.string().uuid('Invalid FAQ ID'),
});

/**
 * GET /api/admin/faqs
 * List all FAQs with pagination
 */
router.get('/faqs', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const { data: faqs, error, count } = await supabase
            .from('faqs')
            .select('*', { count: 'exact' })
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                faqs,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/admin/faqs
 * Create new FAQ
 */
router.post('/faqs', validate(createFaqSchema), async (req, res, next) => {
    try {
        const { data: faq, error } = await supabase
            .from('faqs')
            .insert(req.body)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: faq,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/admin/faqs/:id
 * Update FAQ
 */
router.put('/faqs/:id', validate(faqIdSchema, 'params'), validate(updateFaqSchema), async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: faq, error } = await supabase
            .from('faqs')
            .update(req.body)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!faq) {
            return res.status(404).json({
                success: false,
                error: 'FAQ not found',
            });
        }

        res.json({
            success: true,
            data: faq,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/admin/faqs/:id
 * Delete FAQ
 */
router.delete('/faqs/:id', validate(faqIdSchema, 'params'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('faqs')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'FAQ deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
