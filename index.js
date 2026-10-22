/* ========================= STATE ========================= */
let books = [
  { id:1, no:'BK-001', title:'The Culture Map', condition:'Good Condition', added:'2026-08-30' },
  { id:2, no:'BK-002', title:'Everyday Corruption', condition:'Good Condition', added:'2026-08-30' },
  { id:3, no:'BK-003', title:'Secret War', condition:'Bad Condition', added:'2026-08-30' },
];

let borrowings = [
  { id:1, bookId:3, borrower:'Ana Roy', phone:'08012345678', issued:'2026-08-30', expected:'2026-09-06', actual:null, status:'Not Returned', condition:'-', fine:0 },
];

let nextBookId = 4;
let nextBorrowId = 2;
let bookCounter = 4; // for HB-00x numbering

let owner = {
  name:'JULIUS METTO',
  lib:'My Personal Library',
  bio:'A small collection of fiction and nonfiction I love.'
};

let recommended = { title:'Secret War', desc:'Historical account' };

/* ========================= HELPERS ========================= */
function fmtDate(iso){
  if(!iso) return '-';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function todayISO(){
  return new Date().toISOString().slice(0,10);
}
function isBookAvailable(bookId){
  return !borrowings.some(b => b.bookId === bookId && b.status === 'Not Returned');
}
function conditionBadgeClass(cond){
  if(cond.startsWith('Good')) return 'good';
  if(cond.startsWith('Bad')) return 'bad';
  if(cond.startsWith('Fair')) return 'fair';
  return 'good';
}
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}
function initials(name){
  return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
}

/* ========================= NAV ========================= */
function switchView(view, btn){
  document.querySelectorAll('.nav button[data-view]').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  const titles = {dashboard:'Dashboard', books:'Books', borrowings:'Borrowings'};
  document.getElementById('page-title').textContent = titles[view];
  closeSidebar();
  renderAll();
}
function openSidebar(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('active');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}

/* ========================= MODALS ========================= */
function openModal(id){ document.getElementById(id).classList.add('active'); }
function closeModal(id){ document.getElementById(id).classList.remove('active'); }

function openBookModal(){
  document.getElementById('nb-title').value = '';
  document.getElementById('nb-condition').value = 'Good Condition';
  openModal('book-modal');
}

function openBorrowModal(){
  const sel = document.getElementById('bw-book');
  const available = books.filter(b => isBookAvailable(b.id));
  if(available.length === 0){
    showToast('No books available to borrow right now');
    return;
  }
  sel.innerHTML = available.map(b => `<option value="${b.id}">${b.title} (${b.no})</option>`).join('');
  document.getElementById('bw-name').value = '';
  document.getElementById('bw-phone').value = '';
  const d = new Date();
  d.setDate(d.getDate()+7);
  document.getElementById('bw-expected').value = d.toISOString().slice(0,10);
  openModal('borrow-modal');
}

let returningId = null;
function openReturnModal(id){
  returningId = id;
  document.getElementById('rt-condition').value = 'Good Condition';
  document.getElementById('rt-fine').value = 0;
  openModal('return-modal');
}

function openOwnerModal(){
  document.getElementById('ow-name').value = owner.name;
  document.getElementById('ow-lib').value = owner.lib;
  document.getElementById('ow-bio').value = owner.bio;
  openModal('owner-modal');
}

/* ========================= ACTIONS ========================= */
function addBook(){
  const title = document.getElementById('nb-title').value.trim();
  const condition = document.getElementById('nb-condition').value;
  if(!title){ showToast('Please enter a book title'); return; }
  const no = 'HB-' + String(bookCounter).padStart(3,'0');
  bookCounter++;
  books.push({ id: nextBookId++, no, title, condition, added: todayISO() });
  closeModal('book-modal');
  renderAll();
  showToast(`"${title}" added to your library`);
}

function deleteBook(id){
  if(!isBookAvailable(id)){
    showToast("Can't delete a book that's currently borrowed");
    return;
  }
  const book = books.find(b=>b.id===id);
  books = books.filter(b => b.id !== id);
  renderAll();
  showToast(`"${book ? book.title : 'Book'}" deleted`);
}

function addBorrowing(){
  const name = document.getElementById('bw-name').value.trim();
  const phone = document.getElementById('bw-phone').value.trim();
  const bookId = parseInt(document.getElementById('bw-book').value);
  const expected = document.getElementById('bw-expected').value;
  if(!name || !phone || phone.length < 10 || !bookId || !expected){
    showToast('Phone number must be at least 10 characters');
    return;
  }
  borrowings.push({
    id: nextBorrowId++, bookId, borrower:name, phone,
    issued: todayISO(), expected, actual:null, status:'Not Returned', condition:'-', fine:0
  });
  closeModal('borrow-modal');
  renderAll();
  showToast(`Book issued to ${name}`);
}

function confirmReturn(){
  const b = borrowings.find(x => x.id === returningId);
  if(!b) return;
  b.status = 'Returned';
  b.actual = todayISO();
  b.condition = document.getElementById('rt-condition').value;
  b.fine = parseFloat(document.getElementById('rt-fine').value) || 0;
  const book = books.find(bk => bk.id === b.bookId);
  if(book) book.condition = b.condition;
  closeModal('return-modal');
  renderAll();
  showToast(`Marked "${book ? book.title : 'book'}" as returned`);
}

function saveOwner(){
  owner.name = document.getElementById('ow-name').value.trim() || owner.name;
  owner.lib = document.getElementById('ow-lib').value.trim() || owner.lib;
  owner.bio = document.getElementById('ow-bio').value.trim() || owner.bio;
  closeModal('owner-modal');
  renderAll();
  showToast('Library owner details updated');
}

function onGlobalSearch(val){
  document.getElementById('book-search').value = val;
  document.getElementById('book-search-2').value = val;
  if(val){
    switchView('books', document.querySelector('.nav button[data-view="books"]'));
  } else {
    renderBooks();
  }
}

/* ========================= RENDER ========================= */
function renderStats(){
  const total = books.length;
  const borrowedCount = books.filter(b => !isBookAvailable(b.id)).length;
  const availableCount = total - borrowedCount;
  const returnedCount = borrowings.filter(b => b.status === 'Returned').length;
  const notReturnedCount = borrowings.filter(b => b.status === 'Not Returned').length;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-borrowed').textContent = borrowedCount;
  document.getElementById('stat-available').textContent = availableCount;
  document.getElementById('stat-returned').textContent = returnedCount;
  document.getElementById('stat-notreturned').textContent = notReturnedCount;
}

function renderPanels(){
  const recent = [...books].sort((a,b)=> b.id - a.id).slice(0,3);
  const ra = document.getElementById('recently-added-list');
  ra.innerHTML = recent.length
    ? recent.map(b => `<li>${b.title} <span class="tag">(${b.no})</span></li>`).join('')
    : '<li class="empty">No books yet</li>';

  const recentBorrows = [...borrowings].sort((a,b)=> b.id - a.id).slice(0,3);
  const rb = document.getElementById('recently-borrowed-list');
  rb.innerHTML = recentBorrows.length
    ? recentBorrows.map(b => {
        const book = books.find(bk => bk.id === b.bookId);
        return `<li>${b.borrower} — ${book ? book.title : 'Unknown'}</li>`;
      }).join('')
    : '<li class="empty">No borrowings yet</li>';

  document.getElementById('owner-name').textContent = owner.name;
  document.getElementById('owner-name-display').textContent = owner.name;
  document.getElementById('owner-lib').textContent = owner.lib;
  document.getElementById('owner-bio').textContent = owner.bio;
  document.getElementById('owner-initials').textContent = initials(owner.name);
  document.getElementById('owner-avatar-box').textContent = initials(owner.name);

  document.getElementById('rec-title').textContent = recommended.title;
  document.getElementById('rec-desc').textContent = recommended.desc;
}

function bookRowHTML(b){
  const available = isBookAvailable(b.id);
  return `
    <tr>
      <td>${b.no}</td>
      <td>${b.title}</td>
      <td><span class="badge ${conditionBadgeClass(b.condition)}">${b.condition}</span></td>
      <td><span class="badge ${available ? 'avail' : 'borrowed'}">${available ? 'Available' : 'Borrowed'}</span></td>
      <td>${fmtDate(b.added)}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteBook(${b.id})">Delete</button></td>
    </tr>`;
}

function renderBooks(){
  const sortEl = document.getElementById('page-title').textContent === 'Books'
    ? document.getElementById('sort-select-2') : document.getElementById('sort-select');
  const searchEl = document.getElementById('page-title').textContent === 'Books'
    ? document.getElementById('book-search-2') : document.getElementById('book-search');

  // keep both pairs of controls in sync
  const sortVal = sortEl.value;
  const searchVal = searchEl.value.toLowerCase();
  document.getElementById('sort-select').value = sortVal;
  document.getElementById('sort-select-2').value = sortVal;
  document.getElementById('book-search').value = searchEl.value;
  document.getElementById('book-search-2').value = searchEl.value;

  let list = books.filter(b => b.title.toLowerCase().includes(searchVal) || b.no.toLowerCase().includes(searchVal));

  if(sortVal === 'az') list.sort((a,b)=> a.title.localeCompare(b.title));
  else if(sortVal === 'za') list.sort((a,b)=> b.title.localeCompare(a.title));
  else if(sortVal === 'newest') list.sort((a,b)=> b.id - a.id);
  else if(sortVal === 'oldest') list.sort((a,b)=> a.id - b.id);

  const html = list.length
    ? list.map(bookRowHTML).join('')
    : `<tr class="empty-row"><td colspan="6">No books match your search</td></tr>`;

  document.getElementById('books-tbody').innerHTML = html;
  document.getElementById('books-tbody-2').innerHTML = html;
}

function borrowRowHTML(b){
  const book = books.find(bk => bk.id === b.bookId);
  const statusClass = b.status === 'Returned' ? 'returned' : 'notreturned';
  return `
    <tr>
      <td>${b.borrower}</td>
      <td>${b.phone}</td>
      <td>${book ? book.title : 'Unknown'}</td>
      <td>${book ? book.no : '-'}</td>
      <td>${fmtDate(b.issued)}</td>
      <td>${fmtDate(b.expected)}</td>
      <td>${b.actual ? fmtDate(b.actual) : '-'}</td>
      <td><span class="badge ${statusClass}">${b.status}</span></td>
      <td>${b.condition === '-' ? '-' : `<span class="badge ${conditionBadgeClass(b.condition)}">${b.condition}</span>`}</td>
      <td>${b.fine}</td>
      <td>${b.status === 'Not Returned' ? `<button class="btn btn-orange btn-sm" onclick="openReturnModal(${b.id})">Return</button>` : '<span style="color:var(--ink-soft);font-size:12.5px;">—</span>'}</td>
    </tr>`;
}

function renderBorrowings(){
  const searchEl = document.getElementById('page-title').textContent === 'Borrowings'
    ? document.getElementById('borrow-search-2') : document.getElementById('borrow-search');
  const val = searchEl.value.toLowerCase();
  document.getElementById('borrow-search').value = searchEl.value;
  document.getElementById('borrow-search-2').value = searchEl.value;

  let list = borrowings.filter(b => {
    const book = books.find(bk => bk.id === b.bookId);
    return b.borrower.toLowerCase().includes(val)
      || b.phone.toLowerCase().includes(val)
      || (book && book.title.toLowerCase().includes(val));
  });
  list = [...list].sort((a,b)=> b.id - a.id);

  const html = list.length
    ? list.map(borrowRowHTML).join('')
    : `<tr class="empty-row"><td colspan="11">No borrowings match your search</td></tr>`;

  document.getElementById('borrowings-tbody').innerHTML = html;
  document.getElementById('borrowings-tbody-2').innerHTML = html;
}

function renderAll(){
  renderStats();
  renderPanels();
  renderBooks();
  renderBorrowings();
}

renderAll();