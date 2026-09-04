/* ────────────────────────────────────────────────────────────
   Заявление о выдаче студенческого билета на бумажном носителе
   Всё считается в браузере: ничего никуда не отправляется.
   ──────────────────────────────────────────────────────────── */

function toggleQa(btn) {
    const item = btn.closest('.qa-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.qa-item.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
}

/* ── Склонение ФИО в родительный падеж ───────────────────────
   Нужно для шапки: «обучающегося Иванова Ивана Ивановича».
   Правила покрывают подавляющее большинство русских ФИО;
   редкие фамилии пользователь правит руками в .docx.
   ──────────────────────────────────────────────────────────── */

const HUSH = 'гкхжчшщ';
const HUSH_SOFT = 'жчшщц';

// мужские имена на -а/-я
const MALE_A = ['никита', 'илья', 'данила', 'данило', 'кузьма', 'фома', 'савва', 'лука',
    'гаврила', 'добрыня', 'сила', 'вавила', 'ерема', 'фока', 'аника'];
// женские имена на -ь
const FEM_SOFT = ['любовь', 'нинель', 'рахиль', 'эсфирь', 'юдифь', 'адель', 'суламифь'];
// имена с беглой гласной
const IRREGULAR = { 'пётр': 'Петра', 'петр': 'Петра', 'павел': 'Павла', 'лев': 'Льва' };

function cut(s, n) {
    return s.slice(0, s.length - n);
}

function endsAny(word, list) {
    return list.some(x => word.endsWith(x));
}

// -а → -ы / -и (после шипящих и г, к, х)
function aToGen(word) {
    const prev = word[word.length - 2] || '';
    return cut(word, 1) + (HUSH.includes(prev.toLowerCase()) ? 'и' : 'ы');
}

function detectGender(first, middle) {
    const m = (middle || '').toLowerCase();
    if (/(вна|чна)$/.test(m)) return 'f';
    if (/(вич|ич)$/.test(m)) return 'm';

    const f = (first || '').toLowerCase();
    if (MALE_A.includes(f)) return 'm';
    if (FEM_SOFT.includes(f)) return 'f';
    if (/[ая]$/.test(f)) return 'f';
    return 'm';
}

function genFirst(name, gender) {
    const l = name.toLowerCase();
    if (IRREGULAR[l]) return IRREGULAR[l];

    if (gender === 'f') {
        if (l.endsWith('ия')) return cut(name, 2) + 'ии';
        if (/[ья]я$/.test(l)) return cut(name, 1) + 'и';
        if (l.endsWith('я')) return cut(name, 1) + 'и';
        if (l.endsWith('а')) return aToGen(name);
        if (l.endsWith('ь')) return cut(name, 1) + 'и';
        return name;
    }

    if (l.endsWith('ий')) return cut(name, 2) + 'ия';
    if (l.endsWith('й')) return cut(name, 1) + 'я';
    if (l.endsWith('ь')) return cut(name, 1) + 'я';
    if (l.endsWith('ья')) return cut(name, 1) + 'и';
    if (l.endsWith('я')) return cut(name, 1) + 'и';
    if (l.endsWith('а')) return aToGen(name);
    if (/[оеуыэюё]$/.test(l)) return name;
    return name + 'а';
}

function genMiddle(mid, gender) {
    const l = mid.toLowerCase();
    if (gender === 'f') {
        if (l.endsWith('на')) return cut(mid, 1) + 'ы';
        return mid;
    }
    if (endsAny(l, ['оглы', 'улы', 'кызы'])) return mid;
    if (l.endsWith('ич')) return mid + 'а';
    return mid;
}

function genLast(last, gender) {
    const l = last.toLowerCase();

    // несклоняемые
    if (/(ко|их|ых|ово|аго|яго)$/.test(l)) return last;
    if (/[оуэюи]$/.test(l)) return last;

    if (gender === 'f') {
        if (l.endsWith('ая')) return cut(last, 2) + 'ой';
        if (/(ова|ева|ёва|ина|ына)$/.test(l)) return cut(last, 1) + 'ой';
        if (l.endsWith('ия')) return cut(last, 2) + 'ии';
        if (l.endsWith('я')) return cut(last, 1) + 'и';
        if (l.endsWith('а')) return aToGen(last);
        return last; // на согласный женские фамилии не склоняются
    }

    // прилагательные: Толстой, Белый, Достоевский, Рыжий
    if (/(ой|ый|ий)$/.test(l)) {
        const prev = l[l.length - 3] || '';
        return cut(last, 2) + (HUSH_SOFT.includes(prev) && !l.endsWith('ой') ? 'его' : 'ого');
    }
    if (/(ов|ев|ёв|ин|ын)$/.test(l)) return last + 'а';
    if (l.endsWith('й')) return cut(last, 1) + 'я';
    if (l.endsWith('ь')) return cut(last, 1) + 'я';
    if (l.endsWith('ия')) return cut(last, 2) + 'ии';
    if (l.endsWith('я')) return cut(last, 1) + 'и';
    if (l.endsWith('а')) return aToGen(last);
    if (/[еы]$/.test(l)) return last;
    return last + 'а';
}

// «Иванов Иван Иванович» → «Иванова Ивана Ивановича»
function fioGenitive(fio) {
    const parts = fio.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    const [last, first, middle] = parts;
    const gender = detectGender(first, middle);
    const out = [genLast(last, gender)];
    if (first) out.push(genFirst(first, gender));
    if (middle) out.push(genMiddle(middle, gender));
    return out.join(' ');
}

// «Иванов Иван Иванович» → «И.И. Иванов»
function fioInitials(fio) {
    const parts = fio.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    const [last, first, middle] = parts;
    const ini = [first, middle].filter(Boolean).map(w => w[0].toUpperCase() + '.').join('');
    // \u00a0 — неразрывный пробел: инициалы не отрываются от фамилии
    return ini ? ini + '\u00a0' + last : last;
}

/* ── Модель документа ───────────────────────────────────────── */

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

const DOC_NAMES = {
    bilet: { acc: 'студенческий билет', gen: 'студенческого билета', ready: 'документа', of: 'его', file: 'студенческий билет' },
    zachetka: { acc: 'зачётную книжку', gen: 'зачётной книжки', ready: 'документа', of: 'его', file: 'зачётная книжка' },
    both: { acc: 'студенческий билет и зачётную книжку', gen: 'студенческого билета и зачётной книжки', ready: 'документов', of: 'их', file: 'студенческий билет и зачётка' }
};

const LAW_REF = 'частью 6 статьи 33 Федерального закона от 29.12.2012 № 273-ФЗ ' +
    '«Об образовании в Российской Федерации» (в редакции Федерального закона от 29.12.2025 № 539-ФЗ)';

function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function radio(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
}

function formatDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '«__» __________ ____ г.';
    return `«${m[3]}» ${MONTHS[Number(m[2]) - 1]} ${m[1]} г.`;
}

function buildModel() {
    const fio = val('f-fio');
    const fioGen = fioGenitive(fio);
    const faculty = val('f-faculty');
    const course = val('f-course');
    const group = val('f-group');
    const basis = radio('basis');
    const address = val('f-address');
    const phone = val('f-phone');
    const email = val('f-email');
    const docs = DOC_NAMES[radio('docs')] || DOC_NAMES.bilet;

    const items = [];
    const dash = n => '_'.repeat(n);

    // ── Шапка (оставлена как в исходном бланке) ──
    items.push({ s: 'head', t: 'Ректору НГУ Д.В. Пышный' });

    if (fioGen) {
        items.push({ s: 'head', t: 'обучающегося ' + fioGen });
    } else {
        items.push({ s: 'head', t: 'обучающегося ' + dash(29) });
        items.push({ s: 'head', t: dash(42) });
    }
    items.push({ s: 'cap', t: '(ФИО)' });

    items.push({ s: 'head', t: faculty || dash(42) });
    items.push({ s: 'cap', t: '(название факультета)' });

    items.push({
        s: 'head',
        t: `${course || dash(6)} курса (года обучения), ${group || dash(9)} группы,`
    });

    if (basis === 'budget') {
        items.push({ s: 'head', t: 'бюджетная основа обучения' });
    } else if (basis === 'paid') {
        items.push({ s: 'head', t: 'платная основа обучения' });
    } else {
        items.push({ s: 'head', t: 'бюджетная/платная основа обучения' });
        items.push({ s: 'cap', t: '(нужное подчеркнуть)' });
    }

    if (address) {
        items.push({ s: 'head', t: 'Место жительства: ' + address.replace(/\s*\n\s*/g, ', ') });
    } else {
        items.push({ s: 'head', t: 'Место жительства: ' + dash(25) });
        items.push({ s: 'head', t: dash(42) });
        items.push({ s: 'head', t: dash(42) });
    }
    items.push({ s: 'cap', t: '(адрес регистрации по месту жительства и (или) регистрации по месту пребывания)' });

    const contacts = [phone, email].filter(Boolean).join(', ');
    items.push({ s: 'head', t: contacts || dash(42) });
    items.push({ s: 'cap', t: '(контактный телефон, адрес электронной почты)' });

    // ── Тело заявления ──
    items.push({ s: 'blank' });
    items.push({ s: 'blank' });
    items.push({ s: 'title', t: 'ЗАЯВЛЕНИЕ' });
    items.push({ s: 'title', t: `о выдаче ${docs.gen} на бумажном носителе` });
    items.push({ s: 'blank' });

    items.push({
        s: 'body',
        t: `Прошу выдать мне ${docs.acc} на бумажном носителе в соответствии с ${LAW_REF}, ` +
            `которой предусмотрена выдача таких документов на бумажном носителе по заявлению обучающегося ` +
            `в порядке, установленном локальными нормативными актами образовательной организации.`
    });
    items.push({
        s: 'body',
        t: `Прошу сообщить о готовности ${docs.ready} и порядке ${docs.of} получения ` +
            `по указанным выше контактным данным.`
    });

    items.push({ s: 'blank' });
    items.push({ s: 'blank' });
    items.push({
        s: 'sign',
        l: formatDate(val('f-date')),
        r: dash(21) + ' / ' + (fioInitials(fio) || dash(21))
    });
    items.push({ s: 'signcap', t: 'подпись / расшифровка подписи' });

    return { items, docs, fio };
}

/* ── Предпросмотр ───────────────────────────────────────────── */

function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function renderPreview(model) {
    const html = model.items.map(it => {
        switch (it.s) {
            case 'blank': return '<p class="dp-blank">&nbsp;</p>';
            case 'sign':
                return `<p class="dp-sign"><span>${esc(it.l)}</span>` +
                    `<span class="dp-sign-right">${esc(it.r)}</span></p>`;
            case 'signcap': return `<p class="dp-signcap">${esc(it.t)}</p>`;
            default: return `<p class="dp-${it.s}">${esc(it.t)}</p>`;
        }
    }).join('');
    document.getElementById('doc-sheet').innerHTML = html;
    fitSheet();
}

// Лист всегда 210 мм в ширину — на узком экране ужимаем его трансформом.
function fitSheet() {
    const scroll = document.querySelector('.doc-scroll');
    const stage = document.getElementById('doc-stage');
    const sheet = document.getElementById('doc-sheet');
    if (!scroll || !sheet || !sheet.innerHTML) return;

    sheet.style.transform = 'none';
    const avail = scroll.clientWidth - 2 * parseFloat(getComputedStyle(scroll).paddingLeft);
    const w = sheet.offsetWidth;
    const k = Math.min(1, avail / w);

    sheet.style.transform = `scale(${k})`;
    sheet.style.left = Math.max(0, (avail - w * k) / 2) + 'px';
    stage.style.height = sheet.offsetHeight * k + 'px';
}

function docPlainText(model) {
    return model.items.map(it => {
        if (it.s === 'blank') return '';
        if (it.s === 'sign') return it.l + '\t' + it.r;
        return it.t;
    }).join('\n');
}

/* ── Сборка .docx (OOXML + zip без внешних библиотек) ────────── */

const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
    }
    return t;
})();

function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
}

// ZIP без сжатия (метод "store") — этого достаточно для .docx
function zipStore(files) {
    const enc = new TextEncoder();
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

    const parts = [];
    const central = [];
    let offset = 0;

    for (const f of files) {
        const name = enc.encode(f.name);
        const data = enc.encode(f.content);
        const crc = crc32(data);

        const local = new Uint8Array(30 + name.length);
        const lv = new DataView(local.buffer);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true);
        lv.setUint16(6, 0x0800, true); // имена в UTF-8
        lv.setUint16(8, 0, true);      // store
        lv.setUint16(10, dosTime, true);
        lv.setUint16(12, dosDate, true);
        lv.setUint32(14, crc, true);
        lv.setUint32(18, data.length, true);
        lv.setUint32(22, data.length, true);
        lv.setUint16(26, name.length, true);
        local.set(name, 30);

        const cd = new Uint8Array(46 + name.length);
        const cv = new DataView(cd.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, 0x0800, true);
        cv.setUint16(10, 0, true);
        cv.setUint16(12, dosTime, true);
        cv.setUint16(14, dosDate, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, data.length, true);
        cv.setUint32(24, data.length, true);
        cv.setUint16(28, name.length, true);
        cv.setUint32(42, offset, true);
        cd.set(name, 46);

        parts.push(local, data);
        central.push(cd);
        offset += local.length + data.length;
    }

    const cdSize = central.reduce((n, c) => n + c.length, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);

    return new Blob([...parts, ...central, end],
        { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

function xml(s) {
    return String(s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

function run(text, sz) {
    return `<w:r><w:rPr><w:rFonts w:ascii="Helvetica" w:hAnsi="Helvetica" w:cs="Helvetica"/>` +
        `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/><w:lang w:val="ru-RU"/></w:rPr>` +
        `<w:t xml:space="preserve">${xml(text)}</w:t></w:r>`;
}

// Отступ шапки 4535 твипов = 8 см; правый край текста 9639 твипов = 17 см
const IND_HEAD = '<w:ind w:left="4535" w:firstLine="0"/>';
const TAB_RIGHT = '<w:tabs><w:tab w:val="right" w:pos="9639"/></w:tabs>';

function para(item) {
    switch (item.s) {
        case 'head':
            return `<w:p><w:pPr>${IND_HEAD}<w:jc w:val="both"/></w:pPr>${run(item.t, 22)}</w:p>`;
        case 'cap':
            return `<w:p><w:pPr>${IND_HEAD}<w:jc w:val="center"/></w:pPr>${run(item.t, 16)}</w:p>`;
        case 'title':
            return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${run(item.t, 22)}</w:p>`;
        case 'body':
            return `<w:p><w:pPr><w:ind w:firstLine="567"/><w:jc w:val="both"/></w:pPr>${run(item.t, 22)}</w:p>`;
        case 'sign':
            return `<w:p><w:pPr>${TAB_RIGHT}</w:pPr>${run(item.l, 22)}` +
                `<w:r><w:tab/></w:r>${run(item.r, 22)}</w:p>`;
        case 'signcap':
            return `<w:p><w:pPr><w:jc w:val="right"/></w:pPr>${run(item.t, 16)}</w:p>`;
        default:
            return '<w:p/>';
    }
}

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS_W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

function buildDocx(model) {
    const body = model.items.map(para).join('');

    const document_xml = XML_HEAD +
        `<w:document ${NS_W}><w:body>${body}` +
        `<w:sectPr><w:pgSz w:w="11906" w:h="16838" w:orient="portrait"/>` +
        `<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" ` +
        `w:header="709" w:footer="850" w:gutter="0"/></w:sectPr></w:body></w:document>`;

    const styles_xml = XML_HEAD +
        `<w:styles ${NS_W}><w:docDefaults><w:rPrDefault><w:rPr>` +
        `<w:rFonts w:ascii="Helvetica" w:hAnsi="Helvetica" w:cs="Helvetica" w:eastAsia="Helvetica"/>` +
        `<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="ru-RU"/></w:rPr></w:rPrDefault>` +
        `<w:pPrDefault><w:pPr><w:suppressAutoHyphens w:val="1"/>` +
        `<w:spacing w:before="0" w:after="0" w:line="360" w:lineRule="auto"/>` +
        `</w:pPr></w:pPrDefault></w:docDefaults>` +
        `<w:style w:type="paragraph" w:default="1" w:styleId="Normal">` +
        `<w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;

    const content_types = XML_HEAD +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
        `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
        `</Types>`;

    const rels = XML_HEAD +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
        `</Relationships>`;

    const doc_rels = XML_HEAD +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`;

    return zipStore([
        { name: '[Content_Types].xml', content: content_types },
        { name: '_rels/.rels', content: rels },
        { name: 'word/_rels/document.xml.rels', content: doc_rels },
        { name: 'word/document.xml', content: document_xml },
        { name: 'word/styles.xml', content: styles_xml }
    ]);
}

/* ── Действия ───────────────────────────────────────────────── */

let currentModel = null;

function generateDoc() {
    const hint = document.getElementById('fio-hint');
    if (!val('f-fio')) {
        hint.textContent = 'Без ФИО заявление не примут — заполните это поле.';
        hint.classList.add('error');
        document.getElementById('f-fio').focus();
        return;
    }

    currentModel = buildModel();
    renderPreview(currentModel);

    const out = document.getElementById('doc-output');
    out.classList.add('visible');
    fitSheet();
    setTimeout(() => out.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

function fileName(ext) {
    const surname = val('f-fio').split(/\s+/)[0] || 'заявление';
    const initials = fioInitials(val('f-fio')).replace(/\u00a0.*/, '');
    return `Заявление — бумажный студбилет — ${surname} ${initials}`.trim().replace(/\s+—\s*$/, '') + ext;
}

function downloadDocx() {
    if (!currentModel) return;
    const blob = buildDocx(currentModel);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName('.docx');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function printDoc() {
    if (!currentModel) return;
    window.print();
}

function copyDoc() {
    if (!currentModel) return;
    navigator.clipboard.writeText(docPlainText(currentModel)).then(() => {
        const fb = document.getElementById('copy-feedback');
        fb.classList.add('show');
        setTimeout(() => fb.classList.remove('show'), 2200);
    });
}

/* ── Инициализация ──────────────────────────────────────────── */

function updateFioHint() {
    const hint = document.getElementById('fio-hint');
    const gen = fioGenitive(val('f-fio'));
    hint.classList.remove('error');
    hint.textContent = gen ? 'В шапке будет: обучающегося ' + gen : '';
}

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const iso = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');
    document.getElementById('f-date').value = iso;

    document.getElementById('f-fio').addEventListener('input', updateFioHint);

    // после первой генерации предпросмотр обновляется на лету
    document.querySelectorAll('.builder-grid input, .builder-grid textarea').forEach(el => {
        el.addEventListener('input', () => {
            if (currentModel) {
                currentModel = buildModel();
                renderPreview(currentModel);
            }
        });
        el.addEventListener('change', () => {
            if (currentModel) {
                currentModel = buildModel();
                renderPreview(currentModel);
            }
        });
    });

    window.addEventListener('resize', fitSheet);
});
