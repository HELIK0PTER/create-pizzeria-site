import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier reçu' },
        { status: 400 }
      )
    }

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé' },
        { status: 400 }
      )
    }

    // Validation de la taille (10MB max avant optimisation)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux (10MB max)' },
        { status: 400 }
      )
    }

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Générer un nom unique pour le fichier (toujours en WebP pour l'optimisation)
    const fileName = `${randomUUID()}.webp`

    // Définir le chemin de destination
    const uploadDir = join(process.cwd(), 'public/images/uploads')
    const filePath = join(uploadDir, fileName)

    // Créer le dossier s'il n'existe pas
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch {
      // Le dossier existe déjà, pas de problème
    }

    // Optimiser et redimensionner l'image avec Sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(800, 600, { 
        fit: 'inside', 
        withoutEnlargement: true 
      }) // Redimensionner max 800x600 en gardant les proportions
      .webp({ 
        quality: 85,
        effort: 4 
      }) // Convertir en WebP avec qualité 85%
      .toBuffer()

    // Écrire le fichier optimisé
    await writeFile(filePath, optimizedBuffer)

    // Retourner l'URL publique
    const url = `/images/uploads/${fileName}`

    return NextResponse.json({
      url,
      fileName,
      originalSize: file.size,
      optimizedSize: optimizedBuffer.length,
      type: 'image/webp'
    })

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'upload' },
      { status: 500 }
    )
  }
}

// Optionnel: Ajouter une méthode DELETE pour supprimer des images
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json(
        { error: 'Nom de fichier manquant' },
        { status: 400 }
      )
    }

    const filePath = join(process.cwd(), 'public/images/uploads', fileName)
    
    // Supprimer le fichier (utiliser fs.unlink)
    const { unlink } = await import('fs/promises')
    await unlink(filePath)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
} 