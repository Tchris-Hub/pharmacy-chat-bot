/**
 * Validate FAQ data
 * @param {Object} faq - FAQ object
 * @param {number} index - Row index
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 */
function validateFaq(faq, index) {
    const errors = [];

    // Required fields
    if (!faq.question || faq.question.trim() === '') {
        errors.push(`Row ${index + 2}: Question is required`);
    }

    if (!faq.answer || faq.answer.trim() === '') {
        errors.push(`Row ${index + 2}: Answer is required`);
    }

    // Optional but validated fields
    if (faq.priority !== undefined && faq.priority !== '') {
        const priority = Number(faq.priority);
        if (isNaN(priority)) {
            errors.push(`Row ${index + 2}: Priority must be a number`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Transform FAQ data for database insertion
 * @param {Object} faq - Raw FAQ object
 * @returns {Object} Transformed FAQ object
 */
function transformFaq(faq) {
    return {
        question: faq.question.trim(),
        answer: faq.answer.trim(),
        category: faq.category ? faq.category.trim() : null,
        priority: faq.priority ? Number(faq.priority) : 0,
    };
}

module.exports = {
    parseCSV,
    parseExcel,
    validateMedicine,
    transformMedicine,
    validateFaq,
    transformFaq,
};
