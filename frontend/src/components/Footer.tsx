const { VITE_LAB: lab } = import.meta.env;

const Footer = () => (
  <footer className="bg-dark p-8 text-center text-white">
    &copy; 2025 {lab}
  </footer>
);

export default Footer;
