'use client'

import { useState, useRef, useEffect, DragEvent, ChangeEvent, FormEvent } from 'react'

import dynamic from 'next/dynamic'

const LocationPickerModal = dynamic(() => import('../components/LocationPickerModal'), { ssr: false })
import { useTheme } from 'next-themes'
import Cropper, { Area } from 'react-easy-crop'

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<File | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  const maxSize = Math.max(image.width, image.height)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  canvas.width = safeArea
  canvas.height = safeArea

  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate(getRadianAngle(rotation))
  ctx.translate(-safeArea / 2, -safeArea / 2)

  ctx.drawImage(
    image,
    safeArea / 2 - image.width / 2,
    safeArea / 2 - image.height / 2
  )

  const data = ctx.getImageData(0, 0, safeArea, safeArea)

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y)
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null)
      resolve(new File([blob], 'cropped.png', { type: 'image/png' }))
    }, 'image/png', 1)
  })
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const CustomSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: {value: string, label: string}[] }) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedOption = options.find(opt => opt.value === value)

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                className={`w-full p-4 rounded-xl border ${isOpen ? 'border-brand-primary bg-white dark:bg-slate-800 ring-4 ring-brand-primary/15' : 'border-white/60 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 hover:bg-white/90 dark:hover:bg-slate-800/90'} text-brand-text text-[15px] cursor-pointer flex justify-between items-center transition-all duration-300`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-medium">{selectedOption?.label}</span>
                <i className={`bx bx-chevron-down text-xl text-brand-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-primary' : ''}`}></i>
            </div>
            
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-white/60 dark:border-slate-600 overflow-hidden z-[100]">
                    <div className="max-h-60 overflow-y-auto p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {options.map((opt) => (
                            <div 
                                key={opt.value}
                                className={`p-3 px-4 m-1 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between ${value === opt.value ? 'bg-brand-primary-soft text-brand-primary-dark font-semibold' : 'text-brand-text/80 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                onClick={() => {
                                    onChange(opt.value)
                                    setIsOpen(false)
                                }}
                            >
                                {opt.label}
                                {value === opt.value && <i className='bx bx-check text-lg'></i>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function Home() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // File state
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [originalWidth, setOriginalWidth] = useState<number | null>(null)
  const [originalHeight, setOriginalHeight] = useState<number | null>(null)
  
  // Settings state
  const [conversionType, setConversionType] = useState('png')
  const [quality, setQuality] = useState<number | string>(90)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [maintainRatio, setMaintainRatio] = useState(true)
  const [preserveMetadata, setPreserveMetadata] = useState(true)
  const [metaAuthor, setMetaAuthor] = useState('')
  const [metaCopyright, setMetaCopyright] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaSoftware, setMetaSoftware] = useState('')
  const [metaMake, setMetaMake] = useState('')
  const [metaLocation, setMetaLocation] = useState('')
  const [fileName, setFileName] = useState('')

  // UI State
  const [openSections, setOpenSections] = useState({
    output: true,
    geometry: false,
    metadata: true
  })
  
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }
  
  // Crop & Rotate state
  const [isCropping, setIsCropping] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [cropAspect, setCropAspect] = useState<number | undefined>(undefined)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  
  // Processing & Slider state
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null)
  const [compressedSize, setCompressedSize] = useState<number | null>(null)
  const [isProcessingLive, setIsProcessingLive] = useState(false)
  const [sliderPosition, setSliderPosition] = useState<number | string>(50)
  
  // UI state
  const [isDragActive, setIsDragActive] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const conversionOptions = [
      { value: 'png', label: 'PNG (Lossless)' },
      { value: 'jpg', label: 'JPEG (Lossy)' },
      { value: 'webp', label: 'WEBP (Optimized)' },
      { value: 'avif', label: 'AVIF (Next-Gen)' },
      { value: 'tiff', label: 'TIFF (High Quality)' },
      { value: 'gif', label: 'GIF' }
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
        alert('Please upload an image file.')
        return
    }
    setFile(selectedFile)
    setSliderPosition(50)
    setCompressedSize(null)

    setMetaAuthor('')
    setMetaCopyright('')
    setMetaTitle('')
    setMetaSoftware('')
    setMetaMake('')
    setMetaLocation('')

    // Set initial file name without extension
    const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name
    setFileName(nameWithoutExt)

    try {
        if (!(window as any).exifr) {
            console.error('EXIF library is not loaded yet');
        } else {
            // true enables all default parsing (TIFF, EXIF, GPS, etc.)
            const exifData = await (window as any).exifr.parse(selectedFile, true)
            console.log('Extracted EXIF Data:', exifData)
            
            if (exifData) {
                if (exifData.Artist) setMetaAuthor(exifData.Artist.toString())
                if (exifData.Copyright) setMetaCopyright(exifData.Copyright.toString())
                if (exifData.ImageDescription) setMetaTitle(exifData.ImageDescription.toString())
                if (exifData.Software) setMetaSoftware(exifData.Software.toString())
                if (exifData.Make) setMetaMake(exifData.Make.toString())
                if (exifData.latitude !== undefined && exifData.longitude !== undefined) {
                    setMetaLocation(`${exifData.latitude.toFixed(6)}, ${exifData.longitude.toFixed(6)}`)
                }
            } else {
                console.log('No EXIF metadata found in this image (many web/social media images have EXIF stripped).')
            }
        }
    } catch (e: any) {
        if (e.message && e.message.includes('Unknown file format')) {
            console.log('Image format does not support EXIF metadata (e.g., PNG or WebP). Metadata extraction skipped.');
        } else {
            console.warn('Could not parse EXIF data:', e);
        }
    }

    const reader = new FileReader()
    reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
            const dataUrl = e.target.result
            setPreview(dataUrl)
            
            // Extract dimensions
            const img = new Image()
            img.onload = () => {
                setOriginalWidth(img.width)
                setOriginalHeight(img.height)
                setWidth(img.width.toString())
                setHeight(img.height.toString())
            }
            img.src = dataUrl
        }
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleWidthChange = (val: string) => {
      setWidth(val)
      if (maintainRatio && originalWidth && originalHeight && val) {
          const num = parseInt(val)
          if (!isNaN(num)) {
              setHeight(Math.round(num * (originalHeight / originalWidth)).toString())
          }
      }
  }

  const handleHeightChange = (val: string) => {
      setHeight(val)
      if (maintainRatio && originalWidth && originalHeight && val) {
          const num = parseInt(val)
          if (!isNaN(num)) {
              setWidth(Math.round(num * (originalWidth / originalHeight)).toString())
          }
      }
  }

  const applyScale = (scale: number) => {
      if (originalWidth && originalHeight) {
          setWidth(Math.round(originalWidth * scale).toString())
          setHeight(Math.round(originalHeight * scale).toString())
      }
  }

  // Live compression trigger
  useEffect(() => {
    if (!file) return

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    
    setIsProcessingLive(true)
    
    debounceTimerRef.current = setTimeout(async () => {
        try {
            const data = new FormData()
            data.append('image', file)
            data.append('conversionType', conversionType)
            data.append('quality', quality.toString())
            if (width) data.append('width', width)
            if (height) data.append('height', height)
            data.append('preserveMetadata', preserveMetadata.toString())
            if (metaAuthor) data.append('metaAuthor', metaAuthor)
            if (metaCopyright) data.append('metaCopyright', metaCopyright)
            if (metaTitle) data.append('metaTitle', metaTitle)
            if (metaSoftware) data.append('metaSoftware', metaSoftware)
            if (metaMake) data.append('metaMake', metaMake)
            if (metaLocation) data.append('metaLocation', metaLocation)

            const response = await fetch('/api/image', {
                method: 'POST',
                body: data
            })

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                setCompressedPreview(url)
                setCompressedSize(blob.size)
            }
        } catch (error) {
            console.error("Live processing error:", error)
        } finally {
            setIsProcessingLive(false)
        }
    }, 400) // 400ms debounce
    
    return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [file, quality, conversionType, width, height, preserveMetadata, metaAuthor, metaCopyright, metaTitle, metaSoftware, metaMake, metaLocation])


  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleDownload = (e: FormEvent) => {
    e.preventDefault()
    if (!compressedPreview) {
      alert('Please wait for the image to process.')
      return
    }

    const ext = conversionType === 'jpeg' ? 'jpg' : conversionType
    const finalFilename = fileName.trim() ? `${fileName.trim()}.${ext}` : `converted_image.${ext}`

    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = compressedPreview
    a.download = finalFilename
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const handleCropApply = async () => {
    if (!preview || !croppedAreaPixels) return
    try {
        const croppedFile = await getCroppedImg(preview, croppedAreaPixels, rotation)
        if (croppedFile) {
            handleFile(croppedFile)
            setIsCropping(false)
        }
    } catch (e) {
        console.error(e)
    }
  }

  const resetState = () => {
    setFile(null)
    setPreview(null)
    setCompressedPreview(null)
    setCompressedSize(null)
    setOriginalWidth(null)
    setOriginalHeight(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className={`relative w-screen h-screen flex overflow-hidden ${preview ? 'max-[900px]:flex-col' : ''}`}>
        
        {mounted && (
            <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="absolute top-8 left-8 z-[100] w-12 h-12 rounded-full bg-white/65 dark:bg-slate-800/65 backdrop-blur-md shadow-lg border border-white/40 dark:border-slate-700/50 flex justify-center items-center text-2xl text-brand-text transition-all hover:scale-110"
            >
                {theme === 'dark' ? <i className='bx bx-sun text-yellow-400'></i> : <i className='bx bx-moon text-brand-primary'></i>}
            </button>
        )}

        {/* Animated Blobs */}
        <div className="absolute blur-[80px] -z-10 rounded-full opacity-60 w-[30vw] h-[30vw] bg-brand-primary-light top-[10%] left-[20%] animate-float"></div>
        <div className="absolute blur-[80px] -z-10 rounded-full opacity-60 w-[40vw] h-[40vw] bg-brand-secondary-light bottom-[10%] right-[15%] animate-float [animation-delay:-3s]"></div>
        <div className="absolute blur-[80px] -z-10 rounded-full opacity-60 w-[25vw] h-[25vw] bg-brand-accent-light top-[40%] left-[60%] animate-float [animation-delay:-6s]"></div>

        <main 
            className={`flex-1 relative flex justify-center items-center overflow-hidden transition-all duration-300 h-[calc(100vh-40px)] bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-white/80 dark:border-slate-700/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-[24px] ${preview ? 'm-5 ml-5 mr-2.5 max-[900px]:m-3 max-[900px]:mb-1.5 max-[900px]:h-[45vh] max-[900px]:w-auto max-[900px]:flex-none' : 'm-5 max-[900px]:m-3'} ${isDragActive ? 'bg-white/20 dark:bg-slate-800/40 border-4 border-dashed border-brand-primary' : ''}`}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <input 
                type="file" 
                id="file" 
                accept="image/*" 
                name="image" 
                className="hidden"
                ref={fileInputRef}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                if (e.target.files && e.target.files.length > 0) {
                    handleFile(e.target.files[0])
                }
                }}
            />

            {!preview ? (
                <div className="text-center flex flex-col items-center gap-10 z-10 p-4">
                    <div className="text-center">
                        <h2 className="text-5xl font-bold mb-3 bg-gradient-to-r from-brand-primary-dark to-brand-secondary bg-clip-text text-transparent">Squeeze</h2>
                        <p className="text-brand-muted text-lg">Convert, compress, and resize with ease.</p>
                    </div>
                    <div 
                        className="w-full max-w-[500px] h-[250px] bg-white/40 dark:bg-slate-800/40 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex flex-col justify-center items-center backdrop-blur-sm transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-brand-primary dark:hover:border-brand-primary cursor-pointer" 
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <i className='bx bx-cloud-upload text-6xl text-brand-primary mb-4 transition-transform hover:-translate-y-1'></i>
                        <span className="text-brand-text font-semibold text-lg mb-2">
                            Click to Upload or Drag & Drop
                        </span>
                        <p className="text-brand-muted text-sm">Supported formats: PNG, JPG, WEBP, GIF</p>
                    </div>
                </div>
            ) : isCropping ? (
                <div className="relative w-full h-full flex flex-col bg-slate-900 rounded-[22px] overflow-hidden">
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-md rounded-xl p-1.5 flex gap-1 z-20 shadow-2xl border border-slate-600">
                        <button onClick={() => setCropAspect(undefined)} className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${cropAspect === undefined ? 'bg-brand-primary text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'}`}>Freeform</button>
                        <button onClick={() => setCropAspect(1)} className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${cropAspect === 1 ? 'bg-brand-primary text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'}`}>1:1 Square</button>
                        <button onClick={() => setCropAspect(16/9)} className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${cropAspect === 16/9 ? 'bg-brand-primary text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'}`}>16:9</button>
                        <button onClick={() => setCropAspect(4/3)} className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${cropAspect === 4/3 ? 'bg-brand-primary text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'}`}>4:3</button>
                        <button onClick={() => setCropAspect(9/16)} className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${cropAspect === 9/16 ? 'bg-brand-primary text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'}`}>9:16 Vertical</button>
                    </div>
                    <div className="relative flex-1 w-full bg-slate-900">
                        <Cropper
                            image={preview}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={cropAspect}
                            onCropChange={setCrop}
                            onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                            onZoomChange={setZoom}
                            onRotationChange={setRotation}
                        />
                    </div>
                    <div className="h-20 bg-slate-800 flex items-center justify-between px-8 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setRotation(r => r - 90)} className="w-10 h-10 rounded-lg bg-slate-700 text-white flex justify-center items-center hover:bg-slate-600 transition-colors"><i className='bx bx-rotate-left'></i></button>
                            <button onClick={() => setRotation(r => r + 90)} className="w-10 h-10 rounded-lg bg-slate-700 text-white flex justify-center items-center hover:bg-slate-600 transition-colors"><i className='bx bx-rotate-right'></i></button>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsCropping(false)} className="px-6 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors">Cancel</button>
                            <button onClick={handleCropApply} className="px-6 py-2 bg-brand-primary text-white rounded-lg font-semibold hover:bg-brand-primary-light transition-colors shadow-lg shadow-brand-primary/30">Apply Crop</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative select-none overflow-hidden w-full h-full p-0 flex justify-center items-center">
                    
                    {/* Base Image (Original) */}
                    <img src={preview} alt="Original" className="relative w-full h-full object-contain bg-transparent pointer-events-none" />
                    
                    {/* Overlay Image (Compressed) */}
                    {compressedPreview && (
                        <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{ 
                                clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                                WebkitClipPath: `inset(0 0 0 ${sliderPosition}%)`
                            }}
                        >
                            <img src={compressedPreview} alt="Compressed" className="absolute inset-0 w-full h-full object-contain bg-transparent pointer-events-none" />
                            {isProcessingLive && (
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 flex justify-center items-center z-10 pointer-events-none">
                                    <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Slider Input and Handle */}
                    {compressedPreview && (
                        <>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={sliderPosition} 
                                onChange={(e) => setSliderPosition(e.target.value)}
                                className="absolute inset-0 w-full h-full bg-transparent appearance-none m-0 outline-none z-20 cursor-col-resize [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-10 [&::-webkit-slider-thumb]:h-[100vh] [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:cursor-col-resize [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-10 [&::-moz-range-thumb]:h-[100vh] [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:cursor-col-resize [&::-moz-range-thumb]:border-none"
                            />
                            <div 
                                className="absolute top-0 bottom-0 left-1/2 w-1 bg-white -translate-x-1/2 pointer-events-none z-15 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex justify-center items-center"
                                style={{ left: `${sliderPosition}%` }}
                            >
                                <div className="w-10 h-10 bg-white rounded-full flex justify-center items-center text-brand-primary shadow-lg">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 18l-6-6 6-6" />
                                        <path d="M15 18l6-6-6-6" />
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="absolute bottom-10 left-10 py-3 px-6 bg-black/60 dark:bg-black/80 text-white rounded-full text-sm font-semibold backdrop-blur-sm pointer-events-none z-10">
                                Original {file && <span className="opacity-80 text-xs ml-1.5">{formatBytes(file.size)}</span>}
                            </div>
                            <div className="absolute bottom-10 right-10 py-3 px-6 bg-black/60 dark:bg-black/80 text-white rounded-full text-sm font-semibold backdrop-blur-sm pointer-events-none z-10">
                                Compressed {compressedSize && <span className="opacity-80 text-xs ml-1.5">{formatBytes(compressedSize)}</span>}
                                {file && compressedSize && (
                                    <span style={{ color: compressedSize < file.size ? '#4ade80' : '#f87171' }} className="ml-2 text-[13px]">
                                        {compressedSize < file.size ? '↓' : '↑'} {Math.abs(((file.size - compressedSize) / file.size) * 100).toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                    
                    <button 
                        type="button" 
                        className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 border border-white/80 dark:border-slate-700 flex justify-center items-center text-2xl cursor-pointer shadow-lg transition-all text-brand-text hover:bg-white dark:hover:bg-slate-700 hover:scale-110 hover:text-red-500 z-50" 
                        onClick={resetState} 
                        title="Upload a different image"
                    >
                        <i className='bx bx-x'></i>
                    </button>
                </div>
            )}
        </main>

        {preview && (
            <aside className="flex flex-col relative overflow-hidden w-[380px] h-[calc(100vh-40px)] m-5 ml-2.5 rounded-[24px] bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-white/80 dark:border-slate-700/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] animate-slideInRight shrink-0 max-[900px]:w-auto max-[900px]:flex-1 max-[900px]:h-auto max-[900px]:min-h-0 max-[900px]:m-3 max-[900px]:mt-1.5">
                <header className="p-8 pb-5 border-b border-white/30 dark:border-slate-700/50 shrink-0">
                    <h3 className="text-2xl font-bold text-brand-text">Settings</h3>
                    <p className="text-brand-muted text-sm mt-1">Configure output format</p>
                </header>
                <div id="converterForm" className="flex-1 flex flex-col overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        
                        {/* OUTPUT SETTINGS */}
                        <div className="border-b border-white/20 dark:border-slate-700/50">
                            <div onClick={() => toggleSection('output')} className="flex justify-between items-center p-5 cursor-pointer hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                                <div className="flex items-center gap-3 text-brand-text">
                                    <i className='bx bx-export text-brand-primary text-xl'></i>
                                    <span className="font-semibold text-[11px] tracking-widest uppercase text-brand-muted">Output Settings</span>
                                </div>
                                <i className={`bx bx-chevron-down text-brand-muted text-xl transition-transform duration-300 ${openSections.output ? 'rotate-180' : ''}`}></i>
                            </div>
                            
                            {openSections.output && (
                                <div className="px-6 pb-6 pt-2 flex flex-col gap-6 animate-slideInRight">
                                    <div className="flex flex-col gap-2.5">
                                        <label className="font-medium text-[12px] uppercase tracking-wider text-brand-muted">Format</label>
                                        <CustomSelect 
                                            value={conversionType} 
                                            onChange={setConversionType} 
                                            options={conversionOptions} 
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <div className="flex justify-between items-center">
                                            <label htmlFor="quality" className="font-medium text-[12px] uppercase tracking-wider text-brand-muted">Quality</label>
                                            <span className="text-[12px] font-mono font-semibold text-brand-primary bg-brand-primary/10 py-1 px-2 rounded-md">{quality}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            className="w-full h-1.5 rounded-md bg-white/80 dark:bg-slate-700/80 outline-none mt-1 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-300 [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(99,102,241,0.5)] hover:[&::-webkit-slider-thumb]:scale-125 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:duration-300 hover:[&::-moz-range-thumb]:scale-125" 
                                            id="quality" 
                                            name="quality" 
                                            min="1" 
                                            max="100" 
                                            value={quality}
                                            onChange={(e) => setQuality(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* GEOMETRY & TRANSFORM */}
                        <div className="border-b border-white/20 dark:border-slate-700/50">
                            <div onClick={() => toggleSection('geometry')} className="flex justify-between items-center p-5 cursor-pointer hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                                <div className="flex items-center gap-3 text-brand-text">
                                    <i className='bx bx-crop text-brand-primary text-xl'></i>
                                    <span className="font-semibold text-[11px] tracking-widest uppercase text-brand-muted">Geometry</span>
                                </div>
                                <i className={`bx bx-chevron-down text-brand-muted text-xl transition-transform duration-300 ${openSections.geometry ? 'rotate-180' : ''}`}></i>
                            </div>
                            
                            {openSections.geometry && (
                                <div className="px-6 pb-6 pt-2 flex flex-col gap-6 animate-slideInRight">
                                    <div className="flex justify-between items-center">
                                        <label className="font-medium text-[12px] uppercase tracking-wider text-brand-muted">Crop / Rotate</label>
                                        <button type="button" onClick={() => setIsCropping(true)} className="text-[11px] uppercase tracking-wider font-semibold px-3 py-1.5 bg-brand-primary/10 dark:bg-slate-800 text-brand-primary-dark dark:text-brand-primary-light rounded hover:bg-brand-primary hover:text-white transition-colors border border-brand-primary/20">Edit Map</button>
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <div className="flex justify-between items-center">
                                            <label className="font-medium text-[12px] uppercase tracking-wider text-brand-muted">Resize Output</label>
                                            <button type="button" onClick={() => setMaintainRatio(!maintainRatio)} className={`text-lg transition-colors ${maintainRatio ? 'text-brand-primary' : 'text-brand-muted/40'}`} title={maintainRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}>
                                                <i className={maintainRatio ? 'bx bx-link' : 'bx bx-unlink'}></i>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-full">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-brand-muted font-semibold pointer-events-none">W</span>
                                                <input type="number" name="width" value={width} onChange={(e) => handleWidthChange(e.target.value)} className="w-full pl-8 pr-2 py-2.5 rounded-lg border border-white/60 dark:border-slate-600 bg-white/50 dark:bg-slate-900/50 font-mono text-brand-text text-[13px] outline-none transition-all focus:border-brand-primary focus:bg-white dark:focus:bg-slate-800" placeholder="Auto" />
                                            </div>
                                            <span className="text-brand-muted/50 font-mono text-xs">×</span>
                                            <div className="relative w-full">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-brand-muted font-semibold pointer-events-none">H</span>
                                                <input type="number" name="height" value={height} onChange={(e) => handleHeightChange(e.target.value)} className="w-full pl-8 pr-2 py-2.5 rounded-lg border border-white/60 dark:border-slate-600 bg-white/50 dark:bg-slate-900/50 font-mono text-brand-text text-[13px] outline-none transition-all focus:border-brand-primary focus:bg-white dark:focus:bg-slate-800" placeholder="Auto" />
                                            </div>
                                        </div>
                                        <div className="flex justify-between gap-1.5 mt-1">
                                            {[0.25, 0.5, 0.75, 1].map(scale => (
                                                <button key={scale} type="button" onClick={() => applyScale(scale)} className="flex-1 py-1 px-1 text-[11px] font-mono font-medium text-brand-text/60 bg-white/40 dark:bg-slate-800/40 border border-white dark:border-slate-700/50 rounded hover:bg-brand-primary hover:text-white transition-colors hover:border-brand-primary">{scale * 100}%</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* METADATA */}
                        <div>
                            <div onClick={() => toggleSection('metadata')} className="flex justify-between items-center p-5 cursor-pointer hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                                <div className="flex items-center gap-3 text-brand-text">
                                    <i className='bx bx-fingerprint text-brand-primary text-xl'></i>
                                    <span className="font-semibold text-[11px] tracking-widest uppercase text-brand-muted">EXIF Metadata</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {preserveMetadata && <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_5px_rgba(99,102,241,0.8)]"></div>}
                                    <i className={`bx bx-chevron-down text-brand-muted text-xl transition-transform duration-300 ${openSections.metadata ? 'rotate-180' : ''}`}></i>
                                </div>
                            </div>

                            {openSections.metadata && (
                                <div className="px-6 pb-6 pt-2 flex flex-col gap-5 animate-slideInRight">
                                    <div className="flex flex-col gap-2.5">
                                        {[
                                            { label: 'File Name', placeholder: 'e.g., my_image', state: fileName, setter: setFileName },
                                            { label: 'Artist', placeholder: 'e.g., John Doe', state: metaAuthor, setter: setMetaAuthor },
                                            { label: 'Copyright', placeholder: 'e.g., © 2024 John Doe', state: metaCopyright, setter: setMetaCopyright },
                                            { label: 'Title', placeholder: 'e.g., Summer Vacation', state: metaTitle, setter: setMetaTitle },
                                            { label: 'Software', placeholder: 'e.g., Squeeze', state: metaSoftware, setter: setMetaSoftware },
                                            { label: 'Cam Make', placeholder: 'e.g., Sony ILCE-7M4', state: metaMake, setter: setMetaMake },
                                            { label: 'Location', placeholder: 'Lat, Lng (e.g., 40.71, -74.00)', state: metaLocation, setter: setMetaLocation },
                                        ].map(field => (
                                            <div key={field.label} className="relative w-full flex items-center bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-700/60 rounded-lg overflow-hidden focus-within:border-brand-primary dark:focus-within:border-brand-primary transition-colors">
                                                <span className="w-[85px] pl-3 text-[10px] uppercase tracking-wider text-brand-muted/80 font-semibold pointer-events-none border-r border-slate-200 dark:border-slate-700">{field.label}</span>
                                                <input type="text" value={field.state} onChange={(e) => field.setter(e.target.value)} className={`flex-1 px-3 py-2 bg-transparent text-brand-text text-[12px] outline-none placeholder-slate-400 dark:placeholder-slate-500 font-mono`} placeholder={field.placeholder} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="w-full h-[300px] rounded-lg overflow-hidden border border-white/60 dark:border-slate-700/60 mt-2">
                                        <LocationPickerModal
                                            onSelect={(lat, lng) => setMetaLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)}
                                            initialLocation={
                                                metaLocation 
                                                    ? { lat: parseFloat(metaLocation.split(',')[0]), lng: parseFloat(metaLocation.split(',')[1]) }
                                                    : undefined
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 shrink-0 border-t border-white/20 dark:border-slate-700/50 bg-white/30 dark:bg-slate-800/40 backdrop-blur-md">
                        <button type="button" onClick={handleDownload} className="w-full p-4 border-none rounded-xl text-white text-[15px] font-semibold tracking-wide cursor-pointer flex justify-center items-center gap-2.5 transition-all duration-300 bg-brand-primary hover:bg-brand-primary-dark shadow-lg shadow-brand-primary/20 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-[1px] m-0 disabled:opacity-70 disabled:cursor-not-allowed" id="downloadBtn" disabled={isProcessingLive}>
                            <span>{isProcessingLive ? 'PROCESSING...' : 'DOWNLOAD'}</span>
                            <i className={isProcessingLive ? 'bx bx-loader-alt animate-spin' : 'bx bx-down-arrow-alt'}></i>
                        </button>
                    </div>
                </div>
            </aside>
        )}
        
    </div>
  )
}
