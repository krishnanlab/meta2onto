import { useAtomValue } from "jotai";
import { ShoppingCart } from "lucide-react";
import { cartAtom } from "@/cart";
import Button from "@/components/Button";

const { VITE_TITLE: title } = import.meta.env;

const Header = () => {
  const cart = useAtomValue(cartAtom);

  return (
    <header className="bg-theme-dark flex flex-wrap items-center justify-between gap-4 p-4 text-white">
      <a
        href="/"
        className="hover:text-theme-light! p-2 text-2xl tracking-wider text-white!"
      >
        {title}
      </a>

      <nav className="flex gap-4 text-xl">
        <Button to="/about" color="none">
          About
        </Button>
        <Button to="/search" color="none">
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
          {!!cart.items.length && (
            <div className="bg-theme-light absolute -top-2 -right-2 grid size-5 place-items-center rounded-full text-sm leading-none text-black">
              {cart.items.length}
            </div>
          )}
        </Button>
      </nav>
    </header>
  );
};

export default Header;
