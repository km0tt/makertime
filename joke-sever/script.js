const state = {
  category: 'Any',
  currentJoke: null,
  saved: JSON.parse(localStorage.getItem('jokezonesSaved') || '[]'),
}

const fetchBtn = document.getElementById('fetchBtn')
const saveBtn = document.getElementById('saveBtn')
const copyBtn = document.getElementById('copyBtn')
const clearBtn = document.getElementById('clearBtn')
const jokeBody = document.getElementById('jokeBody')
const categoryBadge = document.getElementById('categoryBadge')
const jokeId = document.getElementById('jokeId')
const savedSection = document.getElementById('savedSection')
const savedList = document.getElementById('savedList')
const savedCount = document.getElementById('savedCount')
const toast = document.getElementById('toast')
const authSection = document.getElementById('authSection')
const mainSection = document.getElementById('mainSection')
const loginForm = document.getElementById('loginForm')
const registerForm = document.getElementById('registerForm')
const loginBtn = document.getElementById('loginBtn')
const registerBtn = document.getElementById('registerBtn')
const goRegister = document.getElementById('goRegister')
const goLogin = document.getElementById('goLogin')

document.getElementById('categoryChips').querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.getElementById('categoryChips').querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
    chip.classList.add('active')
    state.category = chip.dataset.value
  })
})

async function fetchJoke() {
  const url = `https://v2.jokeapi.dev/joke/${state.category}?blacklistFlags=nsfw,racist,sexist&lang=en`
  const res = await fetch(url)
  const data = await res.json()

  if (data.error) {
    jokeBody.innerHTML = `<p>Not Found </p>`
    return
  }

  state.currentJoke = data
  renderJoke(data)
}

function renderJoke(joke) {
  categoryBadge.textContent = joke.category
  jokeId.textContent = `#${joke.id}`

  if (joke.type === 'twopart') {
    jokeBody.innerHTML = `
      <p class="setup">${joke.setup}</p>
      <p class="punchline">${joke.delivery}</p>`
  } else {
    jokeBody.innerHTML = `<p class="single">${joke.joke}</p>`
  }
}

saveBtn.addEventListener('click', async () => {
  if (!state.currentJoke) { showToast('At first, get a joke'); return }

  const res = await fetch('/jokes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.token}`
    },
    body: JSON.stringify({
      joke_id: state.currentJoke.id,
      joke_text: state.currentJoke.type === 'twopart'
        ? `${state.currentJoke.setup} — ${state.currentJoke.delivery}`
        : state.currentJoke.joke,
      category: state.currentJoke.category
    })
  })

  
  const data = await res.json()
  
  if (data.error) {
    showToast(data.error)
    return
  }
  
  showToast('Saved')
  loadSavedJokes()
})
async function loadSavedJokes() {
  const res = await fetch('/jokes', {
    headers: {
      'Authorization': `Bearer ${state.token}`
    }
  })

  const data = await res.json()

  if (data.error) {
    showToast(data.error)
    return
  }

  state.saved = data.jokes
  renderSavedList()
}

copyBtn.addEventListener('click', () => {
  if (!state.currentJoke) return
  const text = state.currentJoke.type === 'twopart'
    ? `${state.currentJoke.setup}\n${state.currentJoke.delivery}`
    : state.currentJoke.joke
  navigator.clipboard.writeText(text)
  showToast('Copied!')
})

function renderSavedList() {
  savedCount.textContent = state.saved.length
  savedSection.style.display = state.saved.length ? 'block' : 'none'
  savedList.innerHTML = ''

  state.saved.forEach((joke, idx) => {
    const item = document.createElement('div')
    item.className = 'saved-item'
    item.innerHTML = `
      <div>${joke.joke_text}</div>
  <button class="del-btn" data-id="${joke.joke_id}">✕</button>`
    savedList.appendChild(item)
  })

  savedList.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      fetch('/jokes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ joke_id: btn.dataset.id })
      }).then(() => {
        loadSavedJokes()
        showToast('Deleted')
      })

    })
  })
}

clearBtn.addEventListener('click', () => {
  state.saved = []
  localStorage.setItem('jokezonesSaved', JSON.stringify(state.saved))
  renderSavedList()
  showToast('List cleared')
})

fetchBtn.addEventListener('click', fetchJoke)

let toastTimer
function showToast(msg) {
  toast.textContent = msg
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200)
}

renderSavedList()

if (state.token) {
  loadSavedJokes()
}

goRegister.addEventListener('click', () => {
  loginForm.style.display = 'none'
  registerForm.style.display = 'block'
})

goLogin.addEventListener('click', () => {
  registerForm.style.display = 'none'
  loginForm.style.display = 'block'
})

registerBtn.addEventListener('click', async () => {
  const username = document.getElementById('regUsername').value
  const password = document.getElementById('regPassword').value

  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })

  const data = await res.json()

  if (data.error) {
    showToast(data.error)
    return
  }

  showToast('Реєстрація успішна! Тепер увійди 😊')
  registerForm.style.display = 'none'
  loginForm.style.display = 'block'
})

loginBtn.addEventListener('click', async () => {
  const username = document.getElementById('loginUsername').value
  const password = document.getElementById('loginPassword').value

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })

  const data = await res.json()

  if (data.error) {
    showToast(data.error)
    return
  }

  localStorage.setItem('token', data.token)
  state.token = data.token
  authSection.style.display = 'none'
  mainSection.style.display = 'block'
  showToast('Ласкаво просимо! 😊')
})

const token = localStorage.getItem('token')
if (token) {
  state.token = token
  authSection.style.display = 'none'
  mainSection.style.display = 'block'
}