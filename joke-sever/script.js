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

saveBtn.addEventListener('click', () => {
  if (!state.currentJoke) { showToast('Firstly get a joke!'); return }
  if (state.saved.some(j => j.id === state.currentJoke.id)) { showToast('Already saved'); return }

  state.saved.unshift(state.currentJoke)
  localStorage.setItem('jokezonesSaved', JSON.stringify(state.saved))
  renderSavedList()
  showToast('Saved!')
})

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
      <div>${joke.type === 'twopart' ? joke.setup : joke.joke}</div>
      <button class="del-btn" data-index="${idx}">✕</button>`
    savedList.appendChild(item)
  })

  savedList.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.saved.splice(+btn.dataset.index, 1)
      localStorage.setItem('jokezonesSaved', JSON.stringify(state.saved))
      renderSavedList()
      showToast('Deleted')
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