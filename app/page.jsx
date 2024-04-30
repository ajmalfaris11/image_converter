'use client'

import { useState, useRef } from 'react'

export default function Home() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [quality, setQuality] = useState(90)
  const [loading, setLoading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  
  const fileInputRef = useRef(null)

  const handleFile = (selectedFile) => {
    if (!selectedFile.type.startsWith('image/')) {
        alert('Please upload an image file.')
        return
    }
    setFile(selectedFile)

    const reader = new FileReader()
    reader.onload = (e) => {
        setPreview(e.target.result)
    }
    reader.readAsDataURL(selectedFile)
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      alert('Please select an image first.')
      return
    }

    setLoading(true)

    try {
        const data = new FormData()
        data.append('image', file)
        data.append('conversionType', e.target.conversionType.value)
        data.append('quality', quality)
        data.append('width', e.target.width.value)
        data.append('height', e.target.height.value)

        const response = await fetch('/api/image', {
            method: 'POST',
            body: data
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(text || 'Conversion failed')
        }

        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        
        let filename = 'converted_image'
        const disposition = response.headers.get('Content-Disposition')
        if (disposition && disposition.indexOf('filename=') !== -1) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)
            if (matches != null && matches[1]) { 
                filename = matches[1].replace(/['"]/g, '')
            }
        } else {
            const type = e.target.conversionType.value
            const ext = type === 'jpeg' ? 'jpg' : type
            filename += `.${ext}`
        }

        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = downloadUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        
        window.URL.revokeObjectURL(downloadUrl)
        a.remove()
        
    } catch (error) {
        console.error(error)
        alert(`Error: ${error.message}`)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="app-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>

        <div className="glass-card main-card">
            <header>
                <h2>Image Converter</h2>
                <p>Convert, compress, and resize with ease.</p>
            </header>

            <form onSubmit={handleSubmit} id="converterForm">
                
                <input 
                  type="file" 
                  id="file" 
                  accept="image/*" 
                  name="image" 
                  hidden 
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFile(e.target.files[0])
                    }
                  }}
                />
                
                <div 
                  className={`dropzone ${isDragActive ? 'active' : ''}`} 
                  id="dropzone"
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                >
