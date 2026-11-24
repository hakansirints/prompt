// Türkçe İsim Şehir Hayvan kelime bankası, kategori tanımları ve Türkçe normalizasyon yardımcıları
(function (global) {
  const ISH = (global.ISH = global.ISH || {});

  const VALID_LETTERS = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'İ',
  'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R', 'S', 'Ş',
  'T', 'U', 'Ü', 'V', 'Y', 'Z'
];

  const CATEGORY_META = {
  'İsim': {
    key: 'isim', label: 'İsim', color: '#38BDF8', light: '#E0F2FE', dark: '#0369A1', shadow: '#BAE6FD',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#0284C7" stroke-width="2.4"/><path d="M8.5 14.5C9.3 16 10.6 16.8 12 16.8C13.4 16.8 14.7 16 15.5 14.5" stroke="#0284C7" stroke-width="2.4" stroke-linecap="round"/><circle cx="9" cy="10" r="1.3" fill="#0284C7"/><circle cx="15" cy="10" r="1.3" fill="#0284C7"/></svg>`
  },
  'Şehir': {
    key: 'sehir', label: 'Şehir', color: '#FB923C', light: '#FFEDD5', dark: '#C2410C', shadow: '#FED7AA',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 20V9L9 5L14 9V20M14 20V11H20V20M2 20H22" stroke="#C2410C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="13" width="2" height="3" fill="#C2410C"/><rect x="16" y="14" width="2" height="2" fill="#C2410C"/></svg>`
  },
  'Hayvan': {
    key: 'hayvan', label: 'Hayvan', color: '#4ADE80', light: '#DCFCE7', dark: '#15803D', shadow: '#BBF7D0',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="7.5" cy="8.5" r="2.2" fill="#15803D"/><circle cx="12" cy="6.5" r="2.2" fill="#15803D"/><circle cx="16.5" cy="8.5" r="2.2" fill="#15803D"/><path d="M7 15.5C7 13 9.2 11 12 11C14.8 11 17 13 17 15.5C17 17.5 15.4 19 13.5 19H10.5C8.6 19 7 17.5 7 15.5Z" fill="#15803D"/></svg>`
  },
  'Bitki': {
    key: 'bitki', label: 'Bitki', color: '#A78BFA', light: '#F3E8FF', dark: '#6D28D9', shadow: '#DDD6FE',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 21V11M12 11C12 6.5 15.5 4 20 4C20 8.5 17.5 12 12 11ZM12 14C12 10.5 9 8 4 8C4 12 6.5 15 12 14Z" stroke="#6D28D9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  },
  'Eşya': {
    key: 'esya', label: 'Eşya', color: '#F472B6', light: '#FCE7F3', dark: '#BE185D', shadow: '#FBCFE8',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="4" y="8" width="16" height="12" rx="3" stroke="#BE185D" stroke-width="2.2"/><path d="M9 8V6C9 4.3 10.3 3 12 3C13.7 3 15 4.3 15 6V8" stroke="#BE185D" stroke-width="2.2"/><path d="M4 13H20" stroke="#BE185D" stroke-width="2"/></svg>`
  },
  'Ülke': {
    key: 'ulke', label: 'Ülke', color: '#14B8A6', light: '#CCFBF1', dark: '#0F766E', shadow: '#99F6E4',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#0F766E" stroke-width="2.2"/><path d="M3 12H21M12 3C14.5 5.7 15.8 8.8 15.8 12C15.8 15.2 14.5 18.3 12 21C9.5 18.3 8.2 15.2 8.2 12C8.2 8.8 9.5 5.7 12 3Z" stroke="#0F766E" stroke-width="2"/></svg>`
  },
  'Meslek': {
    key: 'meslek', label: 'Meslek', color: '#F59E0B', light: '#FEF3C7', dark: '#B45309', shadow: '#FDE68A',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="12" rx="2.5" stroke="#B45309" stroke-width="2.2"/><path d="M8 8V6C8 4.9 8.9 4 10 4H14C15.1 4 16 4.9 16 6V8" stroke="#B45309" stroke-width="2.2"/><path d="M3 13H21" stroke="#B45309" stroke-width="2"/></svg>`
  }
};

  function normalizeTr(str) {
    return (str || '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr-TR');
  }

  function startsWithLetterTr(word, letter) {
    const w = normalizeTr(word);
    const l = normalizeTr(letter);
    return w.length >= 2 && w.startsWith(l);
  }

  // Zengin çocuk dostu Türkçe kelime bankası (bot cevapları ve Bilge Baykuş ipuçları için)
  const WORD_BANK = {
  A: {
    'İsim': ['Ahmet', 'Ali', 'Ayşe', 'Arda', 'Aslı', 'Ada', 'Alp'],
    'Şehir': ['Ankara', 'Adana', 'Antalya', 'Aydın', 'Amasya', 'Afyon'],
    'Hayvan': ['Aslan', 'At', 'Ayı', 'Arı', 'Ahtapot', 'Akrep'],
    'Bitki': ['Armut', 'Ayva', 'Arpa', 'Avokado', 'Akasya'],
    'Eşya': ['Ayna', 'Anahtar', 'Askı', 'Abajur', 'Araba'],
    'Ülke': ['Almanya', 'Arjantin', 'Avustralya', 'Azerbaycan'],
    'Meslek': ['Avukat', 'Aşçı', 'Astronot', 'Antrenör']
  },
  B: {
    'İsim': ['Burak', 'Beren', 'Berk', 'Bahar', 'Barış', 'Buse'],
    'Şehir': ['Bursa', 'Bolu', 'Balıkesir', 'Burdur', 'Bartın'],
    'Hayvan': ['Balina', 'Balık', 'Baykuş', 'Böcek', 'Bizon'],
    'Bitki': ['Biber', 'Badem', 'Brokoli', 'Böğürtlen', 'Buğday'],
    'Eşya': ['Bardak', 'Bıçak', 'Bavul', 'Battaniye', 'Boya'],
    'Ülke': ['Brezilya', 'Belçika', 'Bulgaristan'],
    'Meslek': ['Berber', 'Bakkal', 'Biyolog']
  },
  C: {
    'İsim': ['Can', 'Cem', 'Ceren', 'Cansu', 'Cihan', 'Ceyda'],
    'Şehir': ['Ceyhan', 'Cizre', 'Cide'],
    'Hayvan': ['Ceylan', 'Civciv', 'Cırcırböceği'],
    'Bitki': ['Ceviz', 'Cennet Hurması'],
    'Eşya': ['Cüzdan', 'Cetvel', 'Ceket', 'Cam'],
    'Ülke': ['Cezayir', 'Cibuti'],
    'Meslek': ['Cerrah', 'Camcı']
  },
  Ç: {
    'İsim': ['Çınar', 'Çağla', 'Çiçek', 'Çağan', 'Çetin'],
    'Şehir': ['Çanakkale', 'Çorum', 'Çankırı', 'Çeşme'],
    'Hayvan': ['Çita', 'Çekirge', 'Çakal'],
    'Bitki': ['Çilek', 'Çam', 'Çınar', 'Çay'],
    'Eşya': ['Çanta', 'Çatal', 'Çorap', 'Çekiç', 'Çerçeve'],
    'Ülke': ['Çin', 'Çekya'],
    'Meslek': ['Çiftçi', 'Çiçekçi', 'Çilingir']
  },
  D: {
    'İsim': ['Deniz', 'Defne', 'Doruk', 'Derya', 'Damla', 'Demir'],
    'Şehir': ['Denizli', 'Diyarbakır', 'Düzce', 'Datça'],
    'Hayvan': ['Deve', 'Domuz', 'Dinazor', 'Doğan'],
    'Bitki': ['Dut', 'Defne', 'Domates', 'Dereotu'],
    'Eşya': ['Dolap', 'Defter', 'Düğme', 'Düdük', 'Davul'],
    'Ülke': ['Danimarka', 'Dominik'],
    'Meslek': ['Doktor', 'Dişçi', 'Dalgıç']
  },
  E: {
    'İsim': ['Elif', 'Emre', 'Ece', 'Ege', 'Ela', 'Eren', 'Esra'],
    'Şehir': ['Eskişehir', 'Erzurum', 'Edirne', 'Elazığ', 'Erzincan'],
    'Hayvan': ['Eşek', 'Engerek'],
    'Bitki': ['Elma', 'Erik', 'Enginar', 'Ebegümeci'],
    'Eşya': ['Eldiven', 'Elbise', 'Ekran', 'Etek'],
    'Ülke': ['Estonya', 'Ekvador', 'Etiyopya'],
    'Meslek': ['Eczacı', 'Elektrikçi', 'Eğitmen']
  },
  F: {
    'İsim': ['Furkan', 'Fatma', 'Funda', 'Fırat', 'Ferit'],
    'Şehir': ['Fethiye', 'Fatsa', 'Foça'],
    'Hayvan': ['Fil', 'Fare', 'Fok', 'Flamingo'],
    'Bitki': ['Fındık', 'Fıstık', 'Fasulye', 'Fesleğen'],
    'Eşya': ['Fırça', 'Fener', 'Fincan', 'Fermuar'],
    'Ülke': ['Fransa', 'Finlandiya', 'Fas'],
    'Meslek': ['Fotoğrafçı', 'Fırıncı', 'Futbolcu']
  },
  G: {
    'İsim': ['Gökhan', 'Gizem', 'Gül', 'Güney', 'Gamze'],
    'Şehir': ['Gaziantep', 'Giresun', 'Gümüşhane', 'Gebze'],
    'Hayvan': ['Geyik', 'Goril', 'Güvercin', 'Gergedan'],
    'Bitki': ['Gül', 'Gelincik', 'Greyfurt'],
    'Eşya': ['Gözlük', 'Gitar', 'Gömlek', 'Gemi'],
    'Ülke': ['Gürcistan', 'Gana', 'Güney Kore'],
    'Meslek': ['Garson', 'Gazeteci', 'Grafiker']
  },
  H: {
    'İsim': ['Hakan', 'Hande', 'Hasan', 'Hira', 'Hilal', 'Halil'],
    'Şehir': ['Hatay', 'Hakkari', 'Hopa'],
    'Hayvan': ['Horoz', 'Hamster', 'Hamsi', 'Hindi'],
    'Bitki': ['Havuç', 'Hurma', 'Hanımeli', 'Hardal'],
    'Eşya': ['Halı', 'Havlu', 'Hırka', 'Huni'],
    'Ülke': ['Hollanda', 'Hindistan', 'Hırvatistan'],
    'Meslek': ['Hemşire', 'Hakem', 'Hakim']
  },
  İ: {
    'İsim': ['İrem', 'İbrahim', 'İlker', 'İpek', 'İsmail', 'İnci'],
    'Şehir': ['İstanbul', 'İzmir', 'İzmit', 'İskenderun', 'İnegöl'],
    'Hayvan': ['İnek', 'İguana', 'İstiridye'],
    'Bitki': ['İncir', 'İğde', 'İsot'],
    'Eşya': ['İğne', 'İp', 'İbrik'],
    'Ülke': ['İtalya', 'İspanya', 'İngiltere', 'İsveç', 'İsviçre'],
    'Meslek': ['İtfaiyeci', 'İnşaatçı', 'İstatistikçi']
  },
  K: {
    'İsim': ['Kerem', 'Kaan', 'Kübra', 'Kemal', 'Kuzey', 'Kıvanç'],
    'Şehir': ['Konya', 'Kayseri', 'Kars', 'Kocaeli', 'Kütahya', 'Kastamonu'],
    'Hayvan': ['Kedi', 'Köpek', 'Kuş', 'Kaplan', 'Kanguru', 'Kirpi', 'Kartal'],
    'Bitki': ['Kiraz', 'Kayısı', 'Karpuz', 'Kavun', 'Karanfil', 'Kaktüs'],
    'Eşya': ['Kalem', 'Kitap', 'Koltuk', 'Kapı', 'Kaşık', 'Kova'],
    'Ülke': ['Kanada', 'Kore', 'Katar', 'Küba', 'Kenya'],
    'Meslek': ['Kasap', 'Kaptan', 'Kuaför', 'Kuyumcu']
  },
  L: {
    'İsim': ['Lale', 'Leyla', 'Levent', 'Lina', 'Lütfi'],
    'Şehir': ['Lüleburgaz', 'Lapseki'],
    'Hayvan': ['Leylek', 'Lama', 'Leopar'],
    'Bitki': ['Limon', 'Lale', 'Lahana', 'Lavanta'],
    'Eşya': ['Lamba', 'Leğen', 'Lastik'],
    'Ülke': ['Litvanya', 'Lübnan', 'Lüksemburg'],
    'Meslek': ['Lokantacı', 'Lojistikçi']
  },
  M: {
    'İsim': ['Mert', 'Melis', 'Mehmet', 'Mira', 'Murat', 'Mustafa', 'Melek'],
    'Şehir': ['Mersin', 'Muğla', 'Malatya', 'Manisa', 'Mardin', 'Muş'],
    'Hayvan': ['Maymun', 'Martı', 'Manda', 'Mors'],
    'Bitki': ['Muz', 'Mandalina', 'Marul', 'Mantar', 'Menekşe', 'Mısır'],
    'Eşya': ['Masa', 'Makas', 'Mum', 'Mont', 'Minder', 'Mikrofon'],
    'Ülke': ['Mısır', 'Meksika', 'Macaristan', 'Malta'],
    'Meslek': ['Mühendis', 'Mimar', 'Marangoz', 'Müzisyen', 'Manav']
  },
  N: {
    'İsim': ['Nehir', 'Naz', 'Nil', 'Nisa', 'Nuri', 'Nihal'],
    'Şehir': ['Niğde', 'Nevşehir', 'Nazilli'],
    'Hayvan': ['Narval', 'Nandu'],
    'Bitki': ['Nar', 'Nane', 'Nergis', 'Nohut'],
    'Eşya': ['Nazar Boncuğu', 'Not Defteri'],
    'Ülke': ['Norveç', 'Nijerya', 'Nepal'],
    'Meslek': ['Noter', 'Nakliyeci']
  },
  O: {
    'İsim': ['Oğuz', 'Onur', 'Orhan', 'Okan', 'Oya'],
    'Şehir': ['Ordu', 'Osmaniye', 'Oltu'],
    'Hayvan': ['Orangutan', 'Orka'],
    'Bitki': ['Orkide', 'Okaliptüs', 'Ot'],
    'Eşya': ['Oklava', 'Oyuncak', 'Oturak'],
    'Ülke': ['Umman', 'Oman'],
    'Meslek': ['Oyuncu', 'Ormancı', 'Operatör']
  },
  Ö: {
    'İsim': ['Ömer', 'Özge', 'Öykü', 'Özgür', 'Özlem'],
    'Şehir': ['Ödemiş', 'Özalp'],
    'Hayvan': ['Ördek', 'Örümcek', 'Öküz'],
    'Bitki': ['Ökseotu'],
    'Eşya': ['Önlük', 'Örtü'],
    'Ülke': ['Özbekistan'],
    'Meslek': ['Öğretmen', 'Öğretim Üyesi']
  },
  P: {
    'İsim': ['Pelin', 'Pınar', 'Poyraz', 'Polat', 'Peri'],
    'Şehir': ['Polatlı', 'Pazar', 'Perşembe'],
    'Hayvan': ['Panda', 'Penguen', 'Papağan', 'Panter', 'Porsuk'],
    'Bitki': ['Portakal', 'Patates', 'Papatya', 'Pırasa', 'Palmiye'],
    'Eşya': ['Perde', 'Pencere', 'Priz', 'Pijama', 'Palto'],
    'Ülke': ['Portekiz', 'Polonya', 'Peru', 'Pakistan'],
    'Meslek': ['Pilot', 'Polis', 'Postacı', 'Psikolog']
  },
  R: {
    'İsim': ['Rüzgar', 'Rana', 'Ramazan', 'Recep', 'Rüya'],
    'Şehir': ['Rize', 'Reyhanlı'],
    'Hayvan': ['Rakun', 'Ren Geyiği'],
    'Bitki': ['Roka', 'Rezene'],
    'Eşya': ['Radyo', 'Rende', 'Raf', 'Ruj'],
    'Ülke': ['Rusya', 'Romanya'],
    'Meslek': ['Ressam', 'Rehber', 'Reklamcı']
  },
  S: {
    'İsim': ['Selin', 'Sinan', 'Sude', 'Selim', 'Seda', 'Sarp'],
    'Şehir': ['Samsun', 'Sivas', 'Sinop', 'Sakarya', 'Siirt'],
    'Hayvan': ['Sincap', 'Salyangoz', 'Sinek', 'Sırtlan'],
    'Bitki': ['Soğan', 'Sarımsak', 'Sümbül', 'Söğüt', 'Salatalık'],
    'Eşya': ['Saat', 'Sandalye', 'Silgi', 'Sepet', 'Süpürge', 'Sabun'],
    'Ülke': ['Sırbistan', 'Singapur', 'Senegal', 'Slovakya'],
    'Meslek': ['Sanatçı', 'Sporcu', 'Sekreter', 'Savcı']
  },
  Ş: {
    'İsim': ['Şeyma', 'Şahin', 'Şule', 'Şenol', 'Şevval'],
    'Şehir': ['Şanlıurfa', 'Şırnak', 'Şile'],
    'Hayvan': ['Şahin', 'Şempanze'],
    'Bitki': ['Şeftali', 'Şalgam', 'Şakayık'],
    'Eşya': ['Şemsiye', 'Şapka', 'Şişe', 'Şal'],
    'Ülke': ['Şili'],
    'Meslek': ['Şoför', 'Şair', 'Şarkıcı', 'Şef']
  },
  T: {
    'İsim': ['Tarık', 'Tuğba', 'Toprak', 'Tuna', 'Tolga', 'Taha'],
    'Şehir': ['Trabzon', 'Tokat', 'Tekirdağ', 'Tunceli', 'Tarsus'],
    'Hayvan': ['Tilki', 'Tavşan', 'Tavuk', 'Timsah', 'Tırtıl'],
    'Bitki': ['Turp', 'Tere', 'Tarçın'],
    'Eşya': ['Tabak', 'Tarak', 'Telefon', 'Televizyon', 'Tencere', 'Top'],
    'Ülke': ['Türkiye', 'Tunus', 'Tayland', 'Türkmenistan'],
    'Meslek': ['Terzi', 'Tamirci', 'Tasarımcı', 'Tesisatçı']
  },
  U: {
    'İsim': ['Umut', 'Uras', 'Uğur', 'Ufuk', 'Utku'],
    'Şehir': ['Uşak', 'Urfa', 'Urla'],
    'Hayvan': ['Uğur Böceği'],
    'Bitki': ['Unutma Beni'],
    'Eşya': ['Uçurtma', 'Uyku Tulumu'],
    'Ülke': ['Ukrayna', 'Uruguay', 'Uganda'],
    'Meslek': ['Uçak Mühendisi', 'Usta']
  },
  Ü: {
    'İsim': ['Ümit', 'Ülkü', 'Ünal', 'Üzeyir'],
    'Şehir': ['Ürgüp', 'Ünye'],
    'Hayvan': ['Üveyik'],
    'Bitki': ['Üzüm'],
    'Eşya': ['Ütü'],
    'Ülke': ['Ürdün'],
    'Meslek': ['Ürolog']
  },
  V: {
    'İsim': ['Volkan', 'Veli', 'Vildan', 'Vural'],
    'Şehir': ['Van', 'Vize'],
    'Hayvan': ['Vaşak', 'Vatoz'],
    'Bitki': ['Vişne', 'Vanilya'],
    'Eşya': ['Vazo', 'Valiz', 'Vida', 'Vantilatör'],
    'Ülke': ['Venezuela', 'Vietnam', 'Vatikan'],
    'Meslek': ['Veteriner', 'Vali']
  },
  Y: {
    'İsim': ['Yusuf', 'Yağmur', 'Yiğit', 'Yaren', 'Yunus', 'Yasemin'],
    'Şehir': ['Yalova', 'Yozgat'],
    'Hayvan': ['Yunus', 'Yılan', 'Yengeç', 'Yarasa'],
    'Bitki': ['Yulaf', 'Yonca', 'Yasemin', 'Yer Fıstığı'],
    'Eşya': ['Yastık', 'Yorgan', 'Yüzük', 'Yatak'],
    'Ülke': ['Yunanistan', 'Yemen', 'Yeni Zelanda'],
    'Meslek': ['Yazar', 'Yönetmen', 'Yazılımcı']
  },
  Z: {
    'İsim': ['Zeynep', 'Zehra', 'Zafer', 'Zeki', 'Zümra'],
    'Şehir': ['Zonguldak', 'Zile'],
    'Hayvan': ['Zürafa', 'Zebra'],
    'Bitki': ['Zeytin', 'Zambak', 'Zencefil'],
    'Eşya': ['Zil', 'Zarf', 'Zımba'],
    'Ülke': ['Zambiya', 'Zimbabve'],
    'Meslek': ['Ziraat Mühendisi', 'Zabıta']
  }
};

  function getRandomWordForBot(letter, category) {
    const list = WORD_BANK[letter]?.[category];
    if (!list || list.length === 0) return '';
    return list[Math.floor(Math.random() * list.length)];
  }

  function getHintForCategory(letter, category) {
    const list = WORD_BANK[letter]?.[category];
    if (!list || list.length === 0) {
      return `“${letter}” harfi ile başlayan bir ${category.toLowerCase()} düşün!`;
    }
    const sample = list[Math.floor(Math.random() * list.length)];
    const chars = [...sample];
    const masked = chars
      .map((ch, idx) => (idx === 0 || idx === chars.length - 1 || ch === ' ' ? ch : '_'))
      .join(' ');
    return `“${letter}” harfli ${category} ipucu (${chars.length} harf): ${masked}`;
  }

  ISH.VALID_LETTERS = VALID_LETTERS;
  ISH.CATEGORY_META = CATEGORY_META;
  ISH.WORD_BANK = WORD_BANK;
  ISH.normalizeTr = normalizeTr;
  ISH.startsWithLetterTr = startsWithLetterTr;
  ISH.getRandomWordForBot = getRandomWordForBot;
  ISH.getHintForCategory = getHintForCategory;
})(window);
