import { ShoppingCart } from "lucide-react";
import Button from "@/components/Button";

const { VITE_TITLE: title } = import.meta.env;

const Header = () => (
  <header className="bg-dark flex flex-wrap items-center justify-between gap-4 p-4 text-white">
    <a
      href="/"
      className="hover:text-light! p-2 text-2xl tracking-wider text-white!"
    >
      {title}
    </a>

    <nav className="flex gap-4 text-xl">
      <Button to="/about" className="text-white!">
        About
      </Button>
      <Button to="/cart" color="primary" aria-label="Data cart">
        <ShoppingCart />
        <span>Cart</span>
      </Button>
    </nav>
  </header>
);

export default Header;
