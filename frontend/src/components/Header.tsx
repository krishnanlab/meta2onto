const { VITE_TITLE: title } = import.meta.env;

/** nav bar links */
const links = [{ name: "About", href: "/about" }];

const Header = () => (
  <header className="bg-dark flex flex-wrap items-center justify-between gap-4 p-4 text-white">
    <a
      href="/"
      className="hover:text-light! p-2 text-2xl tracking-wider text-white! no-underline!"
    >
      {title}
    </a>

    <nav className="flex gap-4 text-xl">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="hover:text-light! p-2 text-white! no-underline!"
        >
          {link.name}
        </a>
      ))}
    </nav>
  </header>
);

export default Header;
