/**
 * Hicri Takvim Çevirici
 * Miladi tarih → Hicri tarih dönüşümü
 */

const HIJRI_MONTHS = {
    tr: ['Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir', 'Cemaziyelevvel', 'Cemaziyelahir', 'Recep', 'Şaban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'],
    en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'],
    ar: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة']
};

/**
 * Miladi → Hicri çevirme (Kuwaiti algoritması)
 * @param {Date} date
 * @returns {{day: number, month: number, year: number, monthName: string}}
 */
function toHijri(date, lang = 'tr') {
    const d = date.getDate();
    const m = date.getMonth();
    const y = date.getFullYear();

    let jd = Math.floor((11 * y + 3) / 30) + 354 * y + 30 * m
        - Math.floor((m - 1) / 2) + d + 1948440 - 385;

    if (m < 2 || (m === 1 && d <= 0)) {
        // do nothing
    }

    // Julian day number
    const a = Math.floor((14 - (m + 1)) / 12);
    const yy = y + 4800 - a;
    const mm = (m + 1) + 12 * a - 3;

    jd = d + Math.floor((153 * mm + 2) / 5) + 365 * yy
        + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;

    // JD → Hicri
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const ll = l - 10631 * n + 354;
    const jj = Math.floor((10985 - ll) / 5316) * Math.floor((50 * ll) / 17719)
        + Math.floor(ll / 5670) * Math.floor((43 * ll) / 15238);
    const lli = ll - Math.floor((30 - jj) / 15) * Math.floor((17719 * jj) / 50)
        - Math.floor(jj / 16) * Math.floor((15238 * jj) / 43) + 29;

    const hijriMonth = Math.floor((24 * lli) / 709);
    const hijriDay = lli - Math.floor((709 * hijriMonth) / 24);
    const hijriYear = 30 * n + jj - 30;

    const months = HIJRI_MONTHS[lang] || HIJRI_MONTHS.tr;

    return {
        day: hijriDay,
        month: hijriMonth,
        year: hijriYear,
        monthName: months[hijriMonth - 1] || ''
    };
}

/**
 * Ramazan ayında mıyız?
 */
function isRamadan(date, lang) {
    const hijri = toHijri(date, lang);
    return hijri.month === 9;
}

/**
 * Hicri tarih formatla
 */
function formatHijri(date, lang = 'tr') {
    const h = toHijri(date, lang);
    return `${h.day} ${h.monthName} ${h.year}`;
}

module.exports = { toHijri, isRamadan, formatHijri, HIJRI_MONTHS };
