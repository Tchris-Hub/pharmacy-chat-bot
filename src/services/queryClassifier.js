const { getAllSymptomKeywords } = require('./symptomMapper');

/**
 * Query Type Classifier
 * Determines what type of question the user is asking
 */

const QUERY_TYPES = {
    SYMPTOM: 'SYMPTOM',
    MEDICINE: 'MEDICINE',
    FAQ: 'FAQ',
    GENERAL: 'GENERAL',
};

// Keywords for each query type
const symptomKeywords = getAllSymptomKeywords();

const medicineKeywords = [
    'do you have',
    'in stock',
    'available',
    'price',
    'cost',
    'how much',
    'sell',
    'carry',
    'stock',
];

const faqKeywords = [
    'hours',
    'open',
    'close',
    'deliver',
    'delivery',
    'payment',
    'accept',
    'insurance',
    'location',
    'address',
    'contact',
    'phone',
    'email',
    'refund',
    'return',
    'vaccine',
    'flu shot',
];

const greetingKeywords = [
    'hi',
    'hello',
    'hey',
    'good morning',
    'good afternoon',
    'good evening',
    'what\'s up',
    'sup',
];

/**
 * Classify user query
 * @param {string} message - User's message
 * @returns {Object} { type: string, confidence: number }
 */
function classifyQuery(message) {
    if (!message || typeof message !== 'string') {
        return { type: QUERY_TYPES.GENERAL, confidence: 0 };
    }

    const lowerMessage = message.toLowerCase().trim();

    // Check for greetings
    if (greetingKeywords.some(keyword => lowerMessage === keyword || lowerMessage.startsWith(keyword))) {
        return { type: QUERY_TYPES.GENERAL, confidence: 1.0 };
    }

    let scores = {
        [QUERY_TYPES.SYMPTOM]: 0,
        [QUERY_TYPES.MEDICINE]: 0,
        [QUERY_TYPES.FAQ]: 0,
        [QUERY_TYPES.GENERAL]: 0,
    };

    // Check for symptom keywords
    symptomKeywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) {
            scores[QUERY_TYPES.SYMPTOM] += 2;
        }
    });

    // Symptom phrases
    const symptomPhrases = [
        'i have',
        'i feel',
        'i\'m feeling',
        'suffering from',
        'need something for',
        'help with',
        'what can i take',
        'what should i use',
    ];

    symptomPhrases.forEach(phrase => {
        if (lowerMessage.includes(phrase)) {
            scores[QUERY_TYPES.SYMPTOM] += 3;
        }
    });

    // Check for medicine keywords
    medicineKeywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) {
            scores[QUERY_TYPES.MEDICINE] += 2;
        }
    });

    // Check for FAQ keywords
    faqKeywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) {
            scores[QUERY_TYPES.FAQ] += 2;
        }
    });

    // Find the type with highest score
    const maxScore = Math.max(...Object.values(scores));

    if (maxScore === 0) {
        return { type: QUERY_TYPES.GENERAL, confidence: 0.5 };
    }

    const type = Object.keys(scores).find(key => scores[key] === maxScore);
    const confidence = Math.min(maxScore / 5, 1.0); // Normalize to 0-1

    return { type, confidence };
}

module.exports = {
    classifyQuery,
    QUERY_TYPES,
};
