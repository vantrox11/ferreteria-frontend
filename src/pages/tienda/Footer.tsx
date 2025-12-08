import React from 'react';

export function FooterPage() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-4">Ferretería Online</h3>
          <p className="text-gray-400 mb-2">
            Tu tienda online de confianza para herramientas y materiales.
          </p>
          <p className="text-gray-400">Dirección: Av. Principal 123, Ciudad</p>
          <p className="text-gray-400">Teléfono: +51 123 456 789</p>
          <p className="text-gray-400">Email: contacto@ferreteria.com</p>
        </div>

        {/* Enlaces rápidos */}
        <div>
          <h4 className="text-white text-lg font-semibold mb-4">Enlaces rápidos</h4>
          <ul>
            <li>
              <a
                href="/"
                className="hover:text-white transition-colors duration-200"
              >
                Inicio
              </a>
            </li>
            <li>
              <a
                href="/tienda"
                className="hover:text-white transition-colors duration-200"
              >
                Productos
              </a>
            </li>
            <li>
              <a
                href="/contacto"
                className="hover:text-white transition-colors duration-200"
              >
                Contacto
              </a>
            </li>
          </ul>
        </div>

        {/* Redes Sociales */}
        <div>
          <h4 className="text-white text-lg font-semibold mb-4">Síguenos</h4>
          <div className="flex space-x-6">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-white transition-colors duration-200"
            >
              <svg
                fill="currentColor"
                className="w-6 h-6"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9v-2.89h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 16.99 22 12z" />
              </svg>
            </a>

            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="hover:text-white transition-colors duration-200"
            >
              <svg
                fill="currentColor"
                className="w-6 h-6"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M23 3a10.9 10.9 0 01-3.14.86 4.48 4.48 0 001.98-2.48 9.15 9.15 0 01-2.91 1.1 4.52 4.52 0 00-7.72 4.12A12.82 12.82 0 013 4.7a4.5 4.5 0 001.4 6.03 4.52 4.52 0 01-2.05-.56v.06a4.52 4.52 0 003.63 4.43 4.48 4.48 0 01-2.04.08 4.52 4.52 0 004.21 3.13A9.05 9.05 0 013 19.54a12.8 12.8 0 006.92 2.03c8.3 0 12.84-6.88 12.84-12.83 0-.2 0-.42-.01-.63A9.22 9.22 0 0023 3z" />
              </svg>
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-white transition-colors duration-200"
            >
              <svg
                fill="currentColor"
                className="w-6 h-6"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5A4.25 4.25 0 007.75 20.5h8.5a4.25 4.25 0 004.25-4.25v-8.5A4.25 4.25 0 0016.25 3.5h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm5.25-.88a1.12 1.12 0 11-2.24 0 1.12 1.12 0 012.24 0z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Derechos */}
      <div className="mt-10 border-t border-gray-700 pt-6 text-center text-gray-500 text-sm select-none">
        &copy; {new Date().getFullYear()} Ferretería Online. Todos los derechos reservados.
      </div>
    </footer>
  );
}
