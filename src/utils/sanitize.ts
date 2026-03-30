import DOMPurify from 'dompurify';

/**
 * Devuelve un objeto seguro para usar con dangerouslySetInnerHTML.
 * Elimina cualquier script o atributo peligroso del HTML antes de renderizarlo.
 *
 * @param {string} dirty - HTML potencialmente inseguro
 * @returns {{ __html: string }}
 */
export function safeHtml(dirty: string | null | undefined): { __html: string } {
  return { __html: DOMPurify.sanitize(dirty ?? '') };
}
