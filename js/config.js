/*
 * CONFIGURACIÓN DE LA BASE DE DATOS COMPARTIDA (Supabase)
 * ------------------------------------------------------------
 * Rellena estos dos valores con los de tu proyecto de Supabase
 * (Project Settings → API). Mientras estén vacíos, la app funciona
 * igual, pero las especies añadidas desde el formulario solo se
 * guardan en el dispositivo donde se crean.
 *
 * La "anon key" es pública por diseño: la seguridad la pone la
 * clave de edición configurada en supabase.sql.
 */
window.CONFIG = {
  SUPABASE_URL: "",   // p. ej. "https://abcdefgh.supabase.co"
  SUPABASE_KEY: "",   // la "anon public key"

  /*
   * IDENTIFICACIÓN POR FOTO (Pl@ntNet)
   * Clave gratuita en https://my.plantnet.org (cuenta → API key).
   * En la misma página, añade "markkg-rgb.github.io" como dominio
   * autorizado para que solo funcione desde tu app.
   */
  PLANTNET_KEY: "",
};
