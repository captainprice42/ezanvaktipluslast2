/**
 * Günlük Dua Veritabanı
 * 30 dua — her gün farklı bir dua gösterilir
 */

const DUAS = [
    { arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', tr: 'Rabbimiz! Bize dünyada ve ahirette güzellik ver, bizi ateş azabından koru.', en: 'Our Lord! Give us good in this world and good in the Hereafter, and protect us from the torment of the Fire.' },
    { arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', tr: 'Rabbim! Göğsümü aç ve işimi kolaylaştır.', en: 'My Lord! Expand my chest and ease my task for me.' },
    { arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا', tr: 'Rabbimiz! Bizi doğru yola ilettikten sonra kalplerimizi eğriltme.', en: 'Our Lord! Do not let our hearts deviate after You have guided us.' },
    { arabic: 'رَبِّ زِدْنِي عِلْمًا', tr: 'Rabbim! İlmimi artır.', en: 'My Lord! Increase me in knowledge.' },
    { arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', tr: 'Allah bize yeter, O ne güzel vekildir.', en: 'Allah is sufficient for us, and He is the best Protector.' },
    { arabic: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي', tr: 'Rabbim! Beni namaz kılanlardan eyle, zürriyetimden de.', en: 'My Lord! Make me and my descendants steadfast in prayer.' },
    { arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى', tr: 'Allah\'ım! Senden hidayet, takva, iffet ve zenginlik isterim.', en: 'O Allah! I ask You for guidance, piety, chastity, and self-sufficiency.' },
    { arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ', tr: 'Rabbimiz! Eşlerimizi ve çocuklarımızı bize göz aydınlığı kıl.', en: 'Our Lord! Grant us joy in our spouses and children.' },
    { arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', tr: 'Allah\'ım! Sen affedicisin, affetmeyi seversin, beni affet.', en: 'O Allah! You are the Pardoner, You love to pardon, so pardon me.' },
    { arabic: 'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الخَاسِرِينَ', tr: 'Rabbimiz! Biz kendimize zulmettik. Bizi bağışla ve bize merhamet et.', en: 'Our Lord! We have wronged ourselves. Forgive us and have mercy on us.' },
    { arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', tr: 'Allah\'ım! Seni zikretmek, sana şükretmek ve güzel ibadet etmek için bana yardım et.', en: 'O Allah! Help me to remember You, thank You, and worship You well.' },
    { arabic: 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ', tr: 'Rabbim! Nimetine şükretmemi ilham et.', en: 'My Lord! Inspire me to be grateful for Your blessings.' },
    { arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ', tr: 'Allah\'ım! Gamdan ve hüzünden sana sığınırım.', en: 'O Allah! I seek refuge in You from anxiety and grief.' },
    { arabic: 'رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا', tr: 'Rabbimiz! Günahlarımızı ve işlerimizdeki taşkınlıklarımızı bağışla.', en: 'Our Lord! Forgive us our sins and our excesses in our affairs.' },
    { arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِي رَجَبَ وَشَعْبَانَ وَبَلِّغْنَا رَمَضَانَ', tr: 'Allah\'ım! Recep ve Şaban\'ı bize mübarek kıl, bizi Ramazan\'a ulaştır.', en: 'O Allah! Bless us in Rajab and Shaban, and let us reach Ramadan.' },
    { arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', tr: 'Senden başka ilah yoktur, seni tenzih ederim. Ben zalimlerden oldum.', en: 'There is no god but You. Glory be to You. I was among the wrongdoers.' },
    { arabic: 'رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنْتَ خَيْرُ الْوَارِثِينَ', tr: 'Rabbim! Beni yalnız bırakma, sen varislerin en hayırlısısın.', en: 'My Lord! Do not leave me alone, and You are the best of inheritors.' },
    { arabic: 'اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا', tr: 'Allah\'ım! Kalbime nur ver.', en: 'O Allah! Place light in my heart.' },
    { arabic: 'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ', tr: 'Rabbimiz! Bizden kabul buyur. Şüphesiz sen işiten ve bilensin.', en: 'Our Lord! Accept from us. You are the All-Hearing, All-Knowing.' },
    { arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ', tr: 'Allah\'ım! Senden cenneti ister, cehennemden sana sığınırım.', en: 'O Allah! I ask You for Paradise and seek refuge in You from the Fire.' },
    { arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ', tr: 'Allah\'ı hamd ile tesbih ederim. Yüce Allah\'ı tenzih ederim.', en: 'Glory be to Allah and praise Him. Glory be to Allah, the Magnificent.' },
    { arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ', tr: 'Allah\'ım! Muhammed\'e ve âline salat eyle.', en: "O Allah! Send blessings upon Muhammad and the family of Muhammad." },
    { arabic: 'رَبِّ هَبْ لِي حُكْمًا وَأَلْحِقْنِي بِالصَّالِحِينَ', tr: 'Rabbim! Bana hikmet ver ve beni salihlerden kıl.', en: 'My Lord! Grant me wisdom and join me with the righteous.' },
    { arabic: 'اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَعَافِنِي وَارْزُقْنِي', tr: 'Allah\'ım! Beni bağışla, bana merhamet et, beni hidayete er, afiyet ve rızık ver.', en: 'O Allah! Forgive me, have mercy on me, guide me, protect me, and provide for me.' },
    { arabic: 'رَبَّنَا آتِنَا مِنْ لَدُنْكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا', tr: 'Rabbimiz! Katından bize rahmet ver ve işimizde doğruluk hazırla.', en: 'Our Lord! Grant us mercy from Yourself and prepare for us right guidance.' },
    { arabic: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا', tr: 'Allah\'ım! Senin kolaylaştırdığından başka kolay yoktur.', en: "O Allah! Nothing is easy except what You make easy." },
    { arabic: 'رَبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ', tr: 'Rabbim! Beni doğruluk girişiyle girdir, doğruluk çıkışıyla çıkar.', en: 'My Lord! Admit me with a truthful entry and let me exit with a truthful exit.' },
    { arabic: 'تَوَكَّلْتُ عَلَى اللَّهِ رَبِّي وَرَبُّكُمْ', tr: 'Benim de sizin de Rabbiniz olan Allah\'a tevekkül ettim.', en: 'I put my trust in Allah, my Lord and your Lord.' },
    { arabic: 'اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ', tr: 'Allah\'ım! Benimle hatalarımın arasını, doğu ile batının arası gibi uzaklaştır.', en: "O Allah! Distance me from my sins as You have distanced the East from the West." },
    { arabic: 'رَبَّنَا أَتْمِمْ لَنَا نُورَنَا وَاغْفِرْ لَنَا', tr: 'Rabbimiz! Nurumuzu tamamla ve bizi bağışla.', en: 'Our Lord! Perfect our light for us and forgive us.' }
];

/**
 * Bugünün duasını döndür
 */
function getDailyDua(lang = 'tr') {
    const dayOfYear = getDayOfYear(new Date());
    const index = dayOfYear % DUAS.length;
    const dua = DUAS[index];
    return {
        arabic: dua.arabic,
        meaning: lang === 'en' ? dua.en : dua.tr
    };
}

function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 86400000;
    return Math.floor(diff / oneDay);
}

module.exports = { DUAS, getDailyDua };
