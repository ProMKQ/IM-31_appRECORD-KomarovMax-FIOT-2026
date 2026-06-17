## Тема, мета, місце розташування сайту та звіту

**Тема:** Розширені можливості Node.js-додатків: логування, завантаження файлів, моніторинг продуктивності.

**Мета:** Ознайомитися з розширеними можливостями серверних застосунків на базі Node.js, а саме:

- реалізацією логування запитів і подій.
- організацією завантаження файлів на сервер.
- моніторингом продуктивності застосунку.

### Посилання на виконані завдання

- Репозиторій вебзастосунку (GitHub): [посилання](https://github.com/ProMKQ/web-dev-labs)
- Власний вебзастосунок (Жива сторінка): [посилання](https://promkq.github.io/web-dev-labs/)
- Репозиторій звітного HTML-документа (GitHub): [посилання](https://github.com/ProMKQ/IM-31_appRECORD-KomarovMax-FIOT-2026)
- Звітний HTML-документ (Жива сторінка): [посилання](https://promkq.github.io/IM-31_appRECORD-KomarovMax-FIOT-2026/)

---

## 1. Теоретичні відомості та аналіз

### 1.1 Логування в Node.js

Логування - це процес фіксації подій у системі, таких як запити, помилки або дії користувача. Хороше логування є структурованим, має різні рівні (info, warn, error, debug) та записує дані у файл.

- **Morgan:** Автоматично записує всі HTTP-запити до сервера, фіксуючи метод, шлях, статус та час виконання.
- **Winston:** Використовується для гнучкого та професійного логування, дозволяючи записувати події та помилки в різні файли.

### 1.2 Завантаження файлів

Для обробки файлів у Node.js використовують middleware, найпопулярнішим з яких є Multer. Коли файл надсилається, він приходить у спеціальному складному форматі `multipart/form-data`. Multer читає файл із запиту, витягує його, зберігає на сервер і додає інформацію про файл у об'єкт `req`.

### 1.3 Моніторинг продуктивності

Моніторинг продуктивності - це процес спостереження за тим, як працює сервер або додаток у реальному часі. Його мета - виявити "вузькі місця", оцінити стабільність та запобігти збоям.
Основні інструменти:

- **process:** Вбудований стандартний модуль для базового аналізу (доступ до пам'яті, процесора, uptime).
- **PM2:** Популярний менеджер процесів для повноцінного моніторингу в реальному часі, який має графічний інтерфейс у консолі.

---

## 2. Структура бекенду вебзастосунку

Файлова структура розширена для підтримки нових middleware, конфігурацій логерів та завантажень.

Організація файлової структури:

- `server.js` - головний файл конфігурації Express-сервера та підключення middleware.
- `middlewares/logger.js` - конфігурація Winston для логування подій.
- `middlewares/responseTime.js` - кастомний middleware для вимірювання часу обробки запитів.
- `middlewares/upload.js` - конфігурація Multer для завантаження файлів із валідацією.
- `routes/systemRoutes.js` - endpoint для моніторингу статусу сервера (`/status`).
- `routes/taskRoutes.js` - роути завдань, що включають завантаження файлів до конкретних тасок.

---

## 3. Приклади реалізації елементів

### 3.1. Логування HTTP-запитів та подій

Для логування запитів до сервера підключено **Morgan** у режимі `dev`, а також реалізовано професійне файлове логування через **Winston**.

Конфігурація `Winston` розмежовує логування на загальні інформаційні події та помилки:

```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/app.log' }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
    ]
});
module.exports = logger;
```

Для вимірювання часу відповіді сервера було створено власний middleware:

```javascript
// responseTime.js
const logger = require('./logger');

module.exports = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    next();
};
```

**Результати логування:**

*Логи Morgan (HTTP-запити в консолі):*

![Morgan Logs](/assets/labs/lab-4/morgan-logs.png)

*Файлові логи Winston (app.log):*

![Winston App Logs](/assets/labs/lab-4/winston-app-logs.png)

*Файлові логи Winston (error.log):*

![Winston Error Logs](/assets/labs/lab-4/winston-error-logs.png)

### 3.2. Обробка та завантаження файлів

Реалізовано завантаження одного файлу (додатку до завдання) за допомогою Multer. Додано кастомне збереження та сувору валідацію: дозволено лише формати `jpg`, `png`, `pdf` та встановлено ліміт розміру у 2 МБ.

```javascript
// upload.js
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file format. Only JPG, PNG, or PDF are allowed.'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});
```

Обробник на бекенді приймає файл та закріплює його URL за конкретним завданням:

```javascript
// taskRoutes.js
router.post('/:id/attachment', upload.single('file'), async (req, res, next) => {
    try {
        // ... логіка перевірки та збереження шляху файлу в БД
        res.json({ message: 'File uploaded successfully', fileUrl: req.file.path });
    } catch (error) {
        next(error);
    }
});
```

**Процес завантаження в інтерфейсі:**

*Вибір файлу:*

![Upload File 1](/assets/labs/lab-4/upload-file-1.png)

*Успішно завантажений файл (відображення посилання):*

![Upload File 2](/assets/labs/lab-4/upload-file-2.png)

### 3.3. Моніторинг продуктивності

Для відстеження стану сервера створено спеціальний маршрут `/status`, який використовує вбудований об'єкт `process`:

```javascript
// systemRoutes.js
const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
    res.json({
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
    });
});
```

Крім того, роботу застосунку було запущено через менеджера процесів **PM2**, що дозволяє в реальному часі відстежувати використання CPU та оперативної пам'яті.

**Інтерактивна панель моніторингу PM2:**

![PM2 Monitoring](/assets/labs/lab-4/pm2-monit.png)

---

## 4. Висновки

У ході виконання лабораторної роботи було успішно інтегровано розширені можливості до Node.js застосунку. Було реалізовано структуроване логування подій за допомогою бібліотек Morgan та Winston, що забезпечує запис інформаційних повідомлень та помилок у лог-файли.

Систему було розширено функціоналом безпечного завантаження файлів завдяки middleware Multer, з упровадженням фільтрації за типом файлу (`jpg`, `png`, `pdf`) та обмеженням на розмір.

Окрім цього, упроваджено моніторинг продуктивності: створено API-ендпоінт для отримання базових метрик через вбудований модуль `process` (uptime, використання пам'яті). Моніторинг продуктивності дозволяє контролювати стан сервера, виявляти проблеми та оптимізувати роботу системи. Для повноцінного спостереження та безперебійної роботи застосунок був розгорнутий за допомогою менеджера процесів PM2.