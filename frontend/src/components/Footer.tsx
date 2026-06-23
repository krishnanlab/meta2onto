import Link from "@/components/Link";

const { VITE_LAB: lab } = import.meta.env;

export default function Footer() {
  return (
    <footer className="flex justify-start gap-8 bg-theme-dark p-8 text-center text-white">
      <div>&copy; 2026 {lab}</div>
      <Link to="/terms" className="text-white">
        Terms and Conditions
      </Link>
    </footer>
  );
}
