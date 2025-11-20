const { VITE_LAB: lab } = import.meta.env;

export default function Footer() {
  return (
    <footer className="bg-theme-dark p-8 text-center text-white">
      &copy; 2025 {lab}
    </footer>
  );
}
