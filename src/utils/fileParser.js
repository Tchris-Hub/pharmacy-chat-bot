const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Readable } = require('stream');

/**
 * Parse CSV file from buffer
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<Array>} Parsed data array
 */
function parseCSV(buffer) {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(buffer);

        stream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

/**
 * Parse Excel file from buffer
 * @param {Buffer} buffer - File buffer
 * @returns {Array} Parsed data array
 */
function parseExcel(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return data;
}

/**
 * Validate medicine data
 * @param {Object} medicine - Medicine object
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 */
function validateMedicine(medicine, index) {
    const errors = [];

    // Required fields
    if (!medicine.name || medicine.name.trim() === '') {
        errors.push(`Row ${index + 2}: Name is required`);
    }

    if (medicine.stock_quantity === undefined || medicine.stock_quantity === '') {
        errors.push(`Row ${index + 2}: Stock quantity is required`);
    } else {
        const stock = Number(medicine.stock_quantity);
        if (isNaN(stock) || stock < 0) {
            errors.push(`Row ${index + 2}: Stock quantity must be a non-negative number`);
        }
    }

    // Optional but validated fields
    if (medicine.price !== undefined && medicine.price !== '') {
        const price = Number(medicine.price);
        if (isNaN(price) || price < 0) {
            errors.push(`Row ${index + 2}: Price must be a positive number`);
        }
    }

    // Convert requires_prescription to boolean
    if (medicine.requires_prescription !== undefined) {
        const value = String(medicine.requires_prescription).toLowerCase();
        if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value)) {
            errors.push(`Row ${index + 2}: requires_prescription must be true/false or yes/no`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Transform medicine data for database insertion
 * @param {Object} medicine - Raw medicine object
 * @returns {Object} Transformed medicine object
 */
function transformMedicine(medicine) {
    return {
        name: medicine.name.trim(),
        description: medicine.description ? medicine.description.trim() : null,
        stock_quantity: Number(medicine.stock_quantity),
        price: medicine.price ? Number(medicine.price) : null,
        category: medicine.category ? medicine.category.trim() : null,
        requires_prescription: convertToBoolean(medicine.requires_prescription),
    };
}

/**
 * Convert string to boolean
 * @param {string} value - String value
 * @returns {boolean} Boolean value
 */
function convertToBoolean(value) {
    if (value === undefined || value === '') return false;
    const str = String(value).toLowerCase();
    return ['true', '1', 'yes'].includes(str);
}

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
