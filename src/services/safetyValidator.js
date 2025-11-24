/**
 * Safety Validator
 * Ensures AI responses follow pharmacy safety rules
 */

const SAFETY_RULES = {
    // Things the AI must NEVER do
    FORBIDDEN_ACTIONS: [
        'diagnose',
        'prescribe',
        'recommend dosage',
        'tell what to take',
        'claim to cure',
        'give medical advice',
    ],

    // Trigger words that require extra caution
    MEDICAL_TRIGGERS: [
        'pregnant',
        'breastfeeding',
        'child',
        'baby',
        'infant',
        'elderly',
        'allergic',
        'reaction',
        'emergency',
        'severe',
        'blood',
        'heart attack',
        'stroke',
    ],

    // Prescription medicine warning
    PRESCRIPTION_WARNING: 'This medicine requires a prescription from a doctor.',

    // General disclaimer
    DISCLAIMER: 'This is general information only. Please consult our pharmacist for personalized advice.',

    // Emergency redirect
    EMERGENCY_MESSAGE: 'This sounds like a medical emergency. Please call emergency services or visit a doctor immediately.',
};

/**
 * Check if response contains forbidden content
 * @param {string} response - AI generated response
 * @returns {Object} { safe: boolean, violations: string[] }
 */
function checkForbiddenContent(response) {
    const violations = [];
    const lowerResponse = response.toLowerCase();

    // Check for diagnosis language
    const diagnosisPatterns = [
        'you have',
        'you are suffering from',
        'this is',
        'you\'ve got',
        'diagnosed with',
    ];

    diagnosisPatterns.forEach(pattern => {
        if (lowerResponse.includes(pattern)) {
            violations.push('Potential diagnosis detected');
        }
    });

    // Check for prescription language
    const prescriptionPatterns = [
        'you should take',
        'i recommend taking',
        'take this',
        'use this medication',
    ];

    prescriptionPatterns.forEach(pattern => {
        if (lowerResponse.includes(pattern)) {
            violations.push('Potential prescription detected');
        }
    });

    // Check for dosage instructions
    const dosagePatterns = [
        'mg',
        'ml',
        'tablets',
        'times a day',
        'every',
        'hours',
    ];

    let dosageCount = 0;
    dosagePatterns.forEach(pattern => {
        if (lowerResponse.includes(pattern)) {
            dosageCount++;
        }
    });

    if (dosageCount >= 2) {
        violations.push('Potential dosage instruction detected');
    }

    return {
        safe: violations.length === 0,
        violations,
    };
}

/**
 * Check if query contains medical triggers
 * @param {string} message - User message
 * @returns {boolean} True if triggers found
 */
function hasMedicalTriggers(message) {
    const lowerMessage = message.toLowerCase();
    return SAFETY_RULES.MEDICAL_TRIGGERS.some(trigger =>
        lowerMessage.includes(trigger)
    );
}

/**
 * Check if query is an emergency
 * @param {string} message - User message
 * @returns {boolean} True if emergency detected
 */
function isEmergency(message) {
    const emergencyKeywords = [
        'emergency',
        'urgent',
        'severe pain',
        'can\'t breathe',
        'chest pain',
        'heart attack',
        'stroke',
        'bleeding heavily',
        'unconscious',
        'overdose',
    ];

    const lowerMessage = message.toLowerCase();
    return emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Validate and enhance response with safety measures
 * @param {string} response - AI generated response
 * @param {Object} context - Query context
 * @returns {Object} Validated response with warnings
 */
function validateResponse(response, context = {}) {
    const { userMessage, medicines = [], queryType } = context;

    // Check for emergencies first
    if (userMessage && isEmergency(userMessage)) {
        return {
            safe: true,
            response: SAFETY_RULES.EMERGENCY_MESSAGE,
            isEmergency: true,
            disclaimer: 'Please seek immediate medical attention.',
        };
    }

    // Check forbidden content
    const contentCheck = checkForbiddenContent(response);

    if (!contentCheck.safe) {
        return {
            safe: false,
            response: null,
            violations: contentCheck.violations,
            fallbackMessage: 'I can help you find products, but I cannot provide medical advice. Please speak with our pharmacist for personalized recommendations.',
        };
    }

    // Build warnings array
    const warnings = [];

    // Check if any medicines require prescription
    const prescriptionMeds = medicines.filter(med => med.requires_prescription);
    if (prescriptionMeds.length > 0) {
        warnings.push(SAFETY_RULES.PRESCRIPTION_WARNING);
    }

    // Add medical trigger warning
    if (userMessage && hasMedicalTriggers(userMessage)) {
        warnings.push('Please consult with our pharmacist, especially for special conditions.');
    }

    // Always add disclaimer for symptom queries
    let disclaimer = null;
    if (queryType === 'SYMPTOM') {
        disclaimer = SAFETY_RULES.DISCLAIMER;
    }

    return {
        safe: true,
        response,
        warnings,
        disclaimer,
        prescriptionRequired: prescriptionMeds.length > 0,
    };
}

module.exports = {
    validateResponse,
    checkForbiddenContent,
    hasMedicalTriggers,
    isEmergency,
    SAFETY_RULES,
};
