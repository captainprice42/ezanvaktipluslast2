const https = require('https');
const http = require('http');

// Günlük cache
let cache = {
    city: null,
    date: null,
    times: null
};

// Haftalık cache
let weeklyCache = {
    city: null,
    weekStart: null,
    days: null
};

/**
 * Habertürk'ten namaz vakitlerini çeker
 * @param {string} citySlug - Şehir slug'ı (örn: "istanbul", "ankara")
 * @returns {Promise<Object>} Namaz vakitleri objesi
 */
function fetchPrayerTimes(citySlug) {
    const today = new Date().toISOString().split('T')[0];

    // Cache kontrolü
    if (cache.city === citySlug && cache.date === today && cache.times) {
        return Promise.resolve(cache.times);
    }

    const url = `https://www.haberturk.com/namaz-vakitleri/${citySlug}`;

    return new Promise((resolve, reject) => {
        const makeRequest = (requestUrl, redirectCount) => {
            if (redirectCount > 5) {
                reject(new Error('Çok fazla yönlendirme'));
                return;
            }

            const proto = requestUrl.startsWith('https') ? https : http;

            const request = proto.get(requestUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding': 'identity'
                },
                timeout: 15000
            }, (response) => {
                // Redirect takibi
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    let redirectUrl = response.headers.location;
                    if (redirectUrl.startsWith('/')) {
                        const urlObj = new URL(requestUrl);
                        redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
                    }
                    makeRequest(redirectUrl, redirectCount + 1);
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP hatası: ${response.statusCode}`));
                    return;
                }

                let data = '';
                response.setEncoding('utf-8');
                response.on('data', (chunk) => { data += chunk; });
                response.on('end', () => {
                    try {
                        const times = parseHTML(data);
                        cache = { city: citySlug, date: today, times };
                        resolve(times);
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            request.on('error', (err) => {
                if (cache.times && cache.city === citySlug) {
                    resolve(cache.times);
                } else {
                    reject(err);
                }
            });

            request.on('timeout', () => {
                request.destroy();
                if (cache.times && cache.city === citySlug) {
                    resolve(cache.times);
                } else {
                    reject(new Error('İstek zaman aşımına uğradı'));
                }
            });
        };

        makeRequest(url, 0);
    });
}

/**
 * Haftalık namaz vakitlerini çeker (haftalık sayfa)
 * @param {string} citySlug
 * @returns {Promise<Array>} 7 günlük vakitler [{date, times}]
 */
function fetchWeeklyPrayerTimes(citySlug) {
    const now = new Date();
    const weekStart = getWeekStart(now);

    // Cache kontrolü
    if (weeklyCache.city === citySlug && weeklyCache.weekStart === weekStart && weeklyCache.days) {
        return Promise.resolve(weeklyCache.days);
    }

    const url = `https://www.haberturk.com/namaz-vakitleri/${citySlug}/haftalik`;

    return new Promise((resolve, reject) => {
        const makeRequest = (requestUrl, redirectCount) => {
            if (redirectCount > 5) {
                reject(new Error('Çok fazla yönlendirme'));
                return;
            }

            const proto = requestUrl.startsWith('https') ? https : http;

            const request = proto.get(requestUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding': 'identity'
                },
                timeout: 15000
            }, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    let redirectUrl = response.headers.location;
                    if (redirectUrl.startsWith('/')) {
                        const urlObj = new URL(requestUrl);
                        redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
                    }
                    makeRequest(redirectUrl, redirectCount + 1);
                    return;
                }

                if (response.statusCode !== 200) {
                    // Fallback: bugünkü vakitleri 7 güne kopyala
                    fallbackWeekly(citySlug).then(resolve).catch(reject);
                    return;
                }

                let data = '';
                response.setEncoding('utf-8');
                response.on('data', (chunk) => { data += chunk; });
                response.on('end', () => {
                    try {
                        const days = parseWeeklyHTML(data);
                        if (days && days.length >= 5) {
                            weeklyCache = { city: citySlug, weekStart, days };
                            resolve(days);
                        } else {
                            fallbackWeekly(citySlug).then(resolve).catch(reject);
                        }
                    } catch (e) {
                        fallbackWeekly(citySlug).then(resolve).catch(reject);
                    }
                });
            });

            request.on('error', () => {
                fallbackWeekly(citySlug).then(resolve).catch(reject);
            });

            request.on('timeout', () => {
                request.destroy();
                fallbackWeekly(citySlug).then(resolve).catch(reject);
            });
        };

        makeRequest(url, 0);
    });
}

/**
 * Fallback: bugünkü vakitleri kullanarak 7 günlük tablo oluştur
 */
async function fallbackWeekly(citySlug) {
    const times = await fetchPrayerTimes(citySlug);
    const days = [];
    const now = new Date();
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        days.push({
            date: d.toISOString().split('T')[0],
            dayName: dayNames[d.getDay()],
            times: times // aynı vakitler (yaklaşık)
        });
    }
    return days;
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day + 1); // monday
    return d.toISOString().split('T')[0];
}

/**
 * Haftalık HTML parse
 */
function parseWeeklyHTML(html) {
    const days = [];
    const vakitKeys = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];
    const vakitNames = ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

    // Haftalık sayfada tablo satırları olabilir
    const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;

    let match;
    while ((match = rowPattern.exec(html)) !== null) {
        const cells = [];
        let cellMatch;
        while ((cellMatch = cellPattern.exec(match[1])) !== null) {
            cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
        }
        // Tarih + 6 vakit = 7 hücre bekliyoruz
        if (cells.length >= 7) {
            const timeValues = cells.slice(1, 7);
            const allValid = timeValues.every(t => /^\d{2}:\d{2}$/.test(t));
            if (allValid) {
                const times = {};
                for (let i = 0; i < 6; i++) {
                    times[vakitKeys[i]] = { name: vakitNames[i], time: timeValues[i] };
                }
                const dateStr = cells[0];
                const now = new Date();
                days.push({
                    date: dateStr,
                    dayName: dayNames[now.getDay()],
                    times
                });
            }
        }
    }

    return days;
}

/**
 * HTML'den namaz vakitlerini parse eder (cheerio kullanmadan, regex ile)
 */
function parseHTML(html) {
    const times = {};
    const vakitKeys = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];
    const vakitNames = ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];

    // Yöntem 1: li elementlerinden name ve time class'larını bul
    const liPattern = /<li[^>]*>[\s\S]*?<span[^>]*class="[^"]*name[^"]*"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<span[^>]*class="[^"]*time[^"]*"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/li>/gi;

    const matches = [];
    let match;
    while ((match = liPattern.exec(html)) !== null) {
        const name = match[1].replace(/<[^>]*>/g, '').trim();
        const time = match[2].replace(/<[^>]*>/g, '').trim();

        if (name && time && /^\d{2}:\d{2}$/.test(time)) {
            matches.push({ name, time });
        }
    }

    if (matches.length >= 6) {
        for (let i = 0; i < 6 && i < matches.length; i++) {
            times[vakitKeys[i]] = {
                name: vakitNames[i],
                time: matches[i].time
            };
        }
    }

    // Yöntem 2: Basit text bazlı arama (fallback)
    if (Object.keys(times).length < 5) {
        const patterns = [
            { key: 'imsak', name: 'İmsak', regex: /İmsak[\s\S]{0,100}?(\d{2}:\d{2})/i },
            { key: 'gunes', name: 'Güneş', regex: /Güneş[\s\S]{0,100}?(\d{2}:\d{2})/i },
            { key: 'ogle', name: 'Öğle', regex: /Öğle[\s\S]{0,100}?(\d{2}:\d{2})/i },
            { key: 'ikindi', name: 'İkindi', regex: /İkindi[\s\S]{0,100}?(\d{2}:\d{2})/i },
            { key: 'aksam', name: 'Akşam', regex: /Akşam[\s\S]{0,100}?(\d{2}:\d{2})/i },
            { key: 'yatsi', name: 'Yatsı', regex: /Yatsı[\s\S]{0,100}?(\d{2}:\d{2})/i }
        ];

        for (const p of patterns) {
            if (!times[p.key]) {
                const m = html.match(p.regex);
                if (m) {
                    times[p.key] = { name: p.name, time: m[1] };
                }
            }
        }
    }

    if (Object.keys(times).length < 5) {
        throw new Error('Namaz vakitleri sayfadan okunamadı. Bulunan vakit sayısı: ' + Object.keys(times).length);
    }

    return times;
}

/**
 * Cache'i temizler
 */
function clearCache() {
    cache = { city: null, date: null, times: null };
    weeklyCache = { city: null, weekStart: null, days: null };
}

module.exports = { fetchPrayerTimes, fetchWeeklyPrayerTimes, clearCache };
