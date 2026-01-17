
export const getKeywordsData = async (keywords: string[], countryCode: string, languageCode: string) => {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;

    if (!login || !password) {
        throw new Error('DataForSEO credentials not configured');
    }

    // Mappings
    const locationMap: Record<string, number> = {
        'US': 2840,
        'BG': 2100,
        // Add more as needed
    };

    const locId = locationMap[countryCode] || 2840; // Default US
    const langId = languageCode || 'en';

    // Helper to make requests
    const makeRequest = async (endpoint: string, postData: any[]) => {
        try {
            console.log(`[DataForSEO] Requesting endpoint: ${endpoint}`);
            console.log(`[DataForSEO] Payload preview:`, JSON.stringify(postData[0]).substring(0, 200));

            const response = await fetch(`https://api.dataforseo.com/v3/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[DataForSEO] API ERROR [${endpoint}]: Status ${response.status}`, errorText);
                return null;
            }

            const data = await response.json();

            // Log task status if available
            if (data.tasks && data.tasks[0]) {
                console.log(`[DataForSEO] Task Status: ${data.tasks[0].status_message} (Code: ${data.tasks[0].status_code})`);
                if (data.tasks[0].status_code >= 40000) {
                    console.error(`[DataForSEO] Task Error:`, data.tasks[0].status_message);
                }
            }

            // Labs API tasks[0].result[0].items
            if (data.tasks && data.tasks[0] && data.tasks[0].result && data.tasks[0].result[0] && data.tasks[0].result[0].items) {
                console.log(`[DataForSEO] Success. Items found: ${data.tasks[0].result[0].items.length}`);
                return data.tasks[0].result[0].items;
            } else {
                console.warn(`[DataForSEO] Response structure unexpected or empty results.`, JSON.stringify(data).substring(0, 200));
            }
            return [];
        } catch (error) {
            console.error(`[DataForSEO] Request FAILED [${endpoint}]:`, error);
            return [];
        }
    };

    // 1. Get Search Volume (and Paid Competition)
    // https://api.dataforseo.com/v3/dataforseo_labs/google/historical_search_volume/live
    const volumeItems = await makeRequest('dataforseo_labs/google/historical_search_volume/live', [{
        location_code: locId,
        language_code: langId,
        keywords: keywords,
        include_clickstream_data: false
    }]);

    // 2. Get Organic Keyword Difficulty
    // https://api.dataforseo.com/v3/dataforseo_labs/google/bulk_keyword_difficulty/live
    // This endpoint returns item.keyword and item.keyword_difficulty (0-100)
    const difficultyItems = await makeRequest('dataforseo_labs/google/bulk_keyword_difficulty/live', [{
        location_code: locId,
        language_code: langId,
        keywords: keywords
    }]);

    // Merge Data
    const resultsMap = new Map();

    // Process Volume Data
    if (volumeItems) {
        volumeItems.forEach((item: any) => {
            const k = item.keyword;
            const info = item.keyword_info || {};

            // Calculate fallback difficulty from Paid Competition
            const competition = info.competition_level || (info.competition > 0.66 ? 'HIGH' : info.competition > 0.33 ? 'MEDIUM' : 'LOW');
            const paidDiff = competition === 'HIGH' ? 'Hard' : competition === 'LOW' ? 'Easy' : 'Medium';

            resultsMap.set(k.toLowerCase(), {
                keyword: k,
                volume: info.search_volume || 0,
                paid_difficulty: paidDiff,
                difficulty: paidDiff // Default to paid, override with organic if available
            });
        });
    }

    // Process/Merge Difficulty Data
    if (difficultyItems) {
        difficultyItems.forEach((item: any) => {
            const k = item.keyword;
            const current = resultsMap.get(k.toLowerCase()) || { keyword: k, volume: 0, difficulty: 'Medium' };

            // item.keyword_difficulty is 0-100
            const kd = item.keyword_difficulty;

            if (typeof kd === 'number') {
                let diffLabel = 'Medium';
                if (kd > 60) diffLabel = 'Hard';
                else if (kd < 30) diffLabel = 'Easy';

                current.difficulty = diffLabel; // Override with Organic Difficulty
                current.kd_score = kd;
            }

            resultsMap.set(k.toLowerCase(), current);
        });
    }

    // Return array
    return Array.from(resultsMap.values());
};
