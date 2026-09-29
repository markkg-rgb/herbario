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
  /*
   * BASE DE DATOS COMPARTIDA: FIREBASE (Firestore)
   * Consola de Firebase → Configuración del proyecto → General.
   * Las reglas de seguridad están en firestore.rules.
   */
  FIREBASE_PROYECTO: "",  // ID del proyecto, p. ej. "herbolario-1234"
  FIREBASE_KEY: "",       // "Clave de API web"

  /* Alternativa: Supabase (solo se usa si Firebase está vacío) */
  SUPABASE_URL: "",   // p. ej. "https://abcdefgh.supabase.co"
  SUPABASE_KEY: "",   // la "anon public key"
  // false = cualquiera con la app puede añadir/editar (modo abierto)
  CLAVE_REQUERIDA: false,

  /*
   * IDENTIFICACIÓN POR FOTO (Pl@ntNet)
   * Clave gratuita en https://my.plantnet.org (cuenta → API key).
   * En la misma página, añade "markkg-rgb.github.io" como dominio
   * autorizado para que solo funcione desde tu app.
   */
  PLANTNET_KEY: "2b10VJDauEaYiSQwAhmlLisO0",  // solo funciona desde markkg-rgb.github.io
};
