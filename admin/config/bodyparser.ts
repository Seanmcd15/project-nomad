import { defineConfig } from '@adonisjs/core/bodyparser'

const bodyParserConfig = defineConfig({
  /**
   * The bodyparser middleware will parse the request body
   * for the following HTTP methods.
   */
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * Config for the "application/x-www-form-urlencoded"
   * content-type parser
   */
  form: {
    convertEmptyStringsToNull: true,
    types: ['application/x-www-form-urlencoded'],
  },

  /**
   * Config for the JSON parser
   */
  json: {
    convertEmptyStringsToNull: true,
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },

  /**
   * Config for the "multipart/form-data" content-type parser.
   * File uploads are handled by the multipart parser.
   */
  multipart: {
    /**
     * Enabling auto process allows bodyparser middleware to
     * move all uploaded files inside the tmp folder of your
     * operating system
     */
    autoProcess: true,
    convertEmptyStringsToNull: true,
    processManually: ['/api/zim/upload'],

    /**
     * Maximum limit of data to parse including all files
     * and fields. Sized for Knowledge Base uploads (~100 MB).
     * ZIM sideloads (`/api/zim/upload`, processManually) override this
     * per-request via `multipart.process({ limit: ZIM_UPLOAD_MULTIPART_LIMIT })`
     * — do not raise the global ceiling just for ZIMs.
     */
    limit: '110mb', // Set to 110MB to allow for some overhead beyond the 100MB file size limit
    types: ['multipart/form-data'],
  },
})

export default bodyParserConfig
