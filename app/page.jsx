'use client'

import { useState, useRef } from 'react'

export default function Home() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
