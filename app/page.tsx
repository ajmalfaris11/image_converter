'use client'

import { useState, useRef, useEffect, DragEvent, ChangeEvent, FormEvent } from 'react'

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
                className={`w-full p-4 rounded-xl border ${isOpen ? 'border-brand-primary bg-white ring-4 ring-brand-primary/15' : 'border-white/60 bg-white/70 hover:bg-white/90'} text-brand-text text-[15px] cursor-pointer flex justify-between items-center transition-all duration-300`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-medium">{selectedOption?.label}</span>
                <i className={`bx bx-chevron-down text-xl text-brand-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-primary' : ''}`}></i>
            </div>
            
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-white/60 overflow-hidden z-[100]">
                    <div className="max-h-60 overflow-y-auto p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {options.map((opt) => (
                            <div 
                                key={opt.value}
                                className={`p-3 px-4 m-1 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between ${value === opt.value ? 'bg-brand-primary-soft text-brand-primary-dark font-semibold' : 'text-brand-text/80 hover:bg-slate-100'}`}
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

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
        alert('Please upload an image file.')
        return
    }
    setFile(selectedFile)
    setSliderPosition(50)
    setCompressedSize(null)

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
  }, [file, quality, conversionType, width, height])


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
    const filename = `converted_image.${ext}`

    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = compressedPreview
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
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
    <div className={`relative w-screen h-screen flex overflow-hidden ${preview ? 'max-[900px]:flex-col max-[900px]:overflow-y-auto' : ''}`}>
        {/* Animated Blobs */}
        <div className="absolute blur-[80px] -z-10 rounded-full opacity-60 w-[30vw] h-[30vw] bg-brand-primary-light top-[10%] left-[20%] animate-float"></div>
        <div className="absolute blur-[80px] -z-10 rounded-full opacity-60 w-[40vw] h-[40vw] bg-brand-secondary-light bottom-[10%] right-[15%] animate-float [animation-delay:-3s]"></div>
        <div className="absolute blur-[80px] -z-10 rounded-full opacity-60 w-[25vw] h-[25vw] bg-brand-accent-light top-[40%] left-[60%] animate-float [animation-delay:-6s]"></div>

        <main 
            className={`flex-1 relative flex justify-center items-center overflow-hidden transition-all duration-300 h-[calc(100vh-40px)] bg-white/65 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-[24px] ${preview ? 'm-5 ml-5 mr-2.5' : 'm-5'} max-[900px]:m-5 max-[900px]:h-[60vh] max-[900px]:flex-shrink-0 ${isDragActive ? 'bg-white/20 border-4 border-dashed border-brand-primary' : ''}`}
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
                        className="w-full max-w-[500px] h-[250px] bg-white/40 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col justify-center items-center backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:border-brand-primary cursor-pointer" 
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <i className='bx bx-cloud-upload text-6xl text-brand-primary mb-4 transition-transform hover:-translate-y-1'></i>
                        <span className="text-brand-text font-semibold text-lg mb-2">
                            Click to Upload or Drag & Drop
                        </span>
                        <p className="text-brand-muted text-sm">Supported formats: PNG, JPG, WEBP, GIF</p>
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
                                <div className="absolute inset-0 bg-white/40 flex justify-center items-center z-10 pointer-events-none">
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
                                <div className="w-10 h-10 bg-white rounded-full flex justify-center items-center text-brand-primary shadow-lg text-2xl">
                                    <i className='bx bx-code'></i>
                                </div>
                            </div>
                            
                            <div className="absolute bottom-10 left-10 py-3 px-6 bg-black/60 text-white rounded-full text-sm font-semibold backdrop-blur-sm pointer-events-none z-10">
                                Original {file && <span className="opacity-80 text-xs ml-1.5">{formatBytes(file.size)}</span>}
                            </div>
                            <div className="absolute bottom-10 right-10 py-3 px-6 bg-black/60 text-white rounded-full text-sm font-semibold backdrop-blur-sm pointer-events-none z-10">
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
                        className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/80 border border-white/80 flex justify-center items-center text-2xl cursor-pointer shadow-lg transition-all text-brand-text hover:bg-white hover:scale-110 hover:text-red-500 z-50" 
                        onClick={resetState} 
                        title="Upload a different image"
                    >
                        <i className='bx bx-x'></i>
                    </button>
                </div>
            )}
        </main>

        {preview && (
            <aside className="flex flex-col relative overflow-hidden w-[380px] h-[calc(100vh-40px)] m-5 ml-2.5 rounded-[24px] bg-white/65 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] animate-slideInRight shrink-0 max-[900px]:w-[calc(100%-40px)] max-[900px]:h-auto max-[900px]:min-h-[500px] max-[900px]:m-5">
                <header className="p-8 pb-5 border-b border-white/30 shrink-0">
                    <h3 className="text-2xl font-bold text-brand-text">Settings</h3>
                    <p className="text-brand-muted text-sm mt-1">Configure output format</p>
                </header>

                <form onSubmit={handleDownload} id="converterForm" className="flex-1 flex flex-col overflow-hidden relative">
                    
                    <div className="p-8 pb-4 flex-1 overflow-y-auto flex flex-col gap-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex flex-col gap-2.5">
                            <label className="font-medium text-[15px] flex items-center gap-2 text-brand-text">
                                <i className='bx bx-refresh text-brand-primary text-lg'></i> Output Format
                            </label>
                            <CustomSelect 
                                value={conversionType} 
                                onChange={setConversionType} 
                                options={conversionOptions} 
                            />
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <div className="flex justify-between items-center">
                                <label htmlFor="quality" className="font-medium text-[15px] flex items-center gap-2 text-brand-text">
                                    <i className='bx bx-slider-alt text-brand-primary text-lg'></i> Quality
                                </label>
                                <span className="text-[13px] font-semibold text-brand-primary bg-brand-primary/15 py-1 px-2.5 rounded-full">{quality}%</span>
                            </div>
                            <input 
                              type="range" 
                              className="w-full h-2 rounded-md bg-white/80 outline-none mt-1 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-300 [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(99,102,241,0.5)] hover:[&::-webkit-slider-thumb]:scale-125 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:duration-300 [&::-moz-range-thumb]:shadow-[0_2px_8px_rgba(99,102,241,0.5)] hover:[&::-moz-range-thumb]:scale-125" 
                              id="quality" 
                              name="quality" 
                              min="1" 
                              max="100" 
                              value={quality}
                              onChange={(e) => setQuality(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <div className="flex justify-between items-center">
                                <label className="font-medium text-[15px] flex items-center gap-2 text-brand-text">
                                    <i className='bx bx-crop text-brand-primary text-lg'></i> Resize
                                </label>
                                <button 
                                    type="button" 
                                    onClick={() => setMaintainRatio(!maintainRatio)}
                                    className={`text-lg transition-colors ${maintainRatio ? 'text-brand-primary' : 'text-brand-muted/70'}`}
                                    title={maintainRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
                                >
                                    <i className={maintainRatio ? 'bx bx-link' : 'bx bx-unlink'}></i>
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    name="width" 
                                    id="width" 
                                    placeholder="W (px)" 
                                    value={width}
                                    className="w-full p-4 rounded-xl border border-white/60 bg-white/70 text-brand-text text-[15px] outline-none transition-all duration-300 appearance-none focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/15"
                                    onChange={(e) => handleWidthChange(e.target.value)}
                                />
                                <span className="text-brand-muted font-semibold">×</span>
                                <input 
                                    type="number" 
                                    name="height" 
                                    id="height" 
                                    placeholder="H (px)" 
                                    value={height}
                                    className="w-full p-4 rounded-xl border border-white/60 bg-white/70 text-brand-text text-[15px] outline-none transition-all duration-300 appearance-none focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/15"
                                    onChange={(e) => handleHeightChange(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex justify-between gap-2 mt-1">
                                <button type="button" onClick={() => applyScale(0.25)} className="flex-1 py-1 px-2 text-xs font-medium text-brand-text/70 bg-white/50 border border-white rounded hover:bg-brand-primary-soft hover:text-brand-primary-dark transition-colors">25%</button>
                                <button type="button" onClick={() => applyScale(0.5)} className="flex-1 py-1 px-2 text-xs font-medium text-brand-text/70 bg-white/50 border border-white rounded hover:bg-brand-primary-soft hover:text-brand-primary-dark transition-colors">50%</button>
                                <button type="button" onClick={() => applyScale(0.75)} className="flex-1 py-1 px-2 text-xs font-medium text-brand-text/70 bg-white/50 border border-white rounded hover:bg-brand-primary-soft hover:text-brand-primary-dark transition-colors">75%</button>
                                <button type="button" onClick={() => applyScale(1)} className="flex-1 py-1 px-2 text-xs font-medium text-brand-text/70 bg-white/50 border border-white rounded hover:bg-brand-primary-soft hover:text-brand-primary-dark transition-colors">100%</button>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pt-4 shrink-0 border-t border-white/20 bg-white/10 backdrop-blur-md">
                        <button type="submit" className="w-full p-[18px] border-none rounded-2xl text-white text-[17px] font-semibold cursor-pointer flex justify-center items-center gap-2.5 transition-all duration-300 bg-gradient-to-br from-brand-primary to-brand-accent shadow-[0_8px_20px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(99,102,241,0.4)] active:translate-y-[1px] m-0 disabled:opacity-70 disabled:cursor-not-allowed" id="downloadBtn" disabled={isProcessingLive}>
                            <span>{isProcessingLive ? 'Processing...' : 'Download Image'}</span>
                            <i className={isProcessingLive ? 'bx bx-loader-alt animate-spin' : 'bx bx-download'}></i>
                        </button>
                    </div>

                </form>
            </aside>
        )}
    </div>
  )
}
