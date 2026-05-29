# GearCraft

GearCraft - full-stack вебзастосунок інтернет-магазину техніки та аксесуарів. Проєкт має клієнтську частину на React/Vite і серверну частину на Express з PostgreSQL.

## Можливості

- каталог товарів із детальною сторінкою товару;
- реєстрація, авторизація та профіль користувача;
- кошик, обране та синхронізація стану магазину для авторизованих користувачів;
- оформлення замовлення з вибором доставки й оплати;
- перегляд власних замовлень;
- адмін-панель для керування товарами та замовленнями;
- відгуки до товарів;
- завантаження зображень товарів у Cloudinary;
- відновлення пароля через email.

## Технології

### Client

- React 19
- TypeScript
- Vite
- React Router
- Zustand
- Axios
- React Hook Form
- Zod
- Tailwind CSS

### Server

- Node.js
- Express
- TypeScript
- PostgreSQL
- JWT
- bcryptjs
- Multer
- Cloudinary
- Nodemailer

## Структура проєкту

```text
GearCraft/
  client/          React-застосунок
  server/          Express API
  images/          зображення проєкту
```

## Вимоги

- Node.js 20 або новіше
- npm
- PostgreSQL
- акаунт Cloudinary для завантаження зображень
- SMTP-доступ або Mailtrap для тестування email

## Налаштування

### 1. Встановіть залежності

```bash
cd client
npm install

cd ../server
npm install
```

### 2. Налаштуйте змінні середовища сервера

У папці `server` створіть файл `.env` на основі `env.example`:

```bash
cd server
copy env.example .env
```

Приклад `.env`:

```env
DATABASE_URL=postgres://user:password@localhost:5432/gearcraft
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
PGSSLMODE=disable

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
MAIL_FROM=GearCraft <noreply@gearcraft.test>
```

Сервер автоматично створює необхідні таблиці PostgreSQL під час старту, якщо база даних уже існує.

### 3. Налаштуйте змінні середовища клієнта

У папці `client` за потреби створіть `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Якщо файл не створювати, клієнт використовуватиме `http://localhost:5000/api` за замовчуванням.

## Запуск у режимі розробки

Запустіть сервер:

```bash
cd server
npm run dev
```

API буде доступне на:

```text
http://localhost:5000/api
```

Запустіть клієнт в іншому терміналі:

```bash
cd client
npm run dev
```

Клієнт буде доступний на:

```text
http://localhost:5173
```

## Скрипти

### Client

```bash
npm run dev       # запуск Vite dev server
npm run build     # production build
npm run lint      # перевірка ESLint
npm run preview   # перегляд production build
```

### Server

```bash
npm run dev       # запуск сервера через nodemon і ts-node
npm run build     # компіляція TypeScript у dist
npm start         # запуск скомпільованого сервера
```

## Основні API-маршрути

```text
GET    /api/health

POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/me
PUT    /api/auth/me/password
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/products/:id/reviews
POST   /api/products/:id/reviews
DELETE /api/products/:id/reviews/:reviewId

POST   /api/orders
GET    /api/orders/my
GET    /api/orders/admin/all
PUT    /api/orders/:id/status
DELETE /api/orders/:id

GET    /api/shop
POST   /api/shop/sync
POST   /api/shop/favorites/:productId/toggle
PUT    /api/shop/cart/:productId
DELETE /api/shop/cart

POST   /api/upload
```

Частина маршрутів доступна лише авторизованим користувачам або адміністраторам. Для захищених запитів потрібно передавати JWT у заголовку:

```text
Authorization: Bearer <token>
```

## Адміністратор

Нові користувачі створюються з роллю `user`. Щоб надати доступ до адмін-панелі, змініть роль користувача в базі даних:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'admin@example.com';
```

Після цього адмін-панель буде доступна за маршрутом:

```text
http://localhost:5173/admin
```

## Production build

Зберіть клієнт:

```bash
cd client
npm run build
```

Зберіть сервер:

```bash
cd server
npm run build
npm start
```

Перед production-запуском вкажіть реальні значення `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, Cloudinary та SMTP-змінних.

## Примітки

- PostgreSQL-схема створюється в `server/src/config/db.ts`.
- Клієнт очікує, що API доступне за адресою з `VITE_API_URL`.
- Зображення товарів завантажуються у папку `ecom-products` в Cloudinary.
- Email для відновлення пароля надсилається через SMTP або Mailtrap.
