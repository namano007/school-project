const LIBRARY_STORAGE_KEY = 'my-library-dashboard-state';
const ADMIN_NOTIFICATIONS_KEY = 'myLibraryAdminNotifications';
const ADMIN_SENT_NOTIFICATIONS_KEY = 'myLibraryAdminSentNotifications';

const defaultLibraryState = {
  currentView: 'dashboard',
  owner: {
    name: 'JULIUS METTO',
    username: 'juliusmetto',
    library: 'My Personal Library',
    bio: 'A small collection of fiction and nonfiction I love.',
    initials: 'JM',
    profileImage: '',
    heroCover: ''
  },
  books: [
    {
      id: 'HB-002',
      title: 'Everyday Corruption',
      condition: 'Good Condition',
      dateAdded: '2026/08/30',
      available: true,
      cover: 'cover'
    },
    {
      id: 'HB-003',
      title: 'Secret War',
      condition: 'Bad Condition',
      dateAdded: '2026/08/30',
      available: false,
      cover: 'cover'
    },
    {
      id: 'HB-001',
      title: 'The Culture Map',
      condition: 'Good Condition',
      dateAdded: '2026/08/30',
      available: true,
      cover: 'cover'
    }
  ],
  borrowings: [
    {
      id: cryptoRandomId(),
      borrower: 'Ana Roy',
      phone: '08012345678',
      bookId: 'HB-003',
      bookTitle: 'Secret War',
      issued: '2026/08/30',
      expected: '2026/09/06',
      actual: '-',
      status: 'Not Returned',
      condition: 'Bad Condition',
      fine: 0
    }
  ],
  selectedBorrowId: null,
  recommendedBook: 'HB-003'
};

const state = loadLibraryState();

function loadLibraryState() {
  try {
    const saved = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY) || 'null');
    if (saved && Array.isArray(saved.books) && Array.isArray(saved.borrowings)) {
      const baseState = JSON.parse(JSON.stringify(defaultLibraryState));
      return {
        ...baseState,
        ...saved,
        owner: { ...baseState.owner, ...(saved.owner || {}) },
        books: saved.books,
        borrowings: saved.borrowings
      };
    }
  } catch (error) {
    console.warn('Saved library state not found or invalid.', error);
  }

  const freshState = JSON.parse(JSON.stringify(defaultLibraryState));
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(freshState));
  return freshState;
}

function persistLibraryState() {
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(state));
}

function cryptoRandomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getBookById(id) {
  return state.books.find((book) => book.id === id);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function init() {
  setupAuthentication();
  renderOwnerInfo();
  renderBooks();
  renderBorrowings();
  renderDashboardSummary();
  renderRecentLists();
  populateBorrowSelect();
  syncBookSearchInputs();
  updateViewTitle();
  startHeroSlideshow();
}

const accountStorageKey = 'myLibraryAccount';
const sessionStorageKey = 'myLibraryAuthenticated';
let authMode = 'login';

function setupAuthentication() {
  const account = getStoredAccount();
  const isAuthenticated = sessionStorage.getItem(sessionStorageKey) === 'true' && account;
  if (isAuthenticated) {
    state.owner.name = account.name.toUpperCase();
    state.owner.username = account.username || account.email.split('@')[0];
    state.owner.initials = account.name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'JM';
  }
  document.getElementById('app')?.classList.toggle('is-authenticated', Boolean(isAuthenticated));
  document.getElementById('auth-screen')?.classList.toggle('is-hidden', Boolean(isAuthenticated));
  setAuthMode(account ? 'login' : 'create');
}

function getStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem(accountStorageKey) || 'null');
  } catch (error) {
    return null;
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const authScreen = document.getElementById('auth-screen');
  const accountExists = Boolean(getStoredAccount());
  authScreen?.classList.toggle('create-mode', mode === 'create');
  document.getElementById('login-tab')?.classList.toggle('active', mode === 'login');
  document.getElementById('create-tab')?.classList.toggle('active', mode === 'create');
  setText('auth-title', mode === 'create' ? 'Create your account' : 'Welcome back');
  setText('auth-subtitle', mode === 'create' ? 'Set up your owner credentials to access the library.' : 'Sign in to manage your books and borrowings.');
  setText('auth-submit', mode === 'create' ? 'Create account' : 'Log in');
  setText('auth-note', accountExists ? 'Your account is stored locally on this device.' : 'Create an account to protect access to your library.');
  setText('auth-password-label', 'Password');
  const passwordInput = document.getElementById('auth-password');
  if (passwordInput) passwordInput.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  const identifierInput = document.getElementById('auth-identifier');
  if (identifierInput) {
    identifierInput.required = mode === 'login';
    identifierInput.placeholder = 'Enter your username, email, or phone';
  }
  const confirmInput = document.getElementById('auth-confirm-password');
  if (confirmInput) confirmInput.required = mode === 'create';
  ['auth-name', 'auth-username', 'auth-email', 'auth-phone'].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.required = mode === 'create';
  });
  setText('auth-error', '');
}

function normalizePhone(value) {
  return value.replace(/[^0-9]/g, '');
}

function submitAuth(event) {
  event.preventDefault();
  const name = document.getElementById('auth-name').value.trim();
  const username = document.getElementById('auth-username').value.trim().toLowerCase();
  const email = document.getElementById('auth-email').value.trim().toLowerCase();
  const phone = normalizePhone(document.getElementById('auth-phone').value.trim());
  const identifier = document.getElementById('auth-identifier').value.trim().toLowerCase();
  const password = document.getElementById('auth-password').value;
  const confirmPassword = document.getElementById('auth-confirm-password').value;
  const existingAccount = getStoredAccount();

  if (authMode === 'create') {
    if (!name || !username || !email || phone.length < 7 || password.length < 6) {
      setText('auth-error', 'Enter all account details and a password with at least 6 characters.');
      return;
    }
    localStorage.setItem(accountStorageKey, JSON.stringify({ name, username, email, phone, password }));
    state.owner.name = name.toUpperCase();
    state.owner.username = username;
    state.owner.initials = name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'JM';
  } else {
    const normalizedIdentifier = normalizePhone(identifier);
    const matchesIdentifier = existingAccount && (
      existingAccount.username === identifier
      || existingAccount.email === identifier
      || existingAccount.phone === normalizedIdentifier
      || existingAccount.email === identifier
    );
    if (!matchesIdentifier || existingAccount.password !== password) {
      setText('auth-error', 'The username, email, phone, or password is incorrect.');
      return;
    }
    state.owner.name = existingAccount.name.toUpperCase();
    state.owner.username = existingAccount.username || existingAccount.email.split('@')[0];
    state.owner.initials = existingAccount.name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'JM';
  }

  sessionStorage.setItem(sessionStorageKey, 'true');
  document.getElementById('auth-screen')?.classList.add('is-hidden');
  document.getElementById('app')?.classList.add('is-authenticated');
  document.getElementById('auth-form')?.reset();
  renderOwnerInfo();
  showToast(authMode === 'create' ? 'Account created successfully.' : 'Welcome back.');
}

function logout() {
  sessionStorage.removeItem(sessionStorageKey);
  document.getElementById('app')?.classList.remove('is-authenticated');
  document.getElementById('auth-screen')?.classList.remove('is-hidden');
  document.getElementById('auth-form')?.reset();
  setAuthMode('login');
  showToast('You have been logged out.');
}

function init() {
  setupAuthentication();
  renderOwnerInfo();
  renderBooks();
  renderBorrowings();
  renderDashboardSummary();
  renderRecentLists();
  renderAdminContactCenter();
  populateBorrowSelect();
  syncBookSearchInputs();
  updateViewTitle();
  startHeroSlideshow();

}

function renderOwnerInfo() {
  const owner = state.owner || defaultLibraryState.owner;
  const { name, username, library, bio, initials, profileImage } = owner;
  setText('owner-name', name);
  setText('owner-username', username ? `@${username}` : '');
  setText('owner-name-display', name);
  setText('owner-lib', library);
  setText('owner-bio', bio);
  [document.getElementById('owner-initials'), document.getElementById('owner-avatar-box')].forEach((avatar) => {
    if (!avatar) return;
    avatar.textContent = '';
    if (profileImage) {
      const image = document.createElement('img');
      image.src = profileImage;
      image.alt = `${name} profile`;
      avatar.appendChild(image);
    } else {
      avatar.textContent = initials;
    }
  });
}

const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80',
    quote: '“The more that you read, the more things you will know. The more that you learn, the more places you’ll go.”',
    author: '— Dr. Seuss'
  },
  {
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=500&q=80',
    quote: '“A room without books is like a body without a soul.”',
    author: '— Cicero'
  },
  {
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=500&q=80',
    quote: '“Today a reader, tomorrow a leader.”',
    author: '— Margaret Walker'
  },
  {
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
    quote: '“I have always imagined that Paradise will be a kind of library.”',
    author: '— Jorge Luis Borges'
  },
  {
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=500&q=80',
    quote: '“Books are the quietest and most constant of friends; they are the most accessible and wisest of counselors.”',
    author: '— Charles W. Eliot'
  }
];

let heroSlideIndex = 0;
let heroSlideTimer = null;

function renderHeroSlide() {
  const coverEl = document.getElementById('rec-cover');
  const heroCard = document.querySelector('.rec-card');
  const slide = heroSlides[heroSlideIndex % heroSlides.length];

  if (!slide) return;

  const imageUrl = state.owner.heroCover || slide.image;
  if (heroCard) {
    heroCard.style.setProperty('--hero-bg', `url("${imageUrl}")`);
  }

  if (coverEl) {
    coverEl.innerHTML = `<img src="${imageUrl}" alt="Featured library image" />`;
    coverEl.classList.add('has-image', 'slide-active');
  }

  setText('rec-title', slide.quote);
  setText('rec-desc', slide.author);
}

function startHeroSlideshow() {
  renderHeroSlide();
  clearInterval(heroSlideTimer);
  heroSlideTimer = setInterval(() => {
    heroSlideIndex = (heroSlideIndex + 1) % heroSlides.length;
    renderHeroSlide();
  }, 20000);
}

function readNotifications(storageKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeNotifications(storageKey, notifications) {
  localStorage.setItem(storageKey, JSON.stringify(notifications));
}

function renderAdminContactCenter() {
  const inbox = document.getElementById('admin-inbox-list');
  const sentList = document.getElementById('admin-notifications-list');

  const readerNotifications = readNotifications(ADMIN_NOTIFICATIONS_KEY)
    .map((item) => ({
      id: item.id || cryptoRandomId(),
      title: item.title || item.topic || 'Reader notification',
      sender: item.sender || 'Reader',
      detail: item.message || '',
      email: item.email || '',
      createdAt: item.createdAt || new Date().toISOString(),
      kind: 'reader'
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const sentNotifications = readNotifications(ADMIN_SENT_NOTIFICATIONS_KEY)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (inbox) {
    if (!readerNotifications.length) {
      inbox.innerHTML = '<div class="empty-message">No reader messages yet.</div>';
    } else {
      inbox.innerHTML = readerNotifications
        .map((message) => `
          <article class="message-item">
            <div class="message-head">
              <strong>${message.title}</strong>
              <span>${new Date(message.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="message-meta">From: ${message.sender}${message.email ? ` · ${message.email}` : ''}</div>
            <p>${message.detail}</p>
          </article>
        `)
        .join('');
    }
  }

  if (sentList) {
    if (!sentNotifications.length) {
      sentList.innerHTML = '<div class="empty-message">No notifications sent yet.</div>';
    } else {
      sentList.innerHTML = sentNotifications
        .map((notification) => `
          <article class="notification-item">
            <div class="message-head">
              <strong>${notification.subject || 'Notification'}</strong>
              <span>${new Date(notification.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="message-meta">To: ${notification.recipient || 'All readers'}</div>
            <p>${notification.message || ''}</p>
          </article>
        `)
        .join('');
    }
  }
}

function renderDashboardSummary() {
  const totalBooks = state.books.length;
  const borrowedCount = state.books.filter((book) => !book.available).length;
  const availableCount = totalBooks - borrowedCount;
  const returnedCount = state.borrowings.filter((bor) => bor.status === 'Returned').length;
  const notReturnedCount = state.borrowings.filter((bor) => bor.status !== 'Returned').length;

  setText('stat-total', String(totalBooks));
  setText('stat-borrowed', String(borrowedCount));
  setText('stat-available', String(availableCount));
  setText('stat-returned', String(returnedCount));
  setText('stat-notreturned', String(notReturnedCount));

  renderHeroSlide();
}

function renderRecentLists() {
  const added = [...state.books].slice().sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  const recentAddedList = document.getElementById('recently-added-list');
  if (recentAddedList) {
    recentAddedList.innerHTML = added
      .slice(0, 3)
      .map((book) => `<li><span class="tag">${book.title}</span> <span class="muted">(${book.id})</span></li>`)
      .join('');
  }

  const borrowed = [...state.borrowings].slice().sort((a, b) => new Date(b.issued) - new Date(a.issued));
  const recentBorrowedList = document.getElementById('recently-borrowed-list');
  if (recentBorrowedList) {
    recentBorrowedList.innerHTML = borrowed
      .slice(0, 3)
      .map((record) => `<li>${record.borrower} — ${record.bookTitle}</li>`)
      .join('');
  }
}

function getBooksQuery() {
  const idMap = {
    'book-search': document.getElementById('book-search'),
    'book-search-2': document.getElementById('book-search-2'),
    'global-search': document.getElementById('global-search')
  };

  const values = Object.values(idMap)
    .filter(Boolean)
    .map((input) => (input.value || '').trim().toLowerCase());

  return values.filter(Boolean);
}

function filterBooks(items) {
  const queryList = getBooksQuery();
  if (!queryList.length) return items;

  return items.filter((book) => {
    const haystack = `${book.title} ${book.id}`.toLowerCase();
    return queryList.some((q) => haystack.includes(q));
  });
}

function sortBooks(items) {
  const select = document.getElementById('sort-select') || document.getElementById('sort-select-2');
  const value = select ? select.value : 'az';

  const sorted = [...items];
  switch (value) {
    case 'za':
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      break;
    case 'oldest':
      sorted.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
      break;
    default:
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  return sorted;
}

function renderBooks() {
  const filtered = sortBooks(filterBooks(state.books));
  const rows = filtered
    .map(
      (book) => `
        <tr>
          <td>${book.id}</td>
          <td>${book.title}</td>
          <td><span class="badge ${book.condition === 'Good Condition' ? 'good' : book.condition === 'Bad Condition' ? 'bad' : 'fair'}">${book.condition}</span></td>
          <td><span class="badge ${book.available ? 'avail' : 'borrowed'}">${book.available ? 'Available' : 'Borrowed'}</span></td>
          <td>${book.dateAdded}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="deleteBook('${book.id}')">Delete</button>
          </td>
        </tr>
      `
    )
    .join('');

  const tbody1 = document.getElementById('books-tbody');
  if (tbody1) tbody1.innerHTML = rows || `<tr class="empty-row"><td colspan="6">No books match your search.</td></tr>`;

  const tbody2 = document.getElementById('books-tbody-2');
  if (tbody2) tbody2.innerHTML = rows || `<tr class="empty-row"><td colspan="6">No books match your search.</td></tr>`;

  populateBorrowSelect();
}

function filterBorrowings(items) {
  const dashboardInput = document.getElementById('borrow-search');
  const listInput = document.getElementById('borrow-search-2');
  const searchText = (dashboardInput ? dashboardInput.value : '') || (listInput ? listInput.value : '');
  const q = searchText.trim().toLowerCase();
  const filtered = q
    ? items.filter((record) => {
        const haystack = `${record.borrower} ${record.bookTitle} ${record.phone} ${record.bookId}`.toLowerCase();
        return haystack.includes(q);
      })
    : items;

  const grouped = new Map();

  filtered.forEach((record) => {
    const key = `${(record.borrower || '').trim().toLowerCase()}|${(record.phone || '').trim()}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: record.id,
        borrower: record.borrower,
        phone: record.phone,
        bookTitles: [],
        bookIds: [],
        issued: record.issued,
        expected: record.expected,
        actual: record.actual,
        status: record.status,
        condition: record.condition,
        fine: Number(record.fine || 0),
        latestIssued: record.issued
      });
    }

    const group = grouped.get(key);
    group.bookTitles.push(record.bookTitle);
    group.bookIds.push(record.bookId);
    group.fine += Number(record.fine || 0);
    group.issued = group.latestIssued && new Date(record.issued) > new Date(group.latestIssued) ? record.issued : group.issued;
    group.latestIssued = new Date(record.issued) > new Date(group.latestIssued || record.issued) ? record.issued : group.latestIssued;
    group.expected = record.expected || group.expected;
    group.actual = record.status === 'Returned' ? record.actual || group.actual : group.actual;
    if (record.status !== 'Returned') {
      group.status = 'Not Returned';
      group.condition = record.condition || group.condition;
      group.id = record.id;
    }
  });

  return [...grouped.values()].map((group) => ({
    id: group.id,
    borrower: group.borrower,
    phone: group.phone,
    bookTitle: group.bookTitles.join(', '),
    bookId: group.bookIds.join(', '),
    issued: group.issued,
    expected: group.expected,
    actual: group.actual,
    status: group.status,
    condition: group.condition,
    fine: group.fine
  }));
}

function renderBorrowings() {
  const filtered = filterBorrowings([...state.borrowings]);
  const rows = filtered
    .map(
      (record) => `
        <tr>
          <td>${record.borrower}</td>
          <td>${record.phone}</td>
          <td>${record.bookTitle}</td>
          <td>${record.bookId}</td>
          <td>${record.issued}</td>
          <td>${record.expected}</td>
          <td>${record.actual}</td>
          <td><span class="badge ${record.status === 'Returned' ? 'returned' : 'notreturned'}">${record.status}</span></td>
          <td><span class="badge ${record.condition === 'Good Condition' ? 'good' : record.condition === 'Bad Condition' ? 'bad' : 'fair'}">${record.condition}</span></td>
          <td>${formatKSh(record.fine)}</td>
          <td>
            ${record.status === 'Returned' ? '<button class="btn btn-outline btn-sm" disabled>Returned</button>' : `<button class="btn btn-orange btn-sm" onclick="openReturnModal('${record.id}')">Return</button>`}
          </td>
        </tr>
      `
    )
    .join('');

  const tbody1 = document.getElementById('borrowings-tbody');
  if (tbody1) tbody1.innerHTML = rows || `<tr class="empty-row"><td colspan="11">No borrow records match your search.</td></tr>`;

  const tbody2 = document.getElementById('borrowings-tbody-2');
  if (tbody2) tbody2.innerHTML = rows || `<tr class="empty-row"><td colspan="11">No borrow records match your search.</td></tr>`;

  renderDashboardSummary();
  renderRecentLists();
}

function renderAll() {
  renderOwnerInfo();
  renderBooks();
  renderBorrowings();
  renderDashboardSummary();
  renderRecentLists();
  persistLibraryState();
}

function addBook() {
  const title = document.getElementById('nb-title').value.trim();
  const condition = document.getElementById('nb-condition').value;

  if (!title) {
    showToast('Please enter a book title.');
    return;
  }

  const latestNumber = state.books
    .map((book) => Number(String(book.id).split('-')[1]))
    .filter((num) => !Number.isNaN(num));

  const nextNumber = latestNumber.length ? Math.max(...latestNumber) + 1 : 1;
  const id = `HB-${String(nextNumber).padStart(3, '0')}`;

  state.books.unshift({
    id,
    title,
    condition,
    dateAdded: new Date().toISOString().slice(0, 10),
    available: true,
    cover: 'cover'
  });

  closeModal('book-modal');
  document.getElementById('nb-title').value = '';
  renderAll();
  showToast('Book added successfully.');
}

function openBookModal() {
  document.getElementById('book-modal').classList.add('active');
}

function openBorrowModal() {
  populateBorrowSelect();
  document.getElementById('borrow-modal').classList.add('active');
}

function openReturnModal(recordId) {
  state.selectedBorrowId = recordId;
  document.getElementById('return-modal').classList.add('active');
}

function openOwnerModal() {
  const { name, library, bio } = state.owner;
  document.getElementById('ow-name').value = name;
  document.getElementById('ow-lib').value = library;
  document.getElementById('ow-bio').value = bio;
  const profileUpload = document.getElementById('ow-profile-upload');
  if (profileUpload) profileUpload.value = '';
  const coverUpload = document.getElementById('ow-cover-upload');
  if (coverUpload) coverUpload.value = '';
  document.getElementById('owner-modal').classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function saveOwner() {
  const name = document.getElementById('ow-name').value.trim();
  const library = document.getElementById('ow-lib').value.trim();
  const bio = document.getElementById('ow-bio').value.trim();
  const profileInput = document.getElementById('ow-profile-upload');
  const coverInput = document.getElementById('ow-cover-upload');

  if (!name || !library || !bio) {
    showToast('Please complete all owner fields.');
    return;
  }

  const profileFile = profileInput && profileInput.files && profileInput.files[0];
  const coverFile = coverInput && coverInput.files && coverInput.files[0];
  const filesToRead = [
    profileFile ? ['profileImage', profileFile] : null,
    coverFile ? ['heroCover', coverFile] : null
  ].filter(Boolean);

  if (filesToRead.length) {
    let remaining = filesToRead.length;
    filesToRead.forEach(([key, file]) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        state.owner[key] = event.target.result;
        remaining -= 1;
        if (remaining !== 0) return;

        state.owner = {
          ...state.owner,
          name: name.toUpperCase(),
          library,
          bio,
          initials: name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'JM'
        };
        closeModal('owner-modal');
        renderOwnerInfo();
        renderDashboardSummary();
        showToast('Library owner updated.');
      };
      reader.readAsDataURL(file);
    });
    return;
  }

  state.owner = {
    ...state.owner,
    name: name.toUpperCase(),
    library,
    bio,
    initials: name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'JM'
  };

  closeModal('owner-modal');
  renderOwnerInfo();
  renderDashboardSummary();
  showToast('Library owner updated.');
}

function populateBorrowSelect() {
  const select = document.getElementById('bw-book');
  if (!select) return;

  const availableBooks = state.books.filter((book) => book.available);
  select.innerHTML = availableBooks.length
    ? availableBooks.map((book) => `<option value="${book.id}">${book.title} (${book.id})</option>`).join('')
    : '<option value="">No available books</option>';
}

function addBorrowing() {
  const borrower = document.getElementById('bw-name').value.trim();
  const phone = document.getElementById('bw-phone').value.trim();
  const bookId = document.getElementById('bw-book').value;
  const expected = document.getElementById('bw-expected').value;

  if (!borrower || !phone || phone.length < 10 || !bookId || !expected) {
    showToast('Phone number must be at least 10 characters');
    return;
  }

  const book = getBookById(bookId);
  if (!book) {
    showToast('Selected book not found.');
    return;
  }

  const now = new Date().toISOString().slice(0, 10);

  state.borrowings.unshift({
    id: cryptoRandomId(),
    borrower,
    phone,
    bookId: book.id,
    bookTitle: book.title,
    issued: now,
    expected,
    actual: '-',
    status: 'Not Returned',
    condition: book.condition,
    fine: 0
  });

  book.available = false;

  closeModal('borrow-modal');
  document.getElementById('bw-name').value = '';
  document.getElementById('bw-phone').value = '';
  document.getElementById('bw-expected').value = '';

  renderAll();
  showToast('Book borrowed successfully.');
}

function issueBookedCopy(bookId) {
  const waitingRecord = state.borrowings
    .filter((item) => item.bookId === bookId && item.status === 'Booked')
    .sort((a, b) => new Date(a.issued) - new Date(b.issued))[0];

  if (!waitingRecord) return null;

  const book = getBookById(bookId);
  waitingRecord.status = 'Not Returned';
  waitingRecord.issued = new Date().toISOString().slice(0, 10);
  waitingRecord.expected = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  waitingRecord.actual = '-';
  waitingRecord.fine = 0;
  if (book) {
    waitingRecord.condition = book.condition;
    book.available = false;
  }

  return waitingRecord;
}

function confirmReturn() {
  const id = state.selectedBorrowId;
  const record = state.borrowings.find((item) => item.id === id);
  if (!record) {
    showToast('No borrow record selected.');
    return;
  }

  const condition = document.getElementById('rt-condition').value;
  const fine = Number(document.getElementById('rt-fine').value || 0);
  record.status = 'Returned';
  record.actual = new Date().toISOString().slice(0, 10);
  record.condition = condition;
  record.fine = fine;

  const relatedBook = getBookById(record.bookId);
  const nextReservation = issueBookedCopy(record.bookId);

  if (relatedBook) {
    if (nextReservation) {
      relatedBook.available = false;
      relatedBook.condition = nextReservation.condition || condition;
    } else {
      relatedBook.available = true;
      relatedBook.condition = condition;
    }
  }

  closeModal('return-modal');
  document.getElementById('rt-condition').value = 'Good Condition';
  document.getElementById('rt-fine').value = '0';
  state.selectedBorrowId = null;

  renderAll();
  showToast(nextReservation ? `Book issued directly to ${nextReservation.borrower}.` : 'Book marked as returned.');
}

function deleteBook(id) {
  const book = getBookById(id);
  if (!book) return;

  state.books = state.books.filter((item) => item.id !== id);
  state.borrowings = state.borrowings.filter((record) => record.bookId !== id);

  if (state.recommendedBook === id) {
    state.recommendedBook = state.books[0]?.id || null;
  }

  renderAll();
  showToast(`Deleted ${book.title}.`);
}

function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('overlay')?.classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('active');
}

function switchView(viewName, trigger) {
  state.currentView = viewName;
  document.querySelectorAll('.nav button').forEach((button) => button.classList.toggle('active', button === trigger));
  document.querySelectorAll('.view').forEach((section) => section.classList.toggle('active', section.id === `view-${viewName}`));
  if (viewName === 'contact') renderAdminContactCenter();
  updateViewTitle();
  closeSidebar();
}

function updateViewTitle() {
  const titleMap = {
    dashboard: 'Dashboard',
    books: 'Books',
    borrowings: 'Borrowings',
    contact: 'Contact'
  };
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = titleMap[state.currentView] || 'Dashboard';
}

function syncBookSearchInputs() {
  const mainSearch = document.getElementById('global-search');
  const search1 = document.getElementById('book-search');
  const search2 = document.getElementById('book-search-2');

  if (mainSearch && search1) {
    mainSearch.addEventListener('input', (event) => {
      search1.value = event.target.value;
      renderBooks();
    });
  }

  if (mainSearch && search2) {
    mainSearch.addEventListener('input', (event) => {
      search2.value = event.target.value;
      renderBooks();
    });
  }
}

function onGlobalSearch(value) {
  const inputs = [document.getElementById('book-search'), document.getElementById('book-search-2')];
  inputs.forEach((input) => {
    if (input) input.value = value;
  });
  renderBooks();
}

function formatKSh(value) {
  return `KSh ${Number(value || 0).toLocaleString('en-KE')}`;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove('show'), 2200);
}

window.addEventListener('storage', (event) => {
  if (event.key === 'myLibraryReaderIssues' || event.key === ADMIN_SENT_NOTIFICATIONS_KEY || event.key === ADMIN_NOTIFICATIONS_KEY) {
    renderAdminContactCenter();
  }
});

document.addEventListener('DOMContentLoaded', init);
