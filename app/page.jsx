'use client'

import { useState, useRef, useEffect } from 'react'

const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function Home() {
  // File state
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null) // Original image preview
  
  // Settings state
  const [conversionType, setConversionType] = useState('png')
  const [quality, setQuality] = useState(90)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  
  // Processing & Slider state
  const [compressedPreview, setCompressedPreview] = useState(null)
  const [compressedSize, setCompressedSize] = useState(null)
  const [isProcessingLive, setIsProcessingLive] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)
  
  // UI state
  const [isDragActive, setIsDragActive] = useState(false)
  
  const fileInputRef = useRef(null)
  const debounceTimerRef = useRef(null)

  const handleFile = (selectedFile) => {
    if (!selectedFile.type.startsWith('image/')) {
        alert('Please upload an image file.')
        return
    }
    setFile(selectedFile)
    setSliderPosition(50)
    setCompressedSize(null)

    const reader = new FileReader()
    reader.onload = (e) => {
        setPreview(e.target.result)
    }
    reader.readAsDataURL(selectedFile)
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
            data.append('quality', quality)
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
    
    return () => clearTimeout(debounceTimerRef.current)
  }, [file, quality, conversionType, width, height])


  const onDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }
  const onDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }
  const onDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }
  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleDownload = (e) => {
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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className={`app-container ${preview ? 'has-image' : ''}`}>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>

        <main 
            className={`main-view ${isDragActive ? 'drag-active' : ''}`}
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
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                    handleFile(e.target.files[0])
                }
                }}
            />

            {!preview ? (
                <div className="empty-state">
                    <div className="hero-text">
                        <h2>Image Converter</h2>
                        <p>Convert, compress, and resize with ease.</p>
                    </div>
                    <div 
                        className="drop-indicator" 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ cursor: 'pointer' }}
                    >
                        <i className='bx bx-cloud-upload icon'></i>
                        <span className="select-btn-large">
                            Click to Upload or Drag & Drop
                        </span>
                        <p className="file-info">Supported formats: PNG, JPG, WEBP, GIF</p>
                    </div>
                </div>
            ) : (
                <div className="image-preview-container comparison-container">
                    
                    {/* Base Image (Original) */}
                    <img src={preview} alt="Original" className="comparison-image original-image" />
                    
                    {/* Overlay Image (Compressed) */}
                    {compressedPreview && (
                        <div 
                            className="comparison-overlay"
                            style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                        >
                            <img src={compressedPreview} alt="Compressed" className="comparison-image compressed-image" />
                            {isProcessingLive && (
                                <div className="live-spinner-overlay">
                                    <div className="spinner-small"></div>
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
                                className="comparison-slider"
                            />
                            <div 
                                className="slider-handle-line"
                                style={{ left: `${sliderPosition}%` }}
                            >
                                <div className="slider-handle-button">
                                    <i className='bx bx-code'></i>
                                </div>
                            </div>
                            
                            <div className="label-original">
                                Original {file && <span style={{ opacity: 0.8, fontSize: '12px', marginLeft: '6px' }}>{formatBytes(file.size)}</span>}
                            </div>
                            <div className="label-compressed">
                                Compressed {compressedSize && <span style={{ opacity: 0.8, fontSize: '12px', marginLeft: '6px' }}>{formatBytes(compressedSize)}</span>}
                                {file && compressedSize && (
                                    <span style={{ 
                                        color: compressedSize < file.size ? '#4ade80' : '#f87171', 
                                        marginLeft: '8px',
                                        fontSize: '13px'
                                    }}>
                                        {compressedSize < file.size ? '↓' : '↑'} {Math.abs(((file.size - compressedSize) / file.size) * 100).toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                    
                    <button type="button" className="reset-btn" onClick={resetState} title="Upload a different image">
                        <i className='bx bx-x'></i>
                    </button>
                </div>
            )}
        </main>

        {preview && (
            <aside className="settings-sidebar glass-panel">
                <header className="sidebar-header">
                    <h3>Settings</h3>
                    <p>Configure output format</p>
                </header>

                <form onSubmit={handleDownload} id="converterForm" className="settings-form">
                    
                    <div className="settings-panel">
                        <div className="form-group">
                            <label htmlFor="conversionType"><i className='bx bx-refresh'></i> Output Format</label>
                            <select 
                                className="custom-select" 
                                id="conversionType" 
                                name="conversionType" 
                                value={conversionType}
                                onChange={(e) => setConversionType(e.target.value)}
                                required 
                            >
                                <option value="png">PNG (Lossless)</option>
                                <option value="jpg">JPEG (Lossy)</option>
                                <option value="webp">WEBP (Optimized)</option>
                                <option value="avif">AVIF (Next-Gen)</option>
                                <option value="tiff">TIFF (High Quality)</option>
                                <option value="gif">GIF</option>
                            </select>
                        </div>

                        <div className="form-group slider-group">
                            <div className="slider-header">
                                <label htmlFor="quality"><i className='bx bx-slider-alt'></i> Quality</label>
                                <span id="qualityVal">{quality}%</span>
                            </div>
                            <input 
                              type="range" 
                              className="custom-slider" 
                              id="quality" 
                              name="quality" 
                              min="1" 
                              max="100" 
                              value={quality}
                              onChange={(e) => setQuality(e.target.value)}
                            />
                        </div>

                        <div className="form-group dimensions-group">
                            <label><i className='bx bx-crop'></i> Resize (Optional)</label>
                            <div className="dimensions-inputs">
                                <input 
                                    type="number" 
                                    name="width" 
                                    id="width" 
                                    placeholder="Width (px)" 
                                    value={width}
                                    onChange={(e) => setWidth(e.target.value)}
                                />
                                <span>×</span>
                                <input 
                                    type="number" 
                                    name="height" 
                                    id="height" 
                                    placeholder="Height (px)" 
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                />
                            </div>
                            <small className="hint">Leave blank to keep original size.</small>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" id="downloadBtn" disabled={isProcessingLive}>
                        <span>{isProcessingLive ? 'Processing...' : 'Download Image'}</span>
                        <i className={isProcessingLive ? 'bx bx-loader-alt bx-spin' : 'bx bx-download'}></i>
                    </button>

                </form>
            </aside>
        )}
    </div>
  )
}
