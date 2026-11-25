/**
 * Multipart body size ceiling for POST /api/zim/upload.
 *
 * The global bodyparser multipart limit (110mb) is sized for Knowledge Base
 * uploads. ZIM sideloads are multi-GB archives; the uploader UI advertises up
 * to 20 GB. The ZimController passes this value to
 * `request.multipart.process({ limit })`, which overrides the global ceiling
 * for that stream only (AdonisJS Multipart.#processConfig).
 *
 * Keep this at or above the UI claim in ZimUploader so a >110 MB .zim does not
 * fail with E_REQUEST_ENTITY_TOO_LARGE after the user waited through the transfer.
 */
export const ZIM_UPLOAD_MULTIPART_LIMIT = '25gb'
