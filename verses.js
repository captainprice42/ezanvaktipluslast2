/**
 * Günün Ayeti ve Günün Hadisi Veritabanı
 */

const VERSES = [
    { ar: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', tr: 'Allah hiçbir kimseyi gücünün yetmediği bir şeyle yükümlü kılmaz.', en: 'Allah does not burden a soul beyond that it can bear.', ref: 'Bakara, 286' },
    { ar: 'لَنْ يَضُرُّوكُمْ إِلَّا أَذًى', tr: 'Onlar incitmekten başka size bir zarar veremezler. Sizinle savaşa koyulurlarsa, geri dönüp kaçarlar.', en: 'They will not harm you except for annoyance.', ref: 'Âl-i İmrân, 111' },
    { ar: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', tr: 'Muhakkak ki zorluğun yanında bir kolaylık vardır.', en: 'Indeed, with hardship comes ease.', ref: 'İnşirah, 6' },
    { ar: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَى', tr: 'Rabbin sana verecek ve sen razı olacaksın.', en: 'And your Lord is going to give you, and you will be satisfied.', ref: 'Duha, 5' },
    { ar: 'فَاذْكُرُونِي أَذْكُرْكُمْ', tr: 'Beni anın ki ben de sizi anayım.', en: 'Remember Me, and I will remember you.', ref: 'Bakara, 152' },
    { ar: 'وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', tr: 'Kim Allah\'a güvenirse O, ona yeter.', en: 'Whoever puts their trust in Allah, He will be enough for them.', ref: 'Talak, 3' },
    { ar: 'ادْعُونِي أَسْتَجِبْ لَكُمْ', tr: 'Bana dua edin, size cevap vereyim.', en: 'Call upon Me; I will respond to you.', ref: 'Mümin, 60' },
    { ar: 'وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ', tr: 'Ve sen elbette yüce bir ahlak üzeresin.', en: 'And indeed, you are of a great moral character.', ref: 'Kalem, 4' },
    { ar: 'قُلْ هُوَ اللَّهُ أَحَدٌ', tr: 'De ki: O Allah birdir.', en: 'Say: He is Allah, the One.', ref: 'İhlas, 1' },
    { ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً', tr: 'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi cehennem azabından koru.', en: 'Our Lord, give us in this world good and in the Hereafter good and protect us from the punishment of the Fire.', ref: 'Bakara, 201' },
    { ar: 'وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ', tr: 'Sabret! Şüphesiz Allah iyilik edenlerin mükâfatını zayi etmez.', en: 'Be patient, for indeed, Allah does not allow the reward of the doers of good to be lost.', ref: 'Hud, 115' },
    { ar: 'وَلَا تَيْأَسُوا مِنْ رَوْحِ اللَّهِ', tr: 'Allah\'ın rahmetinden ümidinizi kesmeyin.', en: 'Do not despair of the mercy of Allah.', ref: 'Yusuf, 87' },
    { ar: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', tr: 'Şüphesiz Allah sabredenlerle beraberdir.', en: 'Indeed, Allah is with the patient.', ref: 'Bakara, 153' },
    { ar: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنْتُمْ', tr: 'Nerede olsanız, O sizinle beraberdir.', en: 'He is with you wherever you are.', ref: 'Hadid, 4' },
    { ar: 'وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا', tr: 'Kim Allah\'tan korkarsa, Allah ona bir çıkış yolu yapar.', en: 'Whoever fears Allah, He will make a way out for him.', ref: 'Talak, 2' },
    { ar: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', tr: 'Rabbim! Göğsümü genişlet, işlerimi kolaylaştır.', en: 'My Lord, expand for me my breast, and ease my task for me.', ref: 'Taha, 25-26' },
    { ar: 'وَقُلْ رَبِّ زِدْنِي عِلْمًا', tr: 'Ve de ki: Rabbim, ilmimi artır.', en: 'And say: My Lord, increase me in knowledge.', ref: 'Taha, 114' },
    { ar: 'إِنَّ أَكْرَمَكُمْ عِنْدَ اللَّهِ أَتْقَاكُمْ', tr: 'Şüphesiz Allah katında en üstün olanınız, en çok takva sahibi olanınızdır.', en: 'The most noble of you in the sight of Allah is the most righteous of you.', ref: 'Hucurat, 13' },
    { ar: 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ', tr: 'Biz ona şah damarından daha yakınız.', en: 'We are closer to him than his jugular vein.', ref: 'Kaf, 16' },
    { ar: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ', tr: 'O halde Rabbinizin nimetlerinden hangisini yalanlayabilirsiniz?', en: 'So which of the favors of your Lord would you deny?', ref: 'Rahman, 13' },
    { ar: 'وَلَنَبْلُوَنَّكُمْ بِشَيْءٍ مِنَ الْخَوْفِ وَالْجُوعِ', tr: 'Andolsun ki sizi korku, açlık ve mallardan, canlardan eksiltme ile imtihan edeceğiz.', en: 'We will surely test you with fear, hunger, and loss of wealth, lives and fruits.', ref: 'Bakara, 155' },
    { ar: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا', tr: 'Üzülme, çünkü Allah bizimle beraberdir.', en: 'Do not grieve, indeed Allah is with us.', ref: 'Tevbe, 40' },
    { ar: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ', tr: 'Sabır ve namazla yardım isteyin.', en: 'Seek help through patience and prayer.', ref: 'Bakara, 45' },
    { ar: 'إِنَّ الصَّلَاةَ تَنْهَى عَنِ الْفَحْشَاءِ وَالْمُنْكَرِ', tr: 'Muhakkak ki namaz hayasızlıktan ve kötülükten alıkoyar.', en: 'Indeed, prayer prohibits immorality and wrongdoing.', ref: 'Ankebut, 45' },
    { ar: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', tr: 'Biliniz ki, kalpler ancak Allah\'ı anmakla huzur bulur.', en: 'Verily, in the remembrance of Allah do hearts find rest.', ref: 'Ra\'d, 28' },
    { ar: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا', tr: 'Ey iman edenler! Sabredin, sabırda yarışın.', en: 'O you who believe! Be patient, and excel in patience.', ref: 'Âl-i İmrân, 200' },
    { ar: 'وَلَا تَمْشِ فِي الْأَرْضِ مَرَحًا', tr: 'Yeryüzünde böbürlenerek yürüme.', en: 'Do not walk upon the earth exultantly.', ref: 'İsra, 37' },
    { ar: 'خُذِ الْعَفْوَ وَأْمُرْ بِالْعُرْفِ', tr: 'Affı esas al, iyiliği emret.', en: 'Take what is given freely, enjoin what is good.', ref: 'A\'raf, 199' },
    { ar: 'وَلَا تَنْسَوُا الْفَضْلَ بَيْنَكُمْ', tr: 'Aranızda iyilik yapmayı unutmayın.', en: 'Do not forget graciousness between you.', ref: 'Bakara, 237' },
    { ar: 'إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ', tr: 'Şüphesiz Allah iyilik edenleri sever.', en: 'Indeed, Allah loves the doers of good.', ref: 'Bakara, 195' }
];

const HADITHS = [
    { tr: 'Ameller niyetlere göredir. Herkesin niyetine göre karşılık vardır.', en: 'Actions are judged by intentions. Everyone shall have what they intended.', ref: 'Buhâri, Müslim' },
    { tr: 'Müslüman, Müslümanın kardeşidir. Ona zulmetmez, onu düşmana teslim etmez.', en: 'A Muslim is a brother of another Muslim. He does not oppress or forsake him.', ref: 'Buhâri, Müslim' },
    { tr: 'Kolaylaştırınız, zorlaştırmayınız. Müjdeleyiniz, nefret ettirmeyiniz.', en: 'Make things easy and do not make them difficult. Give glad tidings and do not repel people.', ref: 'Buhâri, Müslim' },
    { tr: 'Sizin en hayırlınız, ahlakı en güzel olanınızdır.', en: 'The best among you are those who have the best character.', ref: 'Buhâri' },
    { tr: 'Güler yüzle kardeşini karşılaman bile sadakadır.', en: 'Even meeting your brother with a cheerful face is charity.', ref: 'Tirmizi' },
    { tr: 'İnsanların en hayırlısı, insanlara faydalı olandır.', en: 'The best of people are those who are most beneficial to others.', ref: 'Taberani' },
    { tr: 'Kim Allah\'a ve ahiret gününe inanıyorsa, ya hayır söylesin ya da sussun.', en: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.', ref: 'Buhâri, Müslim' },
    { tr: 'Güçlü kişi güreşte yenen değil, öfke anında kendine hakim olandır.', en: 'The strong person is not the one who can wrestle, but the one who controls himself when angry.', ref: 'Buhâri, Müslim' },
    { tr: 'Temizlik imanın yarısıdır.', en: 'Cleanliness is half of faith.', ref: 'Müslim' },
    { tr: 'Hiçbiriniz, kendisi için istediğini kardeşi için de istemedikçe gerçek mü\'min olamaz.', en: 'None of you truly believes until he loves for his brother what he loves for himself.', ref: 'Buhâri, Müslim' },
    { tr: 'Cennet annelerin ayakları altındadır.', en: 'Paradise lies at the feet of mothers.', ref: 'Nesâi' },
    { tr: 'Allah sizin dış görünüşünüze ve mallarınıza bakmaz, kalplerinize ve amellerinize bakar.', en: 'Allah does not look at your appearance or wealth, but at your hearts and deeds.', ref: 'Müslim' },
    { tr: 'Sabır, acı olayın ilk anında gösterilendir.', en: 'Patience is at the first stroke of a calamity.', ref: 'Buhâri, Müslim' },
    { tr: 'Dünya, müminin zindanı, kafirin cennetidir.', en: 'The world is a prison for the believer and paradise for the disbeliever.', ref: 'Müslim' },
    { tr: 'İlim öğrenmek her Müslümana farzdır.', en: 'Seeking knowledge is an obligation upon every Muslim.', ref: 'İbn Mâce' },
    { tr: 'Kim bir hayır işe yol gösterirse, o hayrı yapan kadar sevap alır.', en: 'Whoever guides someone to goodness will have a reward like the one who did it.', ref: 'Müslim' },
    { tr: 'Bir kulun en çok sevap kazandığı amel, güzel ahlaktır.', en: 'The deed which will gain the most reward is good character.', ref: 'Tirmizi' },
    { tr: 'Müminin niyeti amelinden hayırlıdır.', en: 'The intention of the believer is better than his deed.', ref: 'Taberani' },
    { tr: 'Komşusu aç iken tok yatan bizden değildir.', en: 'He is not one of us who sleeps full while his neighbor is hungry.', ref: 'Taberani' },
    { tr: 'Güleryüz sadakadır.', en: 'A smiling face is charity.', ref: 'Tirmizi' },
    { tr: 'Nimete şükreden, sabreden, iyilik eden ve affeden kimse doğru yoldadır.', en: 'The one who is grateful, patient, does good, and forgives is on the straight path.', ref: 'Tirmizi' },
    { tr: 'İki nimet vardır ki insanların çoğu bunlarda aldanmıştır: Sağlık ve boş vakit.', en: 'There are two blessings which many people do not appreciate: health and free time.', ref: 'Buhâri' },
    { tr: 'Merhamet etmeyene merhamet olunmaz.', en: 'He who does not show mercy will not be shown mercy.', ref: 'Buhâri, Müslim' },
    { tr: 'En hayırlı sadaka, bir Müslümanın ilim öğrenip başkasına öğretmesidir.', en: 'The best charity is when a Muslim gains knowledge and teaches it to others.', ref: 'İbn Mâce' },
    { tr: 'Dua ibadetin özüdür.', en: 'Supplication is the essence of worship.', ref: 'Tirmizi' },
    { tr: 'Küçüklerimize merhamet etmeyen, büyüklerimize saygı göstermeyen bizden değildir.', en: 'He is not one of us who does not show mercy to the young and respect to the elders.', ref: 'Tirmizi' },
    { tr: 'Her iyilik sadakadır.', en: 'Every act of goodness is charity.', ref: 'Buhâri, Müslim' },
    { tr: 'Allah, işini güzel yapanı sever.', en: 'Allah loves those who do their work well.', ref: 'Taberani' },
    { tr: 'Öfkelendiğin zaman sus.', en: 'When you are angry, be silent.', ref: 'Ahmed' },
    { tr: 'En hayırlınız Kur\'an\'ı öğrenen ve öğretendir.', en: 'The best among you are those who learn the Quran and teach it.', ref: 'Buhâri' }
];

function getDailyVerse(lang = 'tr') {
    const dayOfYear = getDayOfYear(new Date());
    const index = dayOfYear % VERSES.length;
    const v = VERSES[index];
    return {
        arabic: v.ar,
        text: lang === 'en' ? v.en : v.tr,
        ref: v.ref
    };
}

function getDailyHadith(lang = 'tr') {
    const dayOfYear = getDayOfYear(new Date());
    const index = dayOfYear % HADITHS.length;
    const h = HADITHS[index];
    return {
        text: lang === 'en' ? h.en : h.tr,
        ref: h.ref
    };
}

function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return Math.floor(diff / 86400000);
}

module.exports = { VERSES, HADITHS, getDailyVerse, getDailyHadith };
