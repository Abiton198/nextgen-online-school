import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="w-full text-center text-gray-500 py-4 border-t">
      <span>© 2025 Nextgen</span>
      <Link
        to="/admin-login"
        className="ml-2 cursor-pointer text-xs text-gray-400 hover:text-gray-700"
      >
        c 2025 Nextgen
      </Link>
    </footer>
  );
};
