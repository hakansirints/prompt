// Türkçe İsim Şehir Hayvan — Kapsamlı Sözlük + 3 Katmanlı Akıllı Kelime Doğrulama
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
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#0284C7" stroke-width="2.4"/><path d="M8.5 14.5C9.3 16 10.6 16.8 12 16.8C13.4 16.8 14.7 16 15.5 14.5" stroke="#0284C7" stroke-width="2.4" stroke-linecap="round"/><circle cx="9" cy="10" r="1.3" fill="#0284C7"/><circle cx="15" cy="10" r="1.3" fill="#0284C7"/></svg>`
    },
    'Şehir': {
      key: 'sehir', label: 'Şehir', color: '#FB923C', light: '#FFEDD5', dark: '#C2410C', shadow: '#FED7AA',
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 20V9L9 5L14 9V20M14 20V11H20V20M2 20H22" stroke="#C2410C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="13" width="2" height="3" fill="#C2410C"/><rect x="16" y="14" width="2" height="2" fill="#C2410C"/></svg>`
    },
    'Hayvan': {
      key: 'hayvan', label: 'Hayvan', color: '#4ADE80', light: '#DCFCE7', dark: '#15803D', shadow: '#BBF7D0',
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="7.5" cy="8.5" r="2.2" fill="#15803D"/><circle cx="12" cy="6.5" r="2.2" fill="#15803D"/><circle cx="16.5" cy="8.5" r="2.2" fill="#15803D"/><path d="M7 15.5C7 13 9.2 11 12 11C14.8 11 17 13 17 15.5C17 17.5 15.4 19 13.5 19H10.5C8.6 19 7 17.5 7 15.5Z" fill="#15803D"/></svg>`
    },
    'Bitki': {
      key: 'bitki', label: 'Bitki', color: '#A78BFA', light: '#F3E8FF', dark: '#6D28D9', shadow: '#DDD6FE',
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21V11M12 11C12 6.5 15.5 4 20 4C20 8.5 17.5 12 12 11ZM12 14C12 10.5 9 8 4 8C4 12 6.5 15 12 14Z" stroke="#6D28D9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    },
    'Eşya': {
      key: 'esya', label: 'Eşya', color: '#F472B6', light: '#FCE7F3', dark: '#BE185D', shadow: '#FBCFE8',
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="4" y="8" width="16" height="12" rx="3" stroke="#BE185D" stroke-width="2.2"/><path d="M9 8V6C9 4.3 10.3 3 12 3C13.7 3 15 4.3 15 6V8" stroke="#BE185D" stroke-width="2.2"/><path d="M4 13H20" stroke="#BE185D" stroke-width="2"/></svg>`
    },
    'Ülke': {
      key: 'ulke', label: 'Ülke', color: '#14B8A6', light: '#CCFBF1', dark: '#0F766E', shadow: '#99F6E4',
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#0F766E" stroke-width="2.2"/><path d="M3 12H21M12 3C14.5 5.7 15.8 8.8 15.8 12C15.8 15.2 14.5 18.3 12 21C9.5 18.3 8.2 15.2 8.2 12C8.2 8.8 9.5 5.7 12 3Z" stroke="#0F766E" stroke-width="2"/></svg>`
    },
    'Meslek': {
      key: 'meslek', label: 'Meslek', color: '#F59E0B', light: '#FEF3C7', dark: '#B45309', shadow: '#FDE68A',
      svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="12" rx="2.5" stroke="#B45309" stroke-width="2.2"/><path d="M8 8V6C8 4.9 8.9 4 10 4H14C15.1 4 16 4.9 16 6V8" stroke="#B45309" stroke-width="2.2"/><path d="M3 13H21" stroke="#B45309" stroke-width="2"/></svg>`
    }
  };

  function normalizeTr(str) {
    return (str || '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr-TR');
  }

  // Geniş Türkçe Kategori Sözlüğü (81 İl + ilçeler + yüzlerce isim, hayvan, bitki, eşya, ülke, meslek)
  const WORD_BANK = {
    A: {
      'İsim': ['Ahmet', 'Ali', 'Ayşe', 'Arda', 'Aslı', 'Ada', 'Alp', 'Alper', 'Aras', 'Asya', 'Aylin', 'Ayla', 'Aybüke', 'Azra', 'Ayhan', 'Atakan', 'Adem', 'Aleyna', 'Arzu', 'Aysun', 'Aykut', 'Akın', 'Alparslan', 'Almila', 'Anıl', 'Asude'],
      'Şehir': ['Adana', 'Adıyaman', 'Afyon', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Alanya', 'Ayvalık', 'Akhisar', 'Akşehir', 'Atina', 'Amsterdam'],
      'Hayvan': ['Aslan', 'At', 'Ayı', 'Arı', 'Ahtapot', 'Akrep', 'Alabalık', 'Akbaba', 'Antilop', 'Anakonda', 'Ağaçkakan', 'Ateşböceği', 'Atmaca'],
      'Bitki': ['Armut', 'Ayva', 'Arpa', 'Avokado', 'Akasya', 'Ahududu', 'Ananas', 'Ayçiçeği', 'Asma', 'Aloe Vera', 'Ardıç', 'Adaçayı', 'Altınçilek'],
      'Eşya': ['Ayna', 'Anahtar', 'Askı', 'Abajur', 'Araba', 'Ayakkabı', 'Atkı', 'Albüm', 'Ampul', 'Avize', 'Ataş', 'Ajanda', 'Alet'],
      'Ülke': ['Almanya', 'Arjantin', 'Avustralya', 'Avusturya', 'Azerbaycan', 'Amerika', 'Arnavutluk', 'Afganistan', 'Andorra', 'Angola'],
      'Meslek': ['Avukat', 'Aşçı', 'Astronot', 'Antrenör', 'Arkeolog', 'Aktör', 'Akademisyen', 'Ayakkabıcı', 'Aktar', 'Arıcı']
    },
    B: {
      'İsim': ['Burak', 'Beren', 'Berk', 'Bahar', 'Barış', 'Buse', 'Berke', 'Batu', 'Batuhan', 'Begüm', 'Belinay', 'Bengü', 'Berat', 'Berna', 'Betül', 'Beyza', 'Bilge', 'Bora', 'Buğra', 'Burcu', 'Büşra', 'Bülent', 'Berkay', 'Buket'],
      'Şehir': ['Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Bodrum', 'Bandırma', 'Bergama', 'Beyşehir', 'Berlin', 'Bakü', 'Barselona'],
      'Hayvan': ['Balina', 'Balık', 'Baykuş', 'Böcek', 'Bizon', 'Boğa', 'Bülbül', 'Bıldırcın', 'Bukalemun', 'Bufalo', 'Bozayı', 'Buzağı'],
      'Bitki': ['Biber', 'Badem', 'Brokoli', 'Böğürtlen', 'Buğday', 'Bamya', 'Bezelye', 'Bambu', 'Begonya', 'Biberiye', 'Balkabağı', 'Börülce'],
      'Eşya': ['Bardak', 'Bıçak', 'Bavul', 'Battaniye', 'Boya', 'Bisiklet', 'Buzdolabı', 'Bilgisayar', 'Bant', 'Bileklik', 'Boru', 'Balon', 'Biberon', 'Bluz', 'Bot'],
      'Ülke': ['Brezilya', 'Belçika', 'Bulgaristan', 'Bosna Hersek', 'Bahreyn', 'Bangladeş', 'Belarus', 'Bolivya', 'Botsvana', 'Birleşik Krallık'],
      'Meslek': ['Berber', 'Bakkal', 'Biyolog', 'Bankacı', 'Bakan', 'Balıkçı', 'Balerin', 'Barmen', 'Boyacı', 'Borsacı']
    },
    C: {
      'İsim': ['Can', 'Cem', 'Ceren', 'Cansu', 'Cihan', 'Ceyda', 'Canan', 'Caner', 'Cemre', 'Cemil', 'Ceylin', 'Cüneyt', 'Celal', 'Cavit', 'Cengiz', 'Cenk'],
      'Şehir': ['Ceyhan', 'Cizre', 'Cide', 'Ceylanpınar', 'Cenevre', 'Cakarta'],
      'Hayvan': ['Ceylan', 'Civciv', 'Cırcırböceği', 'Cüce Maymun', 'Ceylan Balığı'],
      'Bitki': ['Ceviz', 'Cennet Hurması', 'Civanperçemi', 'Cibez'],
      'Eşya': ['Cüzdan', 'Cetvel', 'Ceket', 'Cam', 'Cımbız', 'Cezve', 'Cıvata', 'Cep Telefonu'],
      'Ülke': ['Cezayir', 'Cibuti', 'Cabo Verde'],
      'Meslek': ['Cerrah', 'Camcı', 'Can Kurtaran', 'Cankurtaran', 'Ciltçi']
    },
    Ç: {
      'İsim': ['Çınar', 'Çağla', 'Çiçek', 'Çağan', 'Çetin', 'Çağrı', 'Çağatay', 'Çiğdem', 'Çisil', 'Çağdaş'],
      'Şehir': ['Çanakkale', 'Çankırı', 'Çorum', 'Çeşme', 'Çorlu', 'Çubuk', 'Çerkezköy', 'Çayeli', 'Çarşamba'],
      'Hayvan': ['Çita', 'Çekirge', 'Çakal', 'Çipura', 'Çoban Köpeği', 'Çaylak', 'Çulluk'],
      'Bitki': ['Çilek', 'Çam', 'Çınar', 'Çay', 'Çiğdem', 'Çörekotu', 'Çavdar', 'Çarkıfelek', 'Çuha Çiçeği'],
      'Eşya': ['Çanta', 'Çatal', 'Çorap', 'Çekiç', 'Çerçeve', 'Çaydanlık', 'Çamaşır Makinesi', 'Çakmak', 'Çivi', 'Çadır', 'Çizme', 'Çöp Kutusu', 'Çalar Saat'],
      'Ülke': ['Çin', 'Çekya', 'Çad', 'Çek Cumhuriyeti'],
      'Meslek': ['Çiftçi', 'Çiçekçi', 'Çilingir', 'Çoban', 'Çaycı', 'Çevirmen', 'Çöpçü']
    },
    D: {
      'İsim': ['Deniz', 'Defne', 'Doruk', 'Derya', 'Damla', 'Demir', 'Doğa', 'Doğan', 'Dilan', 'Dilara', 'Duru', 'Duygu', 'Dilek', 'Derin', 'Devrim', 'Dicle', 'Davut'],
      'Şehir': ['Denizli', 'Diyarbakır', 'Düzce', 'Datça', 'Didim', 'Dalaman', 'Develi', 'Doğubayazıt', 'Dublin', 'Dubai'],
      'Hayvan': ['Deve', 'Domuz', 'Dinazor', 'Dinozor', 'Doğan', 'Denizatı', 'Denizyıldızı', 'Denizanası', 'Devekuşu', 'Dülger Balığı'],
      'Bitki': ['Dut', 'Defne', 'Domates', 'Dereotu', 'Dikenli İncir', 'Darçın', 'Darı'],
      'Eşya': ['Dolap', 'Defter', 'Düğme', 'Düdük', 'Davul', 'Dürbün', 'Dondurucu', 'Duvak', 'Dergi', 'Dosya', 'Demlik', 'Dambıl'],
      'Ülke': ['Danimarka', 'Dominik', 'Dominika', 'Doğu Timor'],
      'Meslek': ['Doktor', 'Dişçi', 'Diş Hekimi', 'Dalgıç', 'Demirci', 'Diyetisyen', 'Dansçı', 'Dekoratör', 'Dadı', 'Dedektif']
    },
    E: {
      'İsim': ['Elif', 'Emre', 'Ece', 'Ege', 'Ela', 'Eren', 'Esra', 'Efe', 'Eda', 'Ebru', 'Ecrin', 'Eylül', 'Emir', 'Emirhan', 'Enes', 'Eymen', 'Esma', 'Erdem', 'Erkan', 'Esin', 'Evren', 'Ezgı', 'Ezgi'],
      'Şehir': ['Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Edremit', 'Ereğli', 'Erbaa', 'Elbistan', 'Erciş'],
      'Hayvan': ['Eşek', 'Engerek', 'Eşek Arısı', 'Ejderha', 'Emu'],
      'Bitki': ['Elma', 'Erik', 'Enginar', 'Ebegümeci', 'Ekinezya', 'Erguvan'],
      'Eşya': ['Eldiven', 'Elbise', 'Ekran', 'Etek', 'Eşarp', 'El Feneri', 'Elek', 'Eşofman', 'Ev', 'El Arabası'],
      'Ülke': ['Estonya', 'Ekvador', 'Etiyopya', 'Ermenistan', 'El Salvador', 'Eritre'],
      'Meslek': ['Eczacı', 'Elektrikçi', 'Eğitmen', 'Emlakçı', 'Ebe', 'Editör', 'Ekonomist', 'Esnaf']
    },
    F: {
      'İsim': ['Furkan', 'Fatma', 'Funda', 'Fırat', 'Ferit', 'Fatih', 'Faruk', 'Feyza', 'Filiz', 'Ferhat', 'Fikret', 'Figen', 'Feride', 'Fehmi', 'Fulya'],
      'Şehir': ['Fethiye', 'Fatsa', 'Foça', 'Finike', 'Fındıklı', 'Floransa', 'Frankfurt'],
      'Hayvan': ['Fil', 'Fare', 'Fok', 'Flamingo', 'Fırtına Kuşu', 'Fener Balığı'],
      'Bitki': ['Fındık', 'Fıstık', 'Fasulye', 'Fesleğen', 'Frenk Üzümü', 'Funda', 'Fulya'],
      'Eşya': ['Fırça', 'Fener', 'Fincan', 'Fermuar', 'Fırın', 'Flaş', 'Fular', 'Flüt', 'File', 'Fıçı', 'Fotoğraf Makinesi'],
      'Ülke': ['Fransa', 'Finlandiya', 'Fas', 'Filipinler', 'Fiji', 'Fildişi Sahili'],
      'Meslek': ['Fotoğrafçı', 'Fırıncı', 'Futbolcu', 'Fizyoterapist', 'Fizikçi', 'Filozof', 'Fuar Hostesi']
    },
    G: {
      'İsim': ['Gökhan', 'Gizem', 'Gül', 'Güney', 'Gamze', 'Gökçe', 'Göktuğ', 'Gülşen', 'Gülşah', 'Gülcan', 'Gürkan', 'Güven', 'Gönül', 'Gözde', 'Gülizar', 'Görkem'],
      'Şehir': ['Gaziantep', 'Giresun', 'Gümüşhane', 'Gebze', 'Gelibolu', 'Gemlik', 'Gönen', 'Göreme', 'Gerede'],
      'Hayvan': ['Geyik', 'Goril', 'Güvercin', 'Gergedan', 'Guguk Kuşu', 'Gelinböceği', 'Gelincik'],
      'Bitki': ['Gül', 'Gelincik', 'Greyfurt', 'Gürgen', 'Glayöl', 'Goji Berry', 'Ginseng'],
      'Eşya': ['Gözlük', 'Gitar', 'Gömlek', 'Gemi', 'Gümüş', 'Güğüm', 'Gazete', 'Geyik Heykeli', 'Gardırop'],
      'Ülke': ['Gürcistan', 'Gana', 'Güney Kore', 'Güney Afrika', 'Gine', 'Guatemala', 'Guyana', 'Gambiya', 'Gabon'],
      'Meslek': ['Garson', 'Gazeteci', 'Grafiker', 'Göz Doktoru', 'Gemicilik', 'Güvenlik Görevlisi', 'Gümrük Memuru']
    },
    H: {
      'İsim': ['Hakan', 'Hande', 'Hasan', 'Hira', 'Hilal', 'Halil', 'Hüseyin', 'Hatice', 'Havva', 'Hacer', 'Hale', 'Harun', 'Hayri', 'Hayat', 'Hazal', 'Hazar', 'Hümeyra', 'Hülya', 'Hamza'],
      'Şehir': ['Hakkari', 'Hatay', 'Hopa', 'Hayrabolu', 'Hendek', 'Hınıs', 'Honaz', 'Hamburg', 'Helsinki'],
      'Hayvan': ['Horoz', 'Hamster', 'Hamsi', 'Hindi', 'Hipopotam', 'Hüthüt', 'Hazar Foku'],
      'Bitki': ['Havuç', 'Hurma', 'Hanımeli', 'Hardal', 'Haşhaş', 'Hindistancevizi', 'Hünnap', 'Hıyar', 'Hatmi'],
      'Eşya': ['Halı', 'Havlu', 'Hırka', 'Huni', 'Havan', 'Hoparlör', 'Harita', 'Hamak', 'Halter', 'Helikopter'],
      'Ülke': ['Hollanda', 'Hindistan', 'Hırvatistan', 'Haiti', 'Honduras'],
      'Meslek': ['Hemşire', 'Hakem', 'Hakim', 'Hostes', 'Heykeltıraş', 'Hekim', 'Haritacı', 'Hukukçu']
    },
    İ: {
      'İsim': ['İrem', 'İbrahim', 'İlker', 'İpek', 'İsmail', 'İnci', 'İlayda', 'İlknur', 'İlhan', 'İhsan', 'İdris', 'İclal', 'İdil', 'İkra', 'İlke', 'İlyas', 'İrfan', 'İsa'],
      'Şehir': ['İstanbul', 'İzmir', 'İzmit', 'İskenderun', 'İnegöl', 'İznik', 'İslahiye', 'İpsala', 'İskilip'],
      'Hayvan': ['İnek', 'İguana', 'İstiridye', 'İbibik', 'İspinoz', 'İskorpit', 'İpek Böceği', 'İmpala'],
      'Bitki': ['İncir', 'İğde', 'İsot', 'İris', 'İsveç Kirazı', 'İncir Ağacı'],
      'Eşya': ['İğne', 'İp', 'İbrik', 'İplik', 'İskemle', 'İlaç Kutusu', 'İmza Kalemi'],
      'Ülke': ['İtalya', 'İspanya', 'İngiltere', 'İsveç', 'İsviçre', 'İrlanda', 'İzlanda', 'İran', 'İsrail', 'Endonezya'],
      'Meslek': ['İtfaiyeci', 'İnşaatçı', 'İstatistikçi', 'İmam', 'İktisatçı', 'İç Mimar', 'İllüstratör', 'İşletmeci']
    },
    K: {
      'İsim': ['Kerem', 'Kaan', 'Kübra', 'Kemal', 'Kuzey', 'Kıvanç', 'Kadir', 'Kader', 'Kağan', 'Kamil', 'Kardelen', 'Kaya', 'Kazım', 'Kenan', 'Kerim', 'Koray', 'Kudret', 'Kürşat'],
      'Şehir': ['Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Kuşadası', 'Kaş', 'Kemer', 'Keşan', 'Kahire'],
      'Hayvan': ['Kedi', 'Köpek', 'Kuş', 'Kaplan', 'Kanguru', 'Kirpi', 'Kartal', 'Kelebek', 'Karınca', 'Kaplumbağa', 'Koyun', 'Keçi', 'Kurbağa', 'Kurt', 'Kunduz', 'Kuğu', 'Karga', 'Kanarya', 'Koala', 'Kertenkele', 'Köstebek'],
      'Bitki': ['Kiraz', 'Kayısı', 'Karpuz', 'Kavun', 'Karanfil', 'Kaktüs', 'Kivi', 'Kabak', 'Karnabahar', 'Kereviz', 'Kestane', 'Kekik', 'Kızılcık', 'Kavak', 'Kayın', 'Keten', 'Kuşburnu'],
      'Eşya': ['Kalem', 'Kitap', 'Koltuk', 'Kapı', 'Kaşık', 'Kova', 'Kupa', 'Kutu', 'Kemer', 'Kazak', 'Klavye', 'Kulaklık', 'Kamera', 'Kilit', 'Kibrit', 'Küpe', 'Kravat', 'Karyola', 'Kazan', 'Kase', 'Kalemlik'],
      'Ülke': ['Kanada', 'Kore', 'Katar', 'Küba', 'Kenya', 'Kazakistan', 'Kırgızistan', 'Kıbrıs', 'Kolombiya', 'Kuveyt', 'Kamboçya', 'Kamerun', 'Karadağ', 'Kosova', 'Kosta Rika'],
      'Meslek': ['Kasap', 'Kaptan', 'Kuaför', 'Kuyumcu', 'Kimyager', 'Kasiyer', 'Kütüphaneci', 'Kameraman', 'Kalaycı', 'Kurye', 'Komiser', 'Kabin Memuru']
    },
    L: {
      'İsim': ['Lale', 'Leyla', 'Levent', 'Lina', 'Lütfi', 'Latif', 'Lara', 'Leman', 'Lütfiye', 'Lavin'],
      'Şehir': ['Lüleburgaz', 'Lapseki', 'Ladik', 'Lice', 'Londra', 'Lizbon', 'Lyon', 'Los Angeles'],
      'Hayvan': ['Leylek', 'Lama', 'Leopar', 'Levrek', 'Lüfer', 'Lemur', 'Langust'],
      'Bitki': ['Limon', 'Lale', 'Lahana', 'Lavanta', 'Ladin', 'Leylak', 'Liçi', 'Lotus'],
      'Eşya': ['Lamba', 'Leğen', 'Lastik', 'Lavabo', 'Lazer', 'Legolar', 'Lüks Lamba'],
      'Ülke': ['Litvanya', 'Lübnan', 'Lüksemburg', 'Letonya', 'Libya', 'Liberya', 'Lesotho', 'Lihtenştayn'],
      'Meslek': ['Lokantacı', 'Lojistikçi', 'Laborant', 'Liman İşçisi', 'Lastikçi']
    },
    M: {
      'İsim': ['Mert', 'Melis', 'Mehmet', 'Mira', 'Murat', 'Mustafa', 'Melek', 'Melike', 'Merve', 'Meryem', 'Metin', 'Mina', 'Miraç', 'Miray', 'Muhammed', 'Muhammet', 'Musa', 'Mine', 'Melisa', 'Melih', 'Mahmut', 'Mesut', 'Mete'],
      'Şehir': ['Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş', 'Marmaris', 'Milas', 'Mudanya', 'Menemen', 'Midyat', 'Manavgat', 'Merzifon', 'Madrid', 'Milano', 'Moskova', 'Münih'],
      'Hayvan': ['Maymun', 'Martı', 'Manda', 'Mors', 'Midye', 'Müren', 'Mezgit', 'Muhabbet Kuşu', 'Mamut', 'Mirket'],
      'Bitki': ['Muz', 'Mandalina', 'Marul', 'Mantar', 'Menekşe', 'Mısır', 'Maydanoz', 'Mürdüm Eriği', 'Mango', 'Mercimek', 'Manolya', 'Meşe', 'Mersin', 'Mimoza', 'Melisa'],
      'Eşya': ['Masa', 'Makas', 'Mum', 'Mont', 'Minder', 'Mikrofon', 'Monitör', 'Mouse', 'Merdane', 'Matara', 'Mendil', 'Maşa', 'Mikser', 'Mıknatıs', 'Mühür', 'Matkap', 'Musluk'],
      'Ülke': ['Mısır', 'Meksika', 'Macaristan', 'Malta', 'Malezya', 'Maldivler', 'Moldova', 'Monako', 'Moğolistan', 'Makedonya', 'Mozambik', 'Mali', 'Myanmar'],
      'Meslek': ['Mühendis', 'Mimar', 'Marangoz', 'Müzisyen', 'Manav', 'Muhasebeci', 'Müdür', 'Müfettiş', 'Modacı', 'Makinist', 'Manken', 'Matematikçi', 'Mobilyacı']
    },
    N: {
      'İsim': ['Nehir', 'Naz', 'Nil', 'Nisa', 'Nuri', 'Nihal', 'Nazlı', 'Nazan', 'Necip', 'Nermin', 'Neslihan', 'Nesrin', 'Nevin', 'Nihat', 'Nilay', 'Nilüfer', 'Nur', 'Nuran', 'Nuray', 'Nurgül', 'Nursel'],
      'Şehir': ['Nevşehir', 'Niğde', 'Nazilli', 'Niksar', 'Nizip', 'Nusaybin', 'Nallıhan', 'Napoli', 'New York'],
      'Hayvan': ['Narval', 'Nandu', 'Nehir Yunusu', 'Nehir Timsahı'],
      'Bitki': ['Nar', 'Nane', 'Nergis', 'Nohut', 'Nilüfer', 'Nektarin'],
      'Eşya': ['Nazar Boncuğu', 'Not Defteri', 'Nal', 'Naylon', 'Nargile', 'Nevresim', 'Nişan Yüzüğü'],
      'Ülke': ['Norveç', 'Nijerya', 'Nepal', 'Nijer', 'Nikaragua', 'Namibya', 'Nauru'],
      'Meslek': ['Noter', 'Nakliyeci', 'Nörolog', 'Nalıncı', 'Nükleer Fizikçi']
    },
    O: {
      'İsim': ['Oğuz', 'Onur', 'Orhan', 'Okan', 'Oya', 'Oğuzhan', 'Oktay', 'Olcay', 'Orkun', 'Osman', 'Ozan'],
      'Şehir': ['Ordu', 'Osmaniye', 'Oltu', 'Of', 'Orhangazi', 'Ortaca', 'Osmancık', 'Oslo', 'Ottawa'],
      'Hayvan': ['Orangutan', 'Orka', 'Ocelot', 'Opossum'],
      'Bitki': ['Orkide', 'Okaliptüs', 'Ot', 'Oğulotu', 'Orman Gülü'],
      'Eşya': ['Oklava', 'Oyuncak', 'Oturak', 'Ocak', 'Olta', 'Org', 'Otomobil', 'Oyun Konsolu'],
      'Ülke': ['Oman', 'Umman'],
      'Meslek': ['Oyuncu', 'Ormancı', 'Operatör', 'Odyolog', 'Optisyen', 'Ortopedist', 'Otelci']
    },
    Ö: {
      'İsim': ['Ömer', 'Özge', 'Öykü', 'Özgür', 'Özlem', 'Önder', 'Özcan', 'Özden', 'Özer', 'Özkan', 'Öznur', 'Özhan'],
      'Şehir': ['Ödemiş', 'Özalp', 'Ömerli'],
      'Hayvan': ['Ördek', 'Örümcek', 'Öküz', 'Ötücü Kuş'],
      'Bitki': ['Ökseotu', 'Ölmez Çiçek'],
      'Eşya': ['Önlük', 'Örtü', 'Örgü Şişi', 'Ölçü Kabı', 'Örs'],
      'Ülke': ['Özbekistan'],
      'Meslek': ['Öğretmen', 'Öğretim Üyesi', 'Öğretim Görevlisi', 'Özel Güvenlik']
    },
    P: {
      'İsim': ['Pelin', 'Pınar', 'Poyraz', 'Polat', 'Peri', 'Perihan', 'Pamir', 'Pırıl', 'Peker', 'Pakize'],
      'Şehir': ['Polatlı', 'Pazar', 'Perşembe', 'Pazarcık', 'Patnos', 'Pınarbaşı', 'Paris', 'Prag', 'Pekin'],
      'Hayvan': ['Panda', 'Penguen', 'Papağan', 'Panter', 'Porsuk', 'Puma', 'Pire', 'Palamut', 'Piranha', 'Pisi Balığı'],
      'Bitki': ['Portakal', 'Patates', 'Papatya', 'Pırasa', 'Palmiye', 'Pancar', 'Patlıcan', 'Pamuk', 'Pazı', 'Papaya', 'Pelin Otu'],
      'Eşya': ['Perde', 'Pencere', 'Priz', 'Pijama', 'Palto', 'Pantolon', 'Paspas', 'Piyano', 'Pense', 'Pusulа', 'Pusula', 'Plak', 'Peçete', 'Poşet', 'Puf', 'Pano'],
      'Ülke': ['Portekiz', 'Polonya', 'Peru', 'Pakistan', 'Panama', 'Paraguay', 'Papua Yeni Gine'],
      'Meslek': ['Pilot', 'Polis', 'Postacı', 'Psikolog', 'Psikiyatrist', 'Pazarcı', 'Pastacı', 'Profesör', 'Programcı', 'Piyanist', 'Peyzaj Mimarı']
    },
    R: {
      'İsim': ['Rüzgar', 'Rana', 'Ramazan', 'Recep', 'Rüya', 'Rahmi', 'Rasim', 'Rauf', 'Recai', 'Refik', 'Remzi', 'Resul', 'Reyhan', 'Rıdvan', 'Rıza', 'Roza'],
      'Şehir': ['Rize', 'Reyhanlı', 'Refahiye', 'Roma', 'Rio', 'Rotterdam'],
      'Hayvan': ['Rakun', 'Ren Geyiği', 'Ringa Balığı'],
      'Bitki': ['Roka', 'Rezene', 'Reyhan', 'Ravend'],
      'Eşya': ['Radyo', 'Rende', 'Raf', 'Ruj', 'Raket', 'Ranza', 'Robot', 'Raptiye', 'Rulo'],
      'Ülke': ['Rusya', 'Romanya', 'Ruanda'],
      'Meslek': ['Ressam', 'Rehber', 'Reklamcı', 'Radyolog', 'Rektör', 'Resepsiyonist', 'Rejisör']
    },
    S: {
      'İsim': ['Selin', 'Sinan', 'Sude', 'Selim', 'Seda', 'Sarp', 'Sena', 'Serkan', 'Serhat', 'Sevgi', 'Sevil', 'Sevim', 'Sıla', 'Sibel', 'Simge', 'Soner', 'Su', 'Suat', 'Sultan', 'Süleyman', 'Süheyla', 'Sema', 'Semih', 'Samet', 'Salih', 'Sami'],
      'Şehir': ['Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Salihli', 'Safranbolu', 'Sandıklı', 'Sarıkamış', 'Seferihisar', 'Selçuk', 'Silifke', 'Silivri', 'Siverek', 'Soma', 'Söke', 'Sungurlu', 'Susurluk', 'Seul', 'Sofya', 'Sidney'],
      'Hayvan': ['Sincap', 'Salyangoz', 'Sinek', 'Sırtlan', 'Serçe', 'Sansar', 'Sazan', 'Sardalya', 'Sülün', 'Sümüklüböcek', 'Sivrisinek', 'Su Aygırı', 'Samur', 'Somon'],
      'Bitki': ['Soğan', 'Sarımsak', 'Sümbül', 'Söğüt', 'Salatalık', 'Semizotu', 'Susam', 'Sardunya', 'Sarmaşık', 'Sığla', 'Safran', 'Soya', 'Selvi'],
      'Eşya': ['Saat', 'Sandalye', 'Silgi', 'Sepet', 'Süpürge', 'Sabun', 'Sürahi', 'Süzgeç', 'Sehpa', 'Soba', 'Saksı', 'Sırt Çantası', 'Sıra', 'Süngü', 'Sünger', 'Saz', 'Silindir', 'Sandal', 'Sprey'],
      'Ülke': ['Sırbistan', 'Singapur', 'Senegal', 'Slovakya', 'Slovenya', 'Suriye', 'Suudi Arabistan', 'Sudan', 'Somali', 'Sri Lanka', 'Surinam'],
      'Meslek': ['Sanatçı', 'Sporcu', 'Sekreter', 'Savcı', 'Satıcı', 'Saatçi', 'Sosyolog', 'Spiker', 'Sütçü', 'Simitçi', 'Sıvacı', 'Senarist', 'Sigortacı']
    },
    Ş: {
      'İsim': ['Şeyma', 'Şahin', 'Şule', 'Şenol', 'Şevval', 'Şafak', 'Şamil', 'Şebnem', 'Şefika', 'Şehnaz', 'Şeker', 'Şerife', 'Şeyda', 'Şirin', 'Şükrü', 'Şükran'],
      'Şehir': ['Şanlıurfa', 'Şırnak', 'Şile', 'Şarköy', 'Şarkışla', 'Şebinkarahisar', 'Şereflikoçhisar', 'Şam', 'Şanghay'],
      'Hayvan': ['Şahin', 'Şempanze', 'Şebek'],
      'Bitki': ['Şeftali', 'Şalgam', 'Şakayık', 'Şeker Kamışı', 'Şerbetçiotu', 'Şimşir'],
      'Eşya': ['Şemsiye', 'Şapka', 'Şişe', 'Şal', 'Şort', 'Şarj Aleti', 'Şamdan', 'Şezlong', 'Şifonyer', 'Şırınga', 'Şilte'],
      'Ülke': ['Şili'],
      'Meslek': ['Şoför', 'Şair', 'Şarkıcı', 'Şef', 'Şapkacı', 'Şehir Plancısı']
    },
    T: {
      'İsim': ['Tarık', 'Tuğba', 'Toprak', 'Tuna', 'Tolga', 'Taha', 'Tahir', 'Talha', 'Tamer', 'Taner', 'Tansu', 'Tayfun', 'Taylan', 'Tekin', 'Temel', 'Teoman', 'Tuğçe', 'Tuğrul', 'Tuncay', 'Turgut', 'Turhan', 'Tülay', 'Tülin', 'Türkan'],
      'Şehir': ['Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Tarsus', 'Tatvan', 'Tavşanlı', 'Tire', 'Torbalı', 'Tosya', 'Turgutlu', 'Turhal', 'Tokyo', 'Toronto', 'Tiflis', 'Tahran'],
      'Hayvan': ['Tilki', 'Tavşan', 'Tavuk', 'Timsah', 'Tırtıl', 'Turna', 'Tazı', 'Teke', 'Tukan', 'Ton Balığı', 'Tarantula', 'Tavus Kuşu', 'Tazmanya Canavarı'],
      'Bitki': ['Turp', 'Tere', 'Tarçın', 'Trabzon Hurması', 'Tütün', 'Turunç', 'Taze Fasulye', 'Taze Soğan'],
      'Eşya': ['Tabak', 'Tarak', 'Telefon', 'Televizyon', 'Tencere', 'Top', 'Tava', 'Tepsi', 'Tablet', 'Terlik', 'Tişört', 'Takvim', 'Tablo', 'Tornavida', 'Tırnak Makası', 'Termos', 'Tesbih', 'Tüfek', 'Tekerlek', 'Trampet'],
      'Ülke': ['Türkiye', 'Tunus', 'Tayland', 'Türkmenistan', 'Tacikistan', 'Tanzanya', 'Tayvan', 'Togo', 'Tonga', 'Trinidad ve Tobago'],
      'Meslek': ['Terzi', 'Tamirci', 'Tasarımcı', 'Tesisatçı', 'Taksici', 'Tarihçi', 'Tercüman', 'Teknisyen', 'Tiyatrocu', 'Tüccar', 'Turizmci', 'Tenisçi']
    },
    U: {
      'İsim': ['Umut', 'Uras', 'Uğur', 'Ufuk', 'Utku', 'Ulaş', 'Ulvi', 'Ural', 'Uygur', 'Uğurcan'],
      'Şehir': ['Uşak', 'Urfa', 'Urla', 'Uluborlu', 'Ulukışla', 'Uzunköprü', 'Ulanbatur'],
      'Hayvan': ['Uğur Böceği', 'Uçan Balık', 'Uçan Sincap'],
      'Bitki': ['Unutma Beni', 'Udi Hindi', 'Uşkun'],
      'Eşya': ['Uçurtma', 'Uyku Tulumu', 'Uçak', 'Uzatma Kablosu', 'Ustura', 'Ud'],
      'Ülke': ['Ukrayna', 'Uruguay', 'Uganda', 'Umman', 'Uzakdoğu'],
      'Meslek': ['Uçak Mühendisi', 'Usta', 'Uzman', 'Uşak', 'Uluslararası İlişkiler Uzmanı']
    },
    Ü: {
      'İsim': ['Ümit', 'Ülkü', 'Ünal', 'Üzeyir', 'Ümmü', 'Ünsal', 'Üstün', 'Üveys'],
      'Şehir': ['Ürgüp', 'Ünye', 'Üsküdar', 'Üsküp'],
      'Hayvan': ['Üveyik', 'Üçgen Balık'],
      'Bitki': ['Üzüm', 'Üvez', 'Üzerlik'],
      'Eşya': ['Ütü', 'Ütü Masası', 'Üçgen Cetvel'],
      'Ülke': ['Ürdün'],
      'Meslek': ['Ürolog', 'Ütücü', 'Üretici']
    },
    V: {
      'İsim': ['Volkan', 'Veli', 'Vildan', 'Vural', 'Vahap', 'Vahit', 'Vedat', 'Vehbi', 'Veysel', 'Vuslat'],
      'Şehir': ['Van', 'Vize', 'Vezirköprü', 'Viranşehir', 'Viyana', 'Venedik', 'Varşova', 'Valensiya'],
      'Hayvan': ['Vaşak', 'Vatoz', 'Vampir Yarasa', 'Vizon', 'Vombat'],
      'Bitki': ['Vişne', 'Vanilya', 'Vişne Ağacı'],
      'Eşya': ['Vazo', 'Valiz', 'Vida', 'Vantilatör', 'Vapur', 'Vites', 'Vişne Sıkacağı', 'Viyola', 'Vişne Kabı'],
      'Ülke': ['Venezuela', 'Vietnam', 'Vatikan', 'Vanuatu'],
      'Meslek': ['Veteriner', 'Vali', 'Veznedar', 'Voleybolcu', 'Veri Bilimci', 'Vinç Operatörü']
    },
    Y: {
      'İsim': ['Yusuf', 'Yağmur', 'Yiğit', 'Yaren', 'Yunus', 'Yasemin', 'Yağız', 'Yalçın', 'Yaman', 'Yasin', 'Yavuz', 'Yeliz', 'Yelda', 'Yeşim', 'Yeter', 'Yıldız', 'Yıldırım', 'Yılmaz', 'Yonca', 'Yüksel', 'Yücel'],
      'Şehir': ['Yalova', 'Yozgat', 'Yatağan', 'Yerköy', 'Yenişehir', 'Yalvaç', 'Yüksekova', 'Yumurtalık'],
      'Hayvan': ['Yunus', 'Yılan', 'Yengeç', 'Yarasa', 'Yusufçuk', 'Yaban Domuzu', 'Yaban Kedisi', 'Yayın Balığı', 'Yılan Balığı'],
      'Bitki': ['Yulaf', 'Yonca', 'Yasemin', 'Yer Fıstığı', 'Yaban Mersini', 'Yer Elması', 'Yosun', 'Yıldız Çiçeği'],
      'Eşya': ['Yastık', 'Yorgan', 'Yüzük', 'Yatak', 'Yelek', 'Yelpaze', 'Yelken', 'Yapıştırıcı', 'Yazıcı', 'Yumurta Çırpıcı', 'Yük Arabası'],
      'Ülke': ['Yunanistan', 'Yemen', 'Yeni Zelanda'],
      'Meslek': ['Yazar', 'Yönetmen', 'Yazılımcı', 'Yargıç', 'Yüzücü', 'Yorgancı', 'Yayıncı', 'Yönetici']
    },
    Z: {
      'İsim': ['Zeynep', 'Zehra', 'Zafer', 'Zeki', 'Zümra', 'Zeliha', 'Zerrin', 'Zeynel', 'Ziya', 'Zuhal', 'Zülal', 'Züleyha', 'Zümrüt'],
      'Şehir': ['Zonguldak', 'Zile', 'Zara', 'Zeytinburnu', 'Zürih', 'Zagreb'],
      'Hayvan': ['Zürafa', 'Zebra', 'Zargana', 'Zehirli Ok Kurbağası'],
      'Bitki': ['Zeytin', 'Zambak', 'Zencefil', 'Zerdeçal', 'Zakkum', 'Zerdali', 'Zeytin Ağacı'],
      'Eşya': ['Zil', 'Zarf', 'Zımba', 'Zincir', 'Zımpara', 'Zar', 'Zeytinyağı Şişesi'],
      'Ülke': ['Zambiya', 'Zimbabve'],
      'Meslek': ['Ziraat Mühendisi', 'Zabıta', 'Zanaatkar', 'Zoolog']
    }
  };

  // Hızlı O(1) sözlük kontrolü için normalize edilmiş Set indeksi oluştur
  const DICT_INDEX = {};
  Object.entries(WORD_BANK).forEach(([letter, cats]) => {
    DICT_INDEX[letter] = {};
    Object.entries(cats).forEach(([cat, words]) => {
      DICT_INDEX[letter][cat] = new Set(words.map(normalizeTr));
    });
  });

  // Katman 1: Anlamsız kelime / uydurma metin filtresi
  const TR_ONLY_LETTERS_RE = /^[A-ZÇĞİÖŞÜ\s-]+$/;
  const TR_VOWEL_RE = /[AEIİOÖUÜ]/;
  const TR_REPEAT_3_RE = /(.)\1\1/;
  const TR_CONSONANT_4_RE = /[BCÇDFGĞHJKLMNPRSŞTVYZ]{4,}/;

  function isGibberishTr(word) {
    const norm = normalizeTr(word);
    if (norm.length < 2) return true;
    if (!TR_ONLY_LETTERS_RE.test(norm)) return true;
    if (!TR_VOWEL_RE.test(norm)) return true; // Sesli harf yoksa uydurma (örn. Mzzzz, Krtlp)
    if (TR_REPEAT_3_RE.test(norm)) return true; // 3 aynı harf yan yana (örn. Maaaa)
    if (TR_CONSONANT_4_RE.test(norm.replace(/\s+/g, ''))) return true; // 4+ sessiz harf yan yana
    return false;
  }

  function startsWithLetterTr(word, letter) {
    const w = normalizeTr(word);
    const l = normalizeTr(letter);
    return w.length >= 2 && w.startsWith(l);
  }

  /**
   * 3 Katmanlı Kelime Doğrulama Sonucu:
   * - 'empty'      : Boş bırakılmış
   * - 'wrong_letter': Yanlış harfle başlıyor
   * - 'gibberish'  : Anlamsız / geçersiz karakter veya Türkçe yapıya aykırı
   * - 'verified'   : Kategori sözlüğünde kesin olarak doğrulandı!
   * - 'unknown'    : Türkçe yapıya uygun ama sözlükte yok (tur sonunda "Kabul Et" ile onaylanabilir)
   */
  function validateWordTr(word, letter, category) {
    const raw = (word || '').trim();
    if (!raw) return { status: 'empty', valid: false, message: `${letter} harfi ile başlamalı` };

    const norm = normalizeTr(raw);
    const targetLetter = normalizeTr(letter);
    if (!norm.startsWith(targetLetter)) {
      return { status: 'wrong_letter', valid: false, message: `Dikkat! "${letter}" ile başlamalı` };
    }
    if (isGibberishTr(norm)) {
      return { status: 'gibberish', valid: false, message: 'Anlamsız kelime yazma!' };
    }

    const catSet = DICT_INDEX[targetLetter]?.[category];
    if (catSet && catSet.has(norm)) {
      return { status: 'verified', valid: true, message: 'Sözlükte doğrulandı ✓' };
    }

    // Kategori sözlüğünde yoksa otomatik puan VERME, ama tur sonunda itiraz/onay imkanı sun
    return { status: 'unknown', valid: false, message: 'Sözlükte yok (tur sonu onaylanabilir)' };
  }

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
  ISH.validateWordTr = validateWordTr;
  ISH.getRandomWordForBot = getRandomWordForBot;
  ISH.getHintForCategory = getHintForCategory;
})(window);
