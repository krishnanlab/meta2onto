import { ShoppingCart } from "lucide-react";
import Button from "@/components/Button";

const { VITE_TITLE: title } = import.meta.env;

const Header = () => (
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
      <Button to="/cart" color="accent" aria-label="Data cart">
        <ShoppingCart />
        <span>Cart</span>
      </Button>
    </nav>
  </header>
);

export default Header;
