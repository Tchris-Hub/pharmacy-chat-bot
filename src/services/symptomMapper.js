/**
 * Symptom to Category Mapper
 * Maps user symptoms to medicine categories in the database
 */

const symptomMap = {
    // Pain & Inflammation
    headache: ['Painkillers', 'Analgesics'],
    'head pain': ['Painkillers', 'Analgesics'],
    migraine: ['Painkillers', 'Analgesics'],
    pain: ['Painkillers', 'Analgesics'],
    ache: ['Painkillers', 'Analgesics'],
    hurt: ['Painkillers', 'Analgesics'],
    sore: ['Painkillers', 'Analgesics'],

    // Cold & Flu
    cold: ['Antihistamines', 'Respiratory'],
    flu: ['Antihistamines', 'Respiratory', 'Painkillers'],
    cough: ['Respiratory'],
    sneeze: ['Antihistamines'],
    'runny nose': ['Antihistamines'],
    congestion: ['Antihistamines', 'Respiratory'],

    // Fever
    fever: ['Painkillers', 'Antipyretics'],
    temperature: ['Painkillers'],

    // Allergies
    allergy: ['Antihistamines'],
    allergies: ['Antihistamines'],
    itchy: ['Antihistamines'],
    rash: ['Antihistamines', 'Dermatology'],

    // Digestive
    'stomach pain': ['Antacids', 'Digestive', 'Gastrointestinal'],
    'stomach ache': ['Antacids', 'Digestive', 'Gastrointestinal'],
    heartburn: ['Antacids'],
    indigestion: ['Antacids', 'Digestive'],
    nausea: ['Gastrointestinal'],
    diarrhea: ['Gastrointestinal'],
    constipation: ['Gastrointestinal'],

    // Respiratory
    asthma: ['Respiratory'],
    breathing: ['Respiratory'],
    'shortness of breath': ['Respiratory'],

    // Sleep
    insomnia: ['Sleep Aids'],
    'can\'t sleep': ['Sleep Aids'],
    'trouble sleeping': ['Sleep Aids'],

    // Energy & Wellness
    tired: ['Supplements', 'Vitamins'],
    fatigue: ['Supplements', 'Vitamins'],
    energy: ['Supplements', 'Vitamins'],
    weak: ['Supplements', 'Vitamins'],

    // Skin
    'skin problem': ['Dermatology'],
    acne: ['Dermatology'],
    eczema: ['Dermatology'],

    // Heart & Blood Pressure
    'high blood pressure': ['Cardiovascular'],
    hypertension: ['Cardiovascular'],
    'heart problem': ['Cardiovascular'],

    // Diabetes
    diabetes: ['Diabetes'],
    'blood sugar': ['Diabetes'],
};

/**
 * Map symptom to categories
 * @param {string} symptom - User's symptom description
 * @returns {string[]} Array of matching categories
 */
function mapSymptomToCategories(symptom) {
    if (!symptom) return [];

    const lowerSymptom = symptom.toLowerCase().trim();
    const categories = new Set();

    // Direct match
    if (symptomMap[lowerSymptom]) {
        symptomMap[lowerSymptom].forEach(cat => categories.add(cat));
    }

    // Partial match - check if symptom contains any keywords
    Object.keys(symptomMap).forEach(key => {
        if (lowerSymptom.includes(key) || key.includes(lowerSymptom)) {
            symptomMap[key].forEach(cat => categories.add(cat));
        }
    });

    return Array.from(categories);
}

/**
 * Get all symptom keywords
 * @returns {string[]} Array of all symptom keywords
 */
function getAllSymptomKeywords() {
    return Object.keys(symptomMap);
}

module.exports = {
    mapSymptomToCategories,
    getAllSymptomKeywords,
    symptomMap,
};
