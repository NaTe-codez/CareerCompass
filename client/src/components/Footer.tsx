export default function Footer() {
  return (
    <footer className="mt-auto py-6 bg-white dark:bg-dark-200 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} CareerHelpAI. All rights reserved.</p>
      </div>
    </footer>
  );
}
