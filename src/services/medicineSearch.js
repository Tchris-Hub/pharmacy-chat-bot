const Fuse = require('fuse.js');
const supabase = require('../config/supabase');
const { mapSymptomToCategories } = require('./symptomMapper');

/**
 * Medicine Search Service
 * Searches medicines with fuzzy matching and category filtering
 */

// Medicine name synonyms
const synonyms = {
    tylenol: 'paracetamol',
    acetaminophen: 'paracetamol',
    advil: 'ibuprofen',
    motrin: 'ibuprofen',
    zantac: 'ranitidine',
    prilosec: 'omeprazole',
    claritin: 'loratadine',
    zyrtec: 'cetirizine',
};

/**
 * Search medicines by name with fuzzy matching
 * @param {string} query - Medicine name to search
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Matching medicines
 */
async function searchByName(query, limit = 10) {
    if (!query) return [];

    // Check for synonyms
    const lowerQuery = query.toLowerCase().trim();
    const searchTerm = synonyms[lowerQuery] || lowerQuery;

    // Get all medicines from database
    const { data: medicines, error } = await supabase
        .from('medicines')
        .select('*')
        .limit(100);

    if (error) {
        console.error('Medicine search error:', error);
        return [];
    }

    // Use Fuse.js for fuzzy matching
    const fuse = new Fuse(medicines, {
        keys: ['name', 'description', 'category'],
        threshold: 0.4, // Lower = more strict
        includeScore: true,
    });

    const results = fuse.search(searchTerm);

    return results
        .slice(0, limit)
        .map(result => result.item);
}

/**
 * Search medicines by category
 * @param {string|string[]} categories - Category or array of categories
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Matching medicines
 */
async function searchByCategory(categories, limit = 10) {
    if (!categories) return [];

    const categoryArray = Array.isArray(categories) ? categories : [categories];

    const { data: medicines, error } = await supabase
        .from('medicines')
        .select('*')
        .in('category', categoryArray)
        .limit(limit);

    if (error) {
        console.error('Category search error:', error);
        return [];
    }

    return medicines || [];
}

/**
 * Search medicines by symptom
 * @param {string} symptom - User's symptom
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Matching medicines
 */
async function searchBySymptom(symptom, limit = 10) {
    const categories = mapSymptomToCategories(symptom);

    if (categories.length === 0) {
        return [];
    }

    return searchByCategory(categories, limit);
}

/**
 * Check specific medicine availability
 * @param {string} medicineName - Medicine name
 * @returns {Promise<Object|null>} Medicine details or null
 */
async function checkAvailability(medicineName) {
    const results = await searchByName(medicineName, 1);
    return results.length > 0 ? results[0] : null;
}

/**
 * Get medicines with low stock
 * @param {number} threshold - Stock threshold
 * @returns {Promise<Array>} Low stock medicines
 */
async function getLowStockMedicines(threshold = 50) {
    const { data: medicines, error } = await supabase
        .from('medicines')
        .select('*')
        .lt('stock_quantity', threshold)
        .order('stock_quantity', { ascending: true });

    if (error) {
        console.error('Low stock search error:', error);
        return [];
    }

    return medicines || [];
}

module.exports = {
    searchByName,
    searchByCategory,
    searchBySymptom,
    checkAvailability,
    getLowStockMedicines,
};
