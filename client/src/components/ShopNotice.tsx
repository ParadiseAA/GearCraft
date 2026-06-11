import { useEffect } from "react";
import { TiTimes } from "react-icons/ti";
import { useShopStore } from "../store/shopStore";

export default function ShopNotice() {
  const notice = useShopStore((state) => state.notice);
  const clearNotice = useShopStore((state) => state.clearNotice);

  useEffect(() => {
    if (!notice) return;

    const timeoutId = window.setTimeout(() => {
      clearNotice(notice.id);
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [clearNotice, notice]);

  if (!notice) return null;

  return (
    <div className="fixed right-4 top-4 z-[1300] w-[calc(100%-2rem)] max-w-sm rounded-xl border border-[#f0c7ad] bg-[#fff4eb] p-4 pr-12 text-sm font-semibold text-[#a64e0d] shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
      <p>{notice.message}</p>
      <button
        type="button"
        onClick={() => clearNotice(notice.id)}
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#a64e0d] transition hover:bg-white/70"
        aria-label="Закрити повідомлення"
      >
        <TiTimes className="text-[20px]" />
      </button>
    </div>
  );
}
