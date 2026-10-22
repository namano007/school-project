const STORAGE_KEY = 'my-library-dashboard-state';
const USER_ACCOUNTS_KEY = 'myLibraryUserAccounts';
const USER_SESSION_KEY = 'myLibraryReaderSession';

const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80',
    quote: '“The more that you read, the more things you will know.”',
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
    quote: '“Books are the quietest and most constant of friends.”',
    author: '— Charles W. Eliot'
  }
];

let heroSlideIndex = 0;
let heroSlideTimer = null;

function renderUserHero() {
  const slide = heroSlides[heroSlideIndex % heroSlides.length];
  const hero = document.querySelector('.user-hero');
  const heroImage = document.getElementById('user-hero-image');
  const heroQuote = document.getElementById('user-hero-quote');
  const heroAuthor = document.getElementById('user-hero-author');

  if (!slide) return;

  if (hero) {
    hero.style.setProperty('--user-hero-bg', `url("${slide.image}")`);
  }
  if (heroImage) heroImage.src = slide.image;
  if (heroQuote) heroQuote.textContent = slide.quote;
  if (heroAuthor) heroAuthor.textContent = slide.author;
}

function startUserHeroRotation() {
  renderUserHero();
  clearInterval(heroSlideTimer);
  heroSlideTimer = setInterval(() => {
    heroSlideIndex = (heroSlideIndex + 1) % heroSlides.length;
    renderUserHero();
  }, 20000);
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Array.isArray(saved.books) && Array.isArray(saved.borrowings)) {
      return saved;
    }
  } catch (error) {
    console.warn('Unable to load saved library state.', error);
  }
  return null;
}

function persistState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getStoredUserAccounts() {
  try {
    return JSON.parse(localStorage.getItem(USER_ACCOUNTS_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

function setStoredUserAccounts(accounts) {
  localStorage.setItem(USER_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getCurrentBorrower() {
  const savedUser = localStorage.getItem('myLibraryReader');
  if (!savedUser) return { name: 'Reader', initials: 'R' };
  try {
    const parsed = JSON.parse(savedUser);
    return {
      name: parsed.name || 'Reader',
      initials: (parsed.name || 'Reader').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'R'
    };
  } catch (error) {
    return { name: 'Reader', initials: 'R' };
  }
}

function setUserAuthMode(mode) {
  const screen = document.getElementById('user-auth-screen');
  const authNameField = document.getElementById('user-auth-name-field');
  const usernameField = document.getElementById('user-auth-username-field');
  const emailField = document.getElementById('user-auth-email-field');
  const phoneField = document.getElementById('user-auth-phone-field');
  const confirmField = document.getElementById('user-auth-confirm-field');
  const identifierField = document.getElementById('user-auth-identifier-field');
  const submitButton = document.getElementById('user-auth-submit');
  const title = document.getElementById('user-auth-title');
  const subtitle = document.getElementById('user-auth-subtitle');
  const note = document.getElementById('user-auth-note');
  const passwordLabel = document.getElementById('user-auth-password-label');

  const isCreate = mode === 'create';
  if (screen) screen.classList.toggle('create-mode', isCreate);
  if (authNameField) authNameField.style.display = isCreate ? 'block' : 'none';
  if (usernameField) usernameField.style.display = isCreate ? 'block' : 'none';
  if (emailField) emailField.style.display = isCreate ? 'block' : 'none';
  if (phoneField) phoneField.style.display = isCreate ? 'block' : 'none';
  if (confirmField) confirmField.style.display = isCreate ? 'block' : 'none';
  if (identifierField) identifierField.style.display = isCreate ? 'none' : 'block';
  const termsBox = document.getElementById('user-auth-terms-box');
  const termsLabel = document.getElementById('user-auth-terms-label');
  if (termsBox) termsBox.style.display = isCreate ? 'block' : 'none';
  if (termsLabel) termsLabel.style.display = isCreate ? 'flex' : 'none';
  if (submitButton) submitButton.textContent = isCreate ? 'Create account' : 'Log in';
  if (title) title.textContent = isCreate ? 'Create your account' : 'Welcome back';
  if (subtitle) subtitle.textContent = isCreate ? 'Create a reader account to borrow books and manage your history.' : 'Sign in to borrow books and track your reading journey.';
  if (note) note.textContent = isCreate ? 'Your account will be saved on this device.' : 'Use your username or email to log in.';
  if (passwordLabel) passwordLabel.textContent = 'Password';

  const loginTab = document.getElementById('user-login-tab');
  const createTab = document.getElementById('user-create-tab');
  if (loginTab) loginTab.classList.toggle('active', !isCreate);
  if (createTab) createTab.classList.toggle('active', isCreate);
}

function updateUserAuthVisibility() {
  const authScreen = document.getElementById('user-auth-screen');
  const appShell = document.getElementById('user-app-shell');
  const sessionActive = sessionStorage.getItem(USER_SESSION_KEY) === 'true';

  if (authScreen) authScreen.classList.toggle('is-hidden', sessionActive);
  if (appShell) appShell.classList.toggle('is-hidden', !sessionActive);
}

function submitUserAuth(event) {
  event.preventDefault();
  const isCreate = document.getElementById('user-auth-screen')?.classList.contains('create-mode');
  const errorBox = document.getElementById('user-auth-error');

  const setError = (message) => {
    if (errorBox) errorBox.textContent = message;
  };

  if (isCreate) {
    const name = document.getElementById('user-auth-name').value.trim();
    const username = document.getElementById('user-auth-username').value.trim();
    const email = document.getElementById('user-auth-email').value.trim().toLowerCase();
    const phone = document.getElementById('user-auth-phone').value.trim();
    const password = document.getElementById('user-auth-password').value;
    const confirm = document.getElementById('user-auth-confirm-password').value;
    const termsAccepted = document.getElementById('user-auth-terms')?.checked;

    if (!name || !username || !email || !phone || !password) {
      setError('Please fill in all fields to create your account.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setError('Please agree to the library terms and conditions before creating your account.');
      return;
    }

    const accounts = getStoredUserAccounts();
    const exists = accounts.some((account) => account.username.toLowerCase() === username.toLowerCase() || account.email.toLowerCase() === email || account.phone === phone);
    if (exists) {
      setError('An account with that username, email, or phone already exists.');
      return;
    }

    const newAccount = { name, username, email, phone, password };
    accounts.push(newAccount);
    setStoredUserAccounts(accounts);
    localStorage.setItem('myLibraryReader', JSON.stringify(newAccount));
    sessionStorage.setItem(USER_SESSION_KEY, 'true');
    updateUserAuthVisibility();
    setReaderIdentity();
    renderAll();
    setError('');
    document.getElementById('user-auth-form').reset();
    return;
  }

  const identifier = document.getElementById('user-auth-identifier').value.trim();
  const password = document.getElementById('user-auth-password').value;
  const accounts = getStoredUserAccounts();
  const account = accounts.find((entry) => entry.username.toLowerCase() === identifier.toLowerCase() || entry.email.toLowerCase() === identifier.toLowerCase());

  if (!account || account.password !== password) {
    setError('Username/email or password is incorrect.');
    return;
  }

  localStorage.setItem('myLibraryReader', JSON.stringify(account));
  sessionStorage.setItem(USER_SESSION_KEY, 'true');
  updateUserAuthVisibility();
  setReaderIdentity();
  renderAll();
  setError('');
  document.getElementById('user-auth-form').reset();
}

function logoutReader() {
  sessionStorage.removeItem(USER_SESSION_KEY);
  localStorage.removeItem('myLibraryReader');
  updateUserAuthVisibility();
  setUserAuthMode('login');
  document.getElementById('user-auth-form')?.reset();
  document.getElementById('borrow-status').textContent = 'You have been logged out.';
}

function formatDate(value) {
  if (!value || value === '-') return '-';
  return value;
}

function formatKSh(value) {
  const amount = Number(value || 0);
  return `KSh ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function renderSummary(state) {
  const total = state.books.length;
  const available = state.books.filter((book) => book.available).length;
  const borrowed = total - available;

  document.getElementById('total-books').textContent = total;
  document.getElementById('available-books').textContent = available;
  document.getElementById('borrowed-books').textContent = borrowed;
}

function renderBooks(state) {
  const searchValue = (document.getElementById('reader-search')?.value || '').trim().toLowerCase();
  const filtered = state.books.filter((book) => {
    const haystack = `${book.title} ${book.id}`.toLowerCase();
    return haystack.includes(searchValue);
  });

  const grid = document.getElementById('book-grid');
  if (!grid) return;

  grid.innerHTML = filtered.map((book) => `
    <article class="user-card book-item">
      <div class="book-cover">
        ${book.cover && book.cover !== 'cover' ? `<img src="${book.cover}" alt="${book.title}" />` : book.title.slice(0, 2).toUpperCase()}
      </div>
      <div class="book-meta">
        <div>
          <div class="book-title">${book.title}</div>
          <div class="book-id">${book.id}</div>
        </div>
        <span class="badge ${book.available ? 'avail' : 'borrowed'}">${book.available ? 'Available' : 'Borrowed'}</span>
      </div>
      <div class="book-meta">
        <span class="badge ${book.condition === 'Good Condition' ? 'good' : book.condition === 'Bad Condition' ? 'bad' : 'fair'}">${book.condition}</span>
        <button class="btn btn-orange btn-sm" type="button" data-book-id="${book.id}" ${book.available ? '' : 'disabled'}>
          ${book.available ? 'Borrow now' : 'Unavailable'}
        </button>
      </div>
    </article>
  `).join('') || '<div class="empty-row" style="grid-column: 1 / -1;">No books match your search.</div>';

  const borrowSelect = document.getElementById('borrow-book-select');
  if (borrowSelect) {
    const availableBooks = state.books.filter((book) => book.available);
    borrowSelect.innerHTML = availableBooks.length
      ? availableBooks.map((book) => `<option value="${book.id}">${book.title} (${book.id})</option>`).join('')
      : '<option value="">No available books</option>';
  }
}

function renderHistory(state) {
  const savedReader = (() => {
    try {
      return JSON.parse(localStorage.getItem('myLibraryReader') || '{}');
    } catch (error) {
      return {};
    }
  })();

  const currentReaderName = (savedReader.name || '').trim().toLowerCase();
  const rows = state.borrowings
    .filter((record) => record.borrower && record.borrower.toLowerCase() === currentReaderName)
    .slice(0, 10);

  const tbody = document.getElementById('borrow-history-body');
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No borrow history yet.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((record) => `
    <tr>
      <td>${record.bookTitle}</td>
      <td>${formatDate(record.issued)}</td>
      <td>${formatDate(record.expected)}</td>
      <td><span class="badge ${record.status === 'Returned' ? 'returned' : 'notreturned'}">${record.status}</span></td>
      <td>${formatKSh(record.fine || 0)}</td>
    </tr>
  `).join('');
}

function setReaderIdentity() {
  const reader = getCurrentBorrower();
  const initialsEl = document.getElementById('reader-initials');
  const nameEl = document.getElementById('reader-name');
  let profileImage = '';

  try {
    const savedUser = JSON.parse(localStorage.getItem('myLibraryReader') || '{}');
    if (savedUser && savedUser.name) {
      reader.name = savedUser.name;
      reader.initials = (savedUser.name || 'Reader').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'R';
    }
    profileImage = savedUser.profileImage || '';
  } catch (error) {
    console.warn('Unable to read profile image', error);
  }

  if (initialsEl) {
    if (profileImage) {
      initialsEl.innerHTML = `<img src="${profileImage}" alt="Profile image" />`;
    } else {
      initialsEl.textContent = reader.initials;
    }
  }

  if (nameEl) nameEl.textContent = reader.name;
}

function openProfileModal() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('myLibraryReader') || '{}');
    } catch (error) {
      return {};
    }
  })();

  document.getElementById('profile-name').value = user.name || '';
  document.getElementById('profile-username').value = user.username || '';
  document.getElementById('profile-email').value = user.email || '';
  document.getElementById('profile-phone').value = user.phone || '';
  document.getElementById('profile-image-input').value = '';

  const previewBox = document.getElementById('profile-preview-box');
  const previewText = document.getElementById('profile-preview-text');
  if (user.profileImage) {
    previewBox.innerHTML = `<img src="${user.profileImage}" alt="Profile preview" />`;
  } else {
    previewBox.innerHTML = '<span id="profile-preview-text">U</span>';
    if (previewText) previewText.textContent = (user.name || 'U').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
  }

  document.getElementById('profile-modal').classList.add('active');
}

function closeProfileModal() {
  document.getElementById('profile-modal').classList.remove('active');
}

function saveProfileChanges() {
  const name = document.getElementById('profile-name').value.trim();
  const username = document.getElementById('profile-username').value.trim();
  const email = document.getElementById('profile-email').value.trim().toLowerCase();
  const phone = document.getElementById('profile-phone').value.trim();
  const fileInput = document.getElementById('profile-image-input');
  const file = fileInput && fileInput.files && fileInput.files[0];

  const existing = (() => {
    try {
      return JSON.parse(localStorage.getItem('myLibraryReader') || '{}');
    } catch (error) {
      return {};
    }
  })();

  if (!name || !username || !email || !phone) {
    showStatus('Please complete your profile before saving.');
    return;
  }

  const nextUser = {
    ...existing,
    name,
    username,
    email,
    phone
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      nextUser.profileImage = event.target.result;
      localStorage.setItem('myLibraryReader', JSON.stringify(nextUser));
      setReaderIdentity();
      closeProfileModal();
      showStatus('Profile updated successfully.');
    };
    reader.readAsDataURL(file);
    return;
  }

  localStorage.setItem('myLibraryReader', JSON.stringify(nextUser));
  setReaderIdentity();
  closeProfileModal();
  showStatus('Profile updated successfully.');
}

function getAdminContactInfo() {
  try {
    const adminAccount = JSON.parse(localStorage.getItem('myLibraryAccount') || '{}');
    const name = (adminAccount.name || 'Library Admin').trim();
    const email = (adminAccount.email || 'admin@library.com').trim();
    const phone = (adminAccount.phone || '+254700000000').trim();

    return {
      name: name || 'Library Admin',
      email: email || 'admin@library.com',
      phone: phone || '+254700000000'
    };
  } catch (error) {
    return {
      name: 'Library Admin',
      email: 'admin@library.com',
      phone: '+254700000000'
    };
  }
}

function renderAdminContact() {
  const contact = getAdminContactInfo();
  const nameEl = document.getElementById('admin-contact-name');
  const emailEl = document.getElementById('admin-contact-email');
  const phoneEl = document.getElementById('admin-contact-phone');
  const avatarEl = document.getElementById('admin-contact-avatar');

  if (nameEl) nameEl.textContent = contact.name;
  if (emailEl) {
    emailEl.textContent = contact.email;
    emailEl.setAttribute('href', `mailto:${contact.email}`);
  }
  if (phoneEl) {
    phoneEl.textContent = contact.phone;
    phoneEl.setAttribute('href', `tel:${contact.phone.replace(/\s+/g, '')}`);
  }
  if (avatarEl) {
    avatarEl.textContent = (contact.name || 'A').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'A';
  }
}

function readAdminNotifications() {
  try {
    return JSON.parse(localStorage.getItem('myLibraryAdminSentNotifications') || '[]');
  } catch (error) {
    return [];
  }
}

function renderUserNotifications() {
  const listEl = document.getElementById('user-notification-list');
  const countEl = document.getElementById('user-notification-count');
  const notifications = readAdminNotifications().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (countEl) countEl.textContent = String(notifications.length);

  if (!listEl) return;

  if (!notifications.length) {
    listEl.innerHTML = '<div class="empty-notification">No notifications from the admin yet.</div>';
    return;
  }

  listEl.innerHTML = notifications
    .map((notification) => `
      <article class="user-notification-item">
        <div class="user-notification-meta">
          <span>${notification.recipient === 'all' ? 'All readers' : notification.recipient}</span>
          <span>${new Date(notification.createdAt).toLocaleDateString()}</span>
        </div>
        <strong>${notification.subject || 'Library update'}</strong>
        <p>${notification.message}</p>
      </article>
    `)
    .join('');
}

function getReaderContactDefaults() {
  try {
    const reader = JSON.parse(localStorage.getItem('myLibraryReader') || '{}');
    return {
      name: (reader.name || '').trim(),
      email: (reader.email || '').trim()
    };
  } catch (error) {
    return { name: '', email: '' };
  }
}

function populateContactForm() {
  const defaults = getReaderContactDefaults();
  const nameField = document.getElementById('contact-name');
  const emailField = document.getElementById('contact-email');

  if (nameField && !nameField.value) nameField.value = defaults.name;
  if (emailField && !emailField.value) emailField.value = defaults.email;
}

function showContactStatus(message, isError = false) {
  const statusEl = document.getElementById('contact-status');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.style.color = isError ? '#b42318' : '#0a6d61';
}

function submitReaderIssue(event) {
  event.preventDefault();

  const name = document.getElementById('contact-name')?.value.trim() || '';
  const email = document.getElementById('contact-email')?.value.trim() || '';
  const topic = document.getElementById('contact-topic')?.value || 'Other';
  const message = document.getElementById('contact-message')?.value.trim() || '';

  if (!name || !email || !message) {
    showContactStatus('Please fill in your name, email, and issue details before sending.', true);
    return;
  }

  try {
    const issues = JSON.parse(localStorage.getItem('myLibraryReaderIssues') || '[]');
    const notification = {
      id: `issue-${Date.now()}`,
      name,
      email,
      topic,
      message,
      createdAt: new Date().toISOString()
    };
    issues.unshift(notification);
    localStorage.setItem('myLibraryReaderIssues', JSON.stringify(issues));

    const adminNotifications = JSON.parse(localStorage.getItem('myLibraryAdminNotifications') || '[]');
    adminNotifications.unshift({
      id: notification.id,
      title: `${topic} from ${name}`,
      sender: name,
      email,
      message,
      type: 'reader-message',
      createdAt: notification.createdAt
    });
    localStorage.setItem('myLibraryAdminNotifications', JSON.stringify(adminNotifications));
  } catch (error) {
    showContactStatus('Something went wrong while sending your message. Please try again.', true);
    return;
  }

  const form = document.getElementById('contact-issue-form');
  if (form) form.reset();
  populateContactForm();
  showContactStatus('Your message has been sent to the admin successfully.');
}

function setUserPage(page) {
  const buttons = document.querySelectorAll('.user-nav-btn');
  const views = document.querySelectorAll('.user-page');

  buttons.forEach((button) => {
    button.classList.toggle('active', button.dataset.userPage === page);
  });

  views.forEach((view) => {
    view.classList.toggle('active', view.id === (page === 'home' ? 'user-home-page' : page === 'history' ? 'user-history-page' : 'user-contact-page'));
  });

  sessionStorage.setItem('myLibraryReaderPage', page);
}

function bindEvents() {
  document.getElementById('user-login-tab')?.addEventListener('click', () => setUserAuthMode('login'));
  document.getElementById('user-create-tab')?.addEventListener('click', () => setUserAuthMode('create'));
  document.getElementById('user-forgot-password-link')?.addEventListener('click', () => {
    const errorBox = document.getElementById('user-auth-error');
    if (errorBox) {
      errorBox.textContent = 'Please contact the library admin to reset your password.';
    }
  });
  document.getElementById('user-auth-form')?.addEventListener('submit', submitUserAuth);
  document.getElementById('reader-profile-button')?.addEventListener('click', openProfileModal);
  document.getElementById('reader-logout-button')?.addEventListener('click', logoutReader);
  document.getElementById('profile-cancel-button')?.addEventListener('click', closeProfileModal);
  document.getElementById('profile-save-button')?.addEventListener('click', saveProfileChanges);
  document.getElementById('contact-issue-form')?.addEventListener('submit', submitReaderIssue);

  document.querySelectorAll('.user-nav-btn').forEach((button) => {
    button.addEventListener('click', () => setUserPage(button.dataset.userPage));
  });

  document.getElementById('reader-search')?.addEventListener('input', () => {
    const state = loadState();
    if (state) renderBooks(state);
  });

  document.getElementById('borrow-button')?.addEventListener('click', () => {
    const state = loadState();
    if (!state) {
      showStatus('Library data is not available yet.');
      return;
    }

    const savedReader = (() => {
      try {
        return JSON.parse(localStorage.getItem('myLibraryReader') || '{}');
      } catch (error) {
        return {};
      }
    })();

    const borrowerName = (savedReader.name || '').trim();
    const phone = (savedReader.phone || '').trim();
    const bookId = document.getElementById('borrow-book-select').value;
    const expected = document.getElementById('borrow-date').value;

    if (!borrowerName || !phone || phone.length < 10 || !bookId || !expected) {
      showStatus('Please complete your profile with a valid name and phone number before borrowing.');
      openProfileModal();
      return;
    }

    const book = state.books.find((item) => item.id === bookId);
    if (!book || !book.available) {
      showStatus('This book is not available to borrow right now.');
      return;
    }

    state.borrowings.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      borrower: borrowerName,
      phone,
      bookId: book.id,
      bookTitle: book.title,
      issued: new Date().toISOString().slice(0, 10),
      expected,
      actual: '-',
      status: 'Not Returned',
      condition: book.condition,
      fine: 0
    });

    book.available = false;
    persistState(state);

    setReaderIdentity();
    renderAll();
    showStatus(`You borrowed “${book.title}”. It has been added to the admin dashboard.`);
  });

  document.getElementById('book-grid')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-book-id]');
    if (!button || button.disabled) return;

    const state = loadState();
    if (!state) return;

    const id = button.getAttribute('data-book-id');
    const selectedBook = state.books.find((book) => book.id === id);
    if (!selectedBook || !selectedBook.available) return;

    const select = document.getElementById('borrow-book-select');
    if (select) {
      select.value = id;
    }

    document.getElementById('borrow-date').value = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    document.getElementById('borrow-date').focus();
  });
}

function showStatus(message) {
  const status = document.getElementById('borrow-status');
  if (status) status.textContent = message;
}

function renderAll() {
  const state = loadState();
  if (!state) {
    document.getElementById('book-grid').innerHTML = '<div class="empty-row" style="grid-column: 1 / -1;">No library data found yet. Add books from the admin dashboard first.</div>';
  }

  setReaderIdentity();
  populateContactForm();
  renderUserNotifications();
  if (state) {
    renderSummary(state);
    renderBooks(state);
    renderHistory(state);
  }
  renderAdminContact();
}

window.addEventListener('storage', (event) => {
  if (event.key === 'myLibraryAdminSentNotifications') {
    renderUserNotifications();
  }
});

if (sessionStorage.getItem(USER_SESSION_KEY) === 'true' || localStorage.getItem('myLibraryReader')) {
  updateUserAuthVisibility();
} else {
  updateUserAuthVisibility();
  setUserAuthMode('login');
}

bindEvents();
renderAll();
setUserPage(sessionStorage.getItem('myLibraryReaderPage') || 'home');
startUserHeroRotation();
