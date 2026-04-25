/**
 * Optimiza public/logo_imss.png:
 *   - Respaldo a public/logo_imss-original.png si no existe ya.
 *   - Sobrescribe public/logo_imss.png con versión 1x (max 512px lado mayor).
 *   - Genera public/logo_imss@2x.png con versión 2x (max 1024px lado mayor).
 *
 * Mantiene aspect ratio y canal alfa. Usa sharp con compresión PNG agresiva.
 */
const path = require("node:path")
const { existsSync, copyFileSync, statSync } = require("node:fs")
const sharp = require("sharp")

const PUBLIC = path.join(process.cwd(), "public")
const SOURCE = path.join(PUBLIC, "logo_imss.png")
const BACKUP = path.join(PUBLIC, "logo_imss-original.png")
const OUT_1X = path.join(PUBLIC, "logo_imss.png")
const OUT_2X = path.join(PUBLIC, "logo_imss@2x.png")

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`No existe ${SOURCE}`)
    process.exit(1)
  }

  // Respaldo del original (solo la primera vez).
  if (!existsSync(BACKUP)) {
    copyFileSync(SOURCE, BACKUP)
    console.log(`✓ respaldo creado: ${path.basename(BACKUP)} (${statSync(BACKUP).size} bytes)`)
  } else {
    console.log(`· respaldo ya existe, no se sobrescribe`)
  }

  const meta = await sharp(BACKUP).metadata()
  console.log(`origen: ${meta.width}×${meta.height} ${meta.channels}ch (${meta.hasAlpha ? "alpha" : "no alpha"})`)

  // PNG palette + agresiva compresión. effort máximo (10) para mejor ratio.
  const baseEncoder = {
    compressionLevel: 9,
    palette: true,
    quality: 80,
    effort: 10,
  }

  await sharp(BACKUP)
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .png(baseEncoder)
    .toFile(OUT_2X)

  await sharp(BACKUP)
    .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
    .png(baseEncoder)
    .toFile(OUT_1X)

  for (const f of [OUT_1X, OUT_2X]) {
    const m = await sharp(f).metadata()
    const kb = (statSync(f).size / 1024).toFixed(1)
    console.log(`✓ ${path.basename(f)}  ${m.width}×${m.height}  ${m.channels}ch  ${kb} KB`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
