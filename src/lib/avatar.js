/**
 * Avatar padrão do sistema Mindly.
 *
 * Todos os componentes que precisam exibir um avatar devem importar
 * getAvatarUrl() deste módulo — nunca usar i.pravatar.cc, ui-avatars.com
 * ou qualquer serviço externo que gere imagens dinâmicas ou aleatórias.
 *
 * Para trocar o avatar padrão do sistema: altere apenas DEFAULT_AVATAR.
 */
export const DEFAULT_AVATAR = "/images/default-avatar.svg";

/**
 * Retorna a URL do avatar a ser exibido para o usuário.
 * Se o usuário tiver uma foto personalizada, usa ela.
 * Caso contrário, retorna o avatar padrão fixo.
 *
 * @param {string|null|undefined} photo - URL da foto salva no banco (profiles.photo)
 * @returns {string} URL do avatar a renderizar
 */
export function getAvatarUrl(photo) {
  return photo || DEFAULT_AVATAR;
}
