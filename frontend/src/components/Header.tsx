import { useAtomValue } from "jotai";
import { ShoppingCart } from "lucide-react";
import { cartAtom } from "@/cart";
import Button from "@/components/Button";
import Logo from "@/components/Logo";

const { VITE_TITLE: title } = import.meta.env;

export default function () {
  const cart = useAtomValue(cartAtom);

  return (
    <header className="bg-theme-dark flex flex-col flex-wrap items-center justify-between gap-4 p-4 text-white sm:flex-row">
      <a
        href="/"
        className="hover:text-theme-light! flex items-center gap-2 p-2 text-2xl tracking-wider text-white!"
      >
        <Logo color="currentColor" className="h-8" />
        {title}
      </a>

      <nav className="flex flex-wrap items-center justify-center gap-4 text-xl">
        <Button to="/about" color="none" className="text-current!">
          About
        </Button>
        <Button to="/search" color="none" className="text-current!">
          Search
        </Button>
        <Button
          to="/cart"
          color="accent"
          aria-label="Data cart"
          className="relative"
        >
          <ShoppingCart />
          Cart
          {!!cart.studies.length && (
            <div className="bg-theme-light absolute -top-2 -right-2 grid size-5 place-items-center rounded-full text-sm leading-none text-black">
              {cart.studies.length}
            </div>
          )}
        </Button>
      </nav>
    </header>
  );
}
