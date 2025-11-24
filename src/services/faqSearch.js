const Fuse = require('fuse.js');
const supabase = require('../config/supabase');

/**
 * FAQ Search Service
 * Searches FAQ database with keyword matching
 */

/**
 * Search FAQs by query
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Matching FAQs
 */
async function searchFAQs(query, limit = 5) {
    if (!query) return [];

    // Get all FAQs from database
    const { data: faqs, error } = await supabase
        .from('faqs')
        .select('*')
        .order('priority', { ascending: false });

    if (error) {
        console.error('FAQ search error:', error);
        return [];
    }

    // Use Fuse.js for fuzzy matching
    const fuse = new Fuse(faqs, {
        keys: ['question', 'answer', 'category'],
        threshold: 0.3,
        includeScore: true,
    });

    const results = fuse.search(query);

    return results
        .slice(0, limit)
        .map(result => result.item);
}

/**
 * Get FAQs by category
 * @param {string} category - FAQ category
 * @returns {Promise<Array>} FAQs in category
 */
async function getFAQsByCategory(category) {
    const { data: faqs, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('category', category)
        .order('priority', { ascending: false });

    if (error) {
        console.error('FAQ category search error:', error);
        return [];
    }

    return faqs || [];
}

/**
 * Get top priority FAQs
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Top FAQs
 */
async function getTopFAQs(limit = 10) {
    const { data: faqs, error } = await supabase
        .from('faqs')
        .select('*')
        .order('priority', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Top FAQs error:', error);
        return [];
    }

    return faqs || [];
}

module.exports = {
    searchFAQs,
    getFAQsByCategory,
    getTopFAQs,
};
