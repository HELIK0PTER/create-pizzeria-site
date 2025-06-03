"use client";

import { useState, useRef } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Card, CardContent } from "./card";
import { Alert, AlertDescription } from "./alert";
import { Upload, X, Loader2, Link } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
  disabled?: boolean;
  maxSize?: number; // en MB
  acceptedTypes?: string[];
}

export function ImageUpload({
  onUpload,
  currentImage,
  disabled = false,
  maxSize = 5, // 5MB par défaut
  acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
}: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError("");
    setIsLoading(true);

    // Validation de la taille
    if (file.size > maxSize * 1024 * 1024) {
      setError(`L'image ne doit pas dépasser ${maxSize}MB`);
      setIsLoading(false);
      return;
    }

    // Validation du type
    if (!acceptedTypes.includes(file.type)) {
      setError("Format d'image non supporté. Utilisez JPG, PNG ou WebP.");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload");
      }

      const { url } = await response.json();
      onUpload(url);
    } catch (err) {
      setError("Erreur lors de l'upload de l'image : " + err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Empêcher la propagation vers le formulaire parent
    
    if (!urlInput.trim()) {
      setError('Veuillez saisir une URL')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const url = new URL(urlInput.trim())
      
      // Test de chargement de l'image
      const img = new window.Image()
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = () => reject(new Error('Impossible de charger l\'image'))
        img.src = url.toString()
        
        // Timeout après 10 secondes
        setTimeout(() => reject(new Error('Timeout - l\'image met trop de temps à charger')), 10000)
      })
      
      console.log('Image chargée avec succès:', url.toString()) // Debug
      onUpload(url.toString())
      setUrlInput('')
    } catch (err: unknown) {
      console.error('Erreur chargement image:', err) // Debug
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'image'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (uploadMode !== "file") return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    if (uploadMode === "file") {
      fileInputRef.current?.click();
    }
  };

  const removeImage = () => {
    onUpload("");
  };

  return (
    <div className="space-y-4">
      <Label>Image du produit</Label>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Onglets de sélection du mode */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setUploadMode("file")}
          className={cn(
            "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
            uploadMode === "file"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Upload className="h-4 w-4 inline mr-2" />
          Upload fichier
        </button>
        <button
          type="button"
          onClick={() => setUploadMode("url")}
          className={cn(
            "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
            uploadMode === "url"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Link className="h-4 w-4 inline mr-2" />
          URL d'image
        </button>
      </div>

      {/* Affichage de l'image actuelle */}
      {currentImage && (
        <Card>
          <CardContent className="p-4">
            <div className="relative group">
              <img
                src={currentImage}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeImage}
                  disabled={disabled}
                >
                  <X className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode Upload de fichier */}
      {uploadMode === "file" && !currentImage && (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-gray-300",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <CardContent className="p-8 text-center">
            {isLoading ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-gray-600">Upload en cours...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Upload className="h-8 w-8 text-gray-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Cliquez pour choisir une image ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG ou WebP (max {maxSize}MB)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mode URL */}
      {uploadMode === 'url' && !currentImage && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto">
                  <Link className="h-8 w-8 text-gray-600" />
                </div>
                <p className="text-sm font-medium mt-3 mb-1">
                  Saisir l'URL d'une image
                </p>
                <p className="text-xs text-gray-500">
                  Collez l'URL complète de votre image
                </p>
              </div>
              
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-xxx"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={disabled || isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleUrlSubmit(e as any)
                    }
                  }}
                />
              </div>
              
              <Button 
                type="button"
                onClick={(e) => handleUrlSubmit(e as any)}
                className="w-full"
                disabled={disabled || !urlInput.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test de l'image...
                  </>
                ) : (
                  'Utiliser cette image'
                )}
              </Button>
              
              {/* Debug info */}
              {urlInput && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Debug:</strong> {urlInput}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input fichier caché */}
      <Input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
 