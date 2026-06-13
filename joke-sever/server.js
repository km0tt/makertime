const http = require('http')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mysql = require('mysql2')

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'jokezone'
})

db.connect((err) => {
  if (err) {
    console.log('Помилка підключення:', err)
    return
  }
  console.log('База даних підключена!')
})

const SECRET_KEY = 'jokezone_secret_key'
const PORT = 3000

function getBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => resolve(JSON.parse(body || '{}')))
  })
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',

  })
  res.end(JSON.stringify(data))
}

function checkToken(req) {
  const auth = req.headers['authorization']
  if (!auth) return null
  try {
    return jwt.verify(auth.split(' ')[1], SECRET_KEY)
  } catch {
    return null
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJSON(res, 200, {})
    return
  }
  let url = req.url;
  if (url === '/' && req.method === 'GET') {
    let data = fs.readFileSync(path.join(__dirname, 'index.html'))
    res.end(data)

    return
  }
  if (url === '/style.css' && req.method === 'GET') {
    let data = fs.readFileSync(path.join(__dirname, 'style.css'))
    res.end(data)

    return
  }
  if (url === '/scipt.js' && req.method === 'GET') {
    let data = fs.readFileSync(path.join(__dirname, 'script.js'))
    res.end(data)

    return
  }


  if (url === '/register' && req.method === 'POST') {
    const body = await getBody(req)
    const { username, password } = body

    if (!username || !password) {
      sendJSON(res, 400, { error: 'Введи логін і пароль' })
      return
    }

    const hash = await bcrypt.hash(password, 10)

    db.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hash],
      (err) => {
        if (err) {
          sendJSON(res, 400, { error: 'Користувач вже існує' })
          return
        }
        sendJSON(res, 200, { message: 'Реєстрація успішна!' })
      }
    )
    return
  }
  if (url === '/login' && req.method === 'POST') {
    const body = await getBody(req)
    const { username, password } = body

    db.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
      async (err, results) => {
        if (err || results.length === 0) {
          sendJSON(res, 400, { error: 'Користувача не знайдено' })
          return
        }

        const user = results[0]
        const match = await bcrypt.compare(password, user.password)

        if (!match) {
          sendJSON(res, 400, { error: 'Невірний пароль' })
          return
        }

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY)
        sendJSON(res, 200, { token })
      }
    )
    return
  }
  if (url === '/jokes' && req.method === 'GET') {
    const user = checkToken(req)

    if (!user) {
      sendJSON(res, 401, { error: 'Не авторизований' })
      return
    }

    db.query(
      'SELECT * FROM saved_jokes WHERE user_id = ?',
      [user.id],
      (err, results) => {
        if (err) {
          sendJSON(res, 500, { error: 'Помилка сервера' })
          return
        }
        sendJSON(res, 200, { jokes: results })
      }
    )
    return
  }
  if (url === '/jokes' && req.method === 'POST') {
    const user = checkToken(req)

    if (!user) {
      sendJSON(res, 401, { error: 'Не авторизований' })
      return
    }

    const body = await getBody(req)
    const { joke_id, joke_text, category } = body

    db.query(
      'INSERT INTO saved_jokes (user_id, joke_id, joke_text, category) VALUES (?, ?, ?, ?)',
      [user.id, joke_id, joke_text, category],
      (err) => {
        if (err) {
          sendJSON(res, 400, { error: 'Жарт вже збережено' })
          return
        }
        sendJSON(res, 200, { message: 'Жарт збережено!' })
      }
    )
    return
  }
  if (url === '/jokes' && req.method === 'DELETE') {
    const user = checkToken(req)

    if (!user) {
      sendJSON(res, 401, { error: 'Не авторизований' })
      return
    }

    const body = await getBody(req)
    const { joke_id } = body

    db.query(
      'DELETE FROM saved_jokes WHERE joke_id = ? AND user_id = ?',
      [joke_id, user.id],
      (err) => {
        if (err) {
          sendJSON(res, 500, { error: 'Помилка сервера' })
          return
        }
        sendJSON(res, 200, { message: 'Жарт видалено!' })
      }
    )
    return
  }
  if (url === '/stats' && req.method === 'GET') {
    const user = checkToken(req)

    if (!user) {
      sendJSON(res, 401, { error: 'Не авторизований' })
      return
    }

    db.query(
      'SELECT category, COUNT(*) as count FROM saved_jokes WHERE user_id = ? GROUP BY category',
      [user.id],
      (err, results) => {
        if (err) {
          sendJSON(res, 500, { error: 'Помилка сервера' })
          return
        }
        sendJSON(res, 200, { stats: results })
      }
    )
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Not found')
  return
})

server.listen(PORT, () => {
  console.log(`Сервер працює на http://localhost:${PORT}`)
})

