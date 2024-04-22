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
