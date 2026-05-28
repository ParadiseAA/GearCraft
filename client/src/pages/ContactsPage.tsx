import SiteHeader from "../components/SiteHeader";

const contacts = [
  {
    label: "Підтримка",
    value: "вул. Сонячна, 15, кв. 24, Київ, 03150, Україна",
  },
  {
    label: "Email",
    value: "gearcraft@gmail.com",
    href: "mailto:gearcraft@gmail.com",
  },
  {
    label: "Phone",
    value: "+380 44 123 4567",
    href: "tel:+380441234567",
  },
];

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-white text-[#171612]">
      <SiteHeader searchPlaceholder="Пошук товарів..." />

      <main className="mx-auto max-w-[1320px] px-4 py-8 lg:px-6">
        <h1 className="text-3xl font-black tracking-[-0.03em]">Контакти</h1>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {contacts.map((contact) => (
            <article
              key={contact.label}
              className="rounded-lg border border-[#eadfd3] bg-white p-6"
            >
              <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#8b7b6d]">
                {contact.label}
              </h2>
              {contact.href ? (
                <a
                  href={contact.href}
                  className="mt-3 block text-[15px] font-semibold leading-6 text-[#3c4a5f] transition hover:text-[#ff7a1a]"
                >
                  {contact.value}
                </a>
              ) : (
                <p className="mt-3 text-[15px] font-semibold leading-6 text-[#3c4a5f]">
                  {contact.value}
                </p>
              )}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
