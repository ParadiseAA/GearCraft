import SiteHeader from "../components/SiteHeader";

const policyBlocks = [
  {
    title: "Які дані ми збираємо",
    text: "Ім'я, телефон, email, адресу доставки та інформацію про замовлення, яку ви передаєте під час оформлення покупки.",
  },
  {
    title: "Для чого використовуємо",
    text: "Щоб оформити замовлення, зв'язатися з вами для підтвердження деталей, організувати доставку та покращувати сервіс.",
  },
  {
    title: "Зберігання",
    text: "Дані зберігаються лише в межах, потрібних для обробки замовлень і підтримки клієнтів.",
  },
  {
    title: "Передача третім сторонам",
    text: "Ми не продаємо персональні дані. Інформація може передаватися службам доставки тільки для виконання вашого замовлення.",
  },
  {
    title: "Ваші права",
    text: "Ви можете звернутися до нас, щоб уточнити, оновити або видалити персональні дані, які стосуються вашого акаунта чи замовлення.",
  },
  {
    title: "Контакти",
    text: "З питань конфіденційності пишіть на gearrecraft@gmail.com або телефонуйте +380 44 123 4567.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук товарів..." />

      <main className="mx-auto max-w-[1320px] px-4 py-8 lg:px-6">
        <h1 className="text-3xl font-black tracking-[-0.03em]">
          Політика конфіденційності
        </h1>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {policyBlocks.map((block) => (
            <article
              key={block.title}
              className="rounded-lg border border-[#eadfd3] bg-white p-6"
            >
              <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#8b7b6d]">
                {block.title}
              </h2>
              <p className="mt-3 text-[15px] font-semibold leading-6 text-[#3c4a5f]">
                {block.text}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
