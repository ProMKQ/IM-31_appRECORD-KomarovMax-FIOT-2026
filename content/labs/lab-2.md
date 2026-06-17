## Тема, мета, місце розташування сайту та звіту

**Тема:** "Створення бази даних у mysql. Підключення node.js до mysql. Робота з orm sequelize."

**Мета:**
- Навчитися створювати базу даних у MySQL.
- Освоїти виконання SQL-запитів (SELECT, INSERT, UPDATE, DELETE).
- Підключати серверну програму на Node.js до бази даних.
- Використовувати ORM Sequelize для роботи з БД.
- Реалізувати зв’язок one-to-many між таблицями.

### Посилання на виконані завдання

- Репозиторій вебзастосунку (GitHub): [посилання](https://github.com/ProMKQ/web-dev-labs)
- Власний вебзастосунок (Жива сторінка): [посилання](https://promkq.github.io/web-dev-labs/)
- Репозиторій звітного HTML-документа (GitHub): [посилання](https://github.com/ProMKQ/IM-31_appRECORD-KomarovMax-FIOT-2026)
- Звітний HTML-документ (Жива сторінка): [посилання](https://promkq.github.io/IM-31_appRECORD-KomarovMax-FIOT-2026/)

---

## 1. Теоретичні відомості та архітектура бази даних

**Предметна галузь:** Бекенд-частина системи управління завданнями (Task Tracker). Розроблено серверну частину з підключенням до реляційної бази даних для зберігання користувачів та їхніх завдань.

### Ключові технології

- **MySQL:** Реляційна система керування базами даних (RDBMS), що використовує мову SQL для роботи з даними.
- **Node.js:** Середовище виконання JavaScript, яке дозволяє створювати серверні застосунки.
- **Sequelize:** ORM (Object Relational Mapping) бібліотека для Node.js, яка дозволяє працювати з реляційними базами даних через JavaScript-об’єкти замість написання великої кількості SQL-запитів. Це технологія, яка відображає структуру реляційної бази даних у вигляді об’єктів програмування.
- **mysql2:** Сучасний драйвер для підключення застосунків на Node.js до бази даних MySQL, який Sequelize використовує для реального підключення до MySQL.

### Моделювання бази даних (ORM)

Основна ідея ORM полягає в тому, що таблиці бази даних представляються як JavaScript-класи (моделі), а рядки таблиці - як об’єкти цих класів. У проєкті реалізовано дві сутності:

1. **Модель User:** Зберігає дані користувача (`name`, `email`, `password`, `role`).
2. **Модель Task:** Представляє таблицю завдань у базі даних, містить поля (`title`, `content`, `status`, `attachmentUrl`).

**Зв'язок між таблицями:**
Реалізовано зв'язок типу **one-to-many**. Один користувач (User) може мати багато завдань (Tasks).

- У моделі User застосовано `User.hasMany(Task)`.
- У моделі Task застосовано `Task.belongsTo(User)`.
  Завдяки цьому Sequelize автоматично додає поле `userId` (Foreign Key) до таблиці завдань.

---

## 2. Структура бекенд-застосунку

Файлова структура серверної частини логічно поділена на конфігурацію, моделі даних та основний серверний файл:

- `config/database.js` - налаштування підключення до MySQL за допомогою конфігураційних змінних.
- `models/User.js` - опис структури таблиці користувачів.
- `models/Task.js` - опис структури таблиці завдань (DataTypes, обмеження).
- `models/index.js` - ініціалізація зв'язків між моделями (One-to-Many).
- `server.js` - головний файл сервера Express, який містить логіку синхронізації бази даних та CRUD-маршрути (API).

---

## 3. Приклади реалізації функціоналу

У цьому розділі подано фрагменти коду та знімки з екрана, що демонструють процес підключення до БД та реалізацію ORM Sequelize.

### 3.1. Підключення до MySQL

Для підключення використовується екземпляр `Sequelize`, який зчитує змінні оточення (пароль, хост, назву бази).

```javascript
// config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql'
    }
);

sequelize.authenticate()
    .then(() => console.log('Database connection successful.'))
    .catch(err => console.error('Database connection error:', err));
```

### 3.2. Створення моделі та типів даних

Модель - це JavaScript представлення таблиці. Для створення моделі використовується метод `sequelize.define()` , а `DataTypes` визначає набір типів даних.

```javascript
// models/Task.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
    title: {
        type: DataTypes.STRING, // текст до 255 символів
        allowNull: false        // поле обов’язкове
    },
    status: {
        type: DataTypes.ENUM('pending', 'in-progress', 'done'),
        defaultValue: 'pending'
    }
    // ... інші поля
});

module.exports = Task;
```

**Скриншот БД:**

![Database screenshot](/assets/labs/lab-2/db.png)

### 3.3. Синхронізація та виконання CRUD запитів (API)

Щоб Sequelize створив таблиці, виконується синхронізація (`sequelize.sync({ alter: true })`) у файлі `server.js`. Крім того, налаштовано REST API для виконання базових запитів.

**Отримання записів (READ / SELECT):** Отримати всі пости. Метод `findAll` конвертується системою у `SELECT * FROM Tasks`.

```javascript
app.get('/tasks', async (req, res) => {
    try {
        // Отримати пости разом з користувачем (SQL JOIN)
        const tasks = await Task.findAll({ include: User }); 
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

**Створення запису (CREATE / INSERT):** Створення нового поста. Використовує метод `Task.create()`.

```javascript
app.post('/tasks', async (req, res) => {
    try {
        const newTask = await Task.create({
            title: req.body.title,
            status: req.body.status || 'pending',
            userId: 1
        });
        res.status(201).json(newTask);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

**Візуалізація отриманих даних на клієнті:**
Клієнтський скрипт `app.js` виконує асинхронний запит до API (`fetch('http://localhost:3000/tasks')`) та генерує картки.

![Website screenshot](/assets/labs/lab-2/website.png)

---

## 4. Висновки

У ході виконання лабораторної роботи було створено реляційну базу даних MySQL та успішно інтегровано її із серверним застосунком на базі Node.js. Замість написання сирих SQL-запитів було використано сучасний підхід за допомогою ORM Sequelize.

Було спроєктовано структуру бази даних шляхом створення моделей `User` та `Task`, а також налаштовано зв'язок "один-до-багатьох". У головному файлі сервера реалізовано CRUD-операції, які через методи Sequelize (`findAll`, `create`, `update`, `destroy`) автоматично трансформуються у відповідні SQL-запити (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). Дані, отримані з бази даних, успішно передаються на клієнтську частину через налаштовані API-ендпоінти та динамічно рендеряться у вигляді карток завдань.