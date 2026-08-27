import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Download, Upload, Plus, Trash2, Save, RotateCcw, RotateCw,
  Type, Image, Circle, Square, Layers, Eye, EyeOff, Lock, Unlock,
  Copy, FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, Maximize,
  Move, MousePointer, ChevronUp, ChevronDown, Undo2, Redo2, X,
  GripVertical, Settings2, Palette
} from 'lucide-react'
import type { Student } from '../types/electron.d'
import { getImageUrl } from '../utils/image'

// ── Types ────────────────────────────────────────────────────────

type ShapeType = 'circle' | 'square' | 'rounded-rect' | 'oval'

interface TextLayer {
  type: 'text'
  id: string
  name: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fontWeight: number
  italic: boolean
  underline: boolean
  color: string
  opacity: number
  letterSpacing: number
  lineHeight: number
  textAlign: 'left' | 'center' | 'right'
  rotation: number
  visible: boolean
  locked: boolean
  outlineWidth?: number
  outlineColor?: string
  shadowBlur?: number
  shadowColor?: string
  shadowOffsetX?: number
  shadowOffsetY?: number
}

interface PhotoLayer {
  type: 'photo'
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  flipX: boolean
  flipY: boolean
  shape: ShapeType
  borderWidth: number
  borderColor: string
  shadow: boolean
  opacity: number
  // Image inside mask
  imgOffsetX: number
  imgOffsetY: number
  imgScale: number
  // Filters
  brightness: number
  contrast: number
  saturate: number
  blur: number
  visible: boolean
  locked: boolean
}

interface BackgroundLayer {
  type: 'background'
  id: string
  name: string
  image: string | null
  color: string
  visible: boolean
  locked: boolean
}

interface ImageLayer {
  type: 'image'
  id: string
  name: string
  image: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
}

type Layer = TextLayer | PhotoLayer | BackgroundLayer | ImageLayer

interface EditorState {
  layers: Layer[]
  canvasWidth: number
  canvasHeight: number
  zoom: number
  selectedLayerId: string | null
}

interface HistoryEntry {
  layers: Layer[]
}

// ── Export presets ────────────────────────────────────────────────

const EXPORT_PRESETS = [
  { label: 'Original', w: 0, h: 0 },
  { label: 'WhatsApp Status (1080×1920)', w: 1080, h: 1920 },
  { label: 'Instagram Portrait (1080×1350)', w: 1080, h: 1350 },
  { label: 'Instagram Square (1080×1080)', w: 1080, h: 1080 },
  { label: 'Facebook Story (1080×1920)', w: 1080, h: 1920 },
  { label: 'HD Landscape (1920×1080)', w: 1920, h: 1080 },
]

const FONTS = [
  'Inter', 'Arial', 'Georgia', 'Courier New', 'Trebuchet MS',
  'Verdana', 'Palatino', 'Impact', 'Comic Sans MS',
  'Montserrat', 'Poppins', 'Oswald', 'Playfair Display',
  'Fredoka One', 'Lobster', 'Pacifico', 'Bangers', 'Cabin Sketch'
]

// ── Defaults ─────────────────────────────────────────────────────

function createDefaultLayers(student: Student): Layer[] {
  return [
    {
      type: 'background',
      id: 'bg',
      name: 'Background',
      image: '/TemplateFIT.png',
      color: '#0F172A',
      visible: true,
      locked: true,
    },
    {
      type: 'photo',
      id: 'photo',
      name: 'Student Photo',
      x: 251,
      y: 186,
      width: 175,
      height: 175,
      rotation: 0,
      flipX: false,
      flipY: false,
      shape: 'square',
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: false,
      opacity: 1,
      imgOffsetX: 0,
      imgOffsetY: 0,
      imgScale: 1,
      brightness: 100,
      contrast: 100,
      saturate: 100,
      blur: 0,
      visible: true,
      locked: false,
    },
    {
      type: 'image',
      id: 'insta_frame',
      name: 'Instagram Frame Overlay',
      image: '/fit_frame.png',
      x: 244,
      y: 209,
      width: 210,
      height: 245,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    },
    {
      type: 'text',
      id: 'name',
      name: 'Student Name',
      text: '{name}',
      x: 250,
      y: 345,
      fontSize: 22,
      fontFamily: 'Fredoka One',
      fontWeight: 800,
      italic: false,
      underline: false,
      color: '#ffffff',
      opacity: 1,
      letterSpacing: 0,
      lineHeight: 1.2,
      textAlign: 'center',
      rotation: 0,
      visible: true,
      locked: false,
      outlineWidth: 3,
      outlineColor: '#000000',
      shadowBlur: 8,
      shadowColor: 'rgba(0,0,0,0.6)',
      shadowOffsetX: 0,
      shadowOffsetY: 4,
    },
    {
      type: 'text',
      id: 'date',
      name: 'Birthday Date',
      text: '{date}',
      x: 250,
      y: 378,
      fontSize: 13,
      fontFamily: 'Montserrat',
      fontWeight: 800,
      italic: false,
      underline: false,
      color: '#F59E0B',
      opacity: 1,
      letterSpacing: 0,
      lineHeight: 1.4,
      textAlign: 'center',
      rotation: 0,
      visible: true,
      locked: false,
      outlineWidth: 2,
      outlineColor: '#000000',
      shadowBlur: 4,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowOffsetX: 0,
      shadowOffsetY: 2,
    }
  ]
}

// ── Component ────────────────────────────────────────────────────

interface FlyerDesignerProps {
  student: Student
  students?: Student[]
  onSwitchStudent?: (student: Student) => void
  onClose: () => void
}

export default function FlyerDesigner({ student, students, onSwitchStudent, onClose }: FlyerDesignerProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<EditorState>({
    layers: createDefaultLayers(student),
    canvasWidth: 500,
    canvasHeight: 500,
    zoom: 0.75,
    selectedLayerId: null,
  })

  const [activeTab, setActiveTab] = useState<'layers' | 'properties' | 'export'>('layers')
  const [history, setHistory] = useState<HistoryEntry[]>([{ layers: createDefaultLayers(student) }])
  const [historyIdx, setHistoryIdx] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [exportPreset, setExportPreset] = useState(0)
  const [exportQuality, setExportQuality] = useState(90)
  const [toast, setToast] = useState<string | null>(null)
  const [editingImageInMask, setEditingImageInMask] = useState(false)

  // Load saved configuration on mount
  useEffect(() => {
    // Inject Google Fonts
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Montserrat:wght@400;700;800&family=Poppins:wght@400;600;800&family=Lobster&family=Pacifico&family=Oswald:wght@400;700&family=Playfair+Display:ital,wght@0,700;1,700&family=Bangers&family=Cabin+Sketch&display=swap'
    document.head.appendChild(link)

    window.api.app.getFlyerConfig().then((saved: any) => {
      if (saved && saved._designerState && saved._designerState.layers) {
        setState({
          layers: saved._designerState.layers,
          canvasWidth: saved._designerState.canvasWidth || 500,
          canvasHeight: saved._designerState.canvasHeight || 500,
          zoom: 0.75,
          selectedLayerId: null,
        })
        setHistory([{ layers: JSON.parse(JSON.stringify(saved._designerState.layers)) }])
        setHistoryIdx(0)
      }
    }).catch(console.error)

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // ── History helpers ───────────────────────────────────────────

  const pushHistory = useCallback((newLayers: Layer[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIdx + 1)
      return [...trimmed, { layers: JSON.parse(JSON.stringify(newLayers)) }]
    })
    setHistoryIdx(prev => prev + 1)
  }, [historyIdx])

  const undo = useCallback(() => {
    if (historyIdx <= 0) return
    const newIdx = historyIdx - 1
    setHistoryIdx(newIdx)
    setState(prev => ({ ...prev, layers: JSON.parse(JSON.stringify(history[newIdx].layers)) }))
  }, [historyIdx, history])

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return
    const newIdx = historyIdx + 1
    setHistoryIdx(newIdx)
    setState(prev => ({ ...prev, layers: JSON.parse(JSON.stringify(history[newIdx].layers)) }))
  }, [historyIdx, history])

  // ── Keyboard shortcuts ────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (e.metaKey && e.shiftKey && e.key === 'z') { e.preventDefault(); redo() }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedLayerId && state.selectedLayerId !== 'bg' && state.selectedLayerId !== 'photo') {
          e.preventDefault()
          updateLayers(state.layers.filter(l => l.id !== state.selectedLayerId))
          setState(prev => ({ ...prev, selectedLayerId: null }))
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, state.selectedLayerId, state.layers])

  // ── Update helpers ────────────────────────────────────────────

  const updateLayers = (newLayers: Layer[]) => {
    setState(prev => ({ ...prev, layers: newLayers }))
    pushHistory(newLayers)
  }

  const updateLayer = (id: string, patch: Partial<Layer>) => {
    const newLayers = state.layers.map(l => l.id === id ? { ...l, ...patch } as Layer : l)
    setState(prev => ({ ...prev, layers: newLayers }))
  }

  const commitLayer = () => {
    pushHistory(state.layers)
  }

  const selectedLayer = state.layers.find(l => l.id === state.selectedLayerId) || null

  // ── Auto-save ──────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const bgLayer = state.layers.find(l => l.type === 'background') as BackgroundLayer | undefined;
        const photoLayer = state.layers.find(l => l.type === 'photo') as PhotoLayer | undefined;
        const textLayers = state.layers.filter(l => l.type === 'text') as TextLayer[];

        window.api.app.saveFlyerConfig({
          useCustomLayout: true,
          backgroundImage: bgLayer?.image || null,
          photoShape: (photoLayer?.shape === 'circle' || photoLayer?.shape === 'oval') ? 'round' : 'square',
          photoX: photoLayer ? photoLayer.x : 0,
          photoY: photoLayer ? photoLayer.y : 0,
          photoSize: photoLayer ? photoLayer.width : 0,
          customTexts: textLayers.map(l => ({
            id: l.id,
            text: l.text,
            x: l.x,
            y: l.y,
            fontSize: l.fontSize,
            color: l.color,
            fontWeight: l.fontWeight
          })),
          showDefaultDecorations: false,
          _designerState: { layers: state.layers, canvasWidth: state.canvasWidth, canvasHeight: state.canvasHeight }
        } as any)
      } catch (err) {
        console.error('Failed to auto-save config:', err)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [state.layers, state.canvasWidth, state.canvasHeight])

  // ── Toast ──────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Drag (layers on canvas) ───────────────────────────────────

  const handleCanvasMouseDown = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const layer = state.layers.find(l => l.id === layerId)
    if (!layer || layer.locked || layer.type === 'background') return
    setState(prev => ({ ...prev, selectedLayerId: layerId }))

    const startX = e.clientX
    const startY = e.clientY
    const origLayer = { ...layer } as any

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - startX) / state.zoom
      const dy = (me.clientY - startY) / state.zoom
      updateLayer(layerId, { x: origLayer.x + dx, y: origLayer.y + dy })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      commitLayer()
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Drag image inside mask ────────────────────────────────────

  const handleMaskImageDrag = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const layer = state.layers.find(l => l.id === layerId) as PhotoLayer
    if (!layer) return

    const startX = e.clientX
    const startY = e.clientY
    const origOx = layer.imgOffsetX
    const origOy = layer.imgOffsetY

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - startX) / state.zoom
      const dy = (me.clientY - startY) / state.zoom
      updateLayer(layerId, { imgOffsetX: origOx + dx, imgOffsetY: origOy + dy })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      commitLayer()
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Zoom image inside mask via wheel ──────────────────────────

  const handleMaskWheel = (layerId: string, e: React.WheelEvent) => {
    e.stopPropagation()
    const layer = state.layers.find(l => l.id === layerId) as PhotoLayer
    if (!layer) return
    const delta = e.deltaY * -0.005
    const newScale = Math.max(0.2, Math.min(5, layer.imgScale + delta))
    updateLayer(layerId, { imgScale: newScale })
  }

  // ── Resize handle ─────────────────────────────────────────────

  const handleResize = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const layer = state.layers.find(l => l.id === layerId) as PhotoLayer | ImageLayer | undefined
    if (!layer) return

    const startX = e.clientX
    const startY = e.clientY
    const origW = layer.width
    const origH = layer.height

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - startX) / state.zoom
      const dy = (me.clientY - startY) / state.zoom
      
      const newW = Math.max(20, origW + dx)
      const newH = me.shiftKey
        ? Math.max(20, origH + dy)
        : Math.max(20, origH + dx * (origH / origW))
      updateLayer(layerId, { width: newW, height: newH })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      commitLayer()
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleEdgeResize = (layerId: string, edge: 'right' | 'bottom', e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const layer = state.layers.find(l => l.id === layerId) as PhotoLayer | ImageLayer | undefined
    if (!layer) return

    const startX = e.clientX
    const startY = e.clientY
    const origW = layer.width
    const origH = layer.height

    const onMove = (me: MouseEvent) => {
      if (edge === 'right') {
        const dx = (me.clientX - startX) / state.zoom
        updateLayer(layerId, { width: Math.max(20, origW + dx) })
      } else if (edge === 'bottom') {
        const dy = (me.clientY - startY) / state.zoom
        updateLayer(layerId, { height: Math.max(20, origH + dy) })
      }
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      commitLayer()
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Export ─────────────────────────────────────────────────────

  const handleExport = async () => {
    if (!canvasRef.current) return
    setExporting(true)
    try {
      const prevSelected = state.selectedLayerId
      setState(prev => ({ ...prev, selectedLayerId: null }))
      await new Promise(r => setTimeout(r, 100))

      const { toPng, toJpeg } = await import('html-to-image')
      const preset = EXPORT_PRESETS[exportPreset]
      const targetW = preset.w || state.canvasWidth
      const pixelRatio = Math.max(2, targetW / state.canvasWidth)

      const dataUrl = exportQuality === 100
        ? await toPng(canvasRef.current, { pixelRatio, width: state.canvasWidth, height: state.canvasHeight })
        : await toJpeg(canvasRef.current, { pixelRatio, quality: exportQuality / 100, width: state.canvasWidth, height: state.canvasHeight })

      const ext = exportQuality === 100 ? 'png' : 'jpg'
      const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '')
      const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0))

      const savePath = await window.api.dialog.saveFile({
        defaultPath: `${student.fullName.replace(/\s+/g, '_')}_flyer.${ext}`,
        filters: [{ name: `${ext.toUpperCase()} Image`, extensions: [ext] }],
      })

      if (savePath) {
        await window.api.fs.writeFile(savePath, buffer)
        showToast(`Flyer exported as ${ext.toUpperCase()}!`)
      }

      setState(prev => ({ ...prev, selectedLayerId: prevSelected }))
    } catch (err) {
      console.error('Export failed:', err)
      showToast('Export failed')
    } finally {
      setExporting(false)
    }
  }

  // ── Add text layer ────────────────────────────────────────────

  const addTextLayer = () => {
    const newLayer: TextLayer = {
      type: 'text',
      id: `text-${Date.now()}`,
      name: `Text ${state.layers.filter(l => l.type === 'text').length + 1}`,
      text: 'New Text',
      x: 250,
      y: 250,
      fontSize: 20,
      fontFamily: 'Inter',
      fontWeight: 600,
      italic: false,
      underline: false,
      color: '#ffffff',
      opacity: 1,
      letterSpacing: 0,
      lineHeight: 1.4,
      textAlign: 'center',
      rotation: 0,
      visible: true,
      locked: false,
    }
    updateLayers([...state.layers, newLayer])
    setState(prev => ({ ...prev, selectedLayerId: newLayer.id }))
    setActiveTab('properties')
  }

  // ── Add image layer ────────────────────────────────────────────

  const addImageLayer = async () => {
    const p = await window.api.dialog.openFile({ filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }] })
    if (!p) return
    const newLayer: ImageLayer = {
      type: 'image',
      id: `image-${Date.now()}`,
      name: `Image ${state.layers.filter(l => l.type === 'image').length + 1}`,
      image: `file://${p}`,
      x: 250,
      y: 250,
      width: 150,
      height: 150,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    }
    updateLayers([...state.layers, newLayer])
    setState(prev => ({ ...prev, selectedLayerId: newLayer.id }))
    setActiveTab('properties')
  }

  // ── Layer reorder ─────────────────────────────────────────────

  const moveLayerUp = (id: string) => {
    const idx = state.layers.findIndex(l => l.id === id)
    if (idx >= state.layers.length - 1) return
    const newLayers = [...state.layers]
    ;[newLayers[idx], newLayers[idx + 1]] = [newLayers[idx + 1], newLayers[idx]]
    updateLayers(newLayers)
  }

  const moveLayerDown = (id: string) => {
    const idx = state.layers.findIndex(l => l.id === id)
    if (idx <= 0) return
    const newLayers = [...state.layers]
    ;[newLayers[idx], newLayers[idx - 1]] = [newLayers[idx - 1], newLayers[idx]]
    updateLayers(newLayers)
  }

  const duplicateLayer = (id: string) => {
    const layer = state.layers.find(l => l.id === id)
    if (!layer || layer.type === 'background') return
    const dup = { ...JSON.parse(JSON.stringify(layer)), id: `${layer.type}-${Date.now()}`, name: `${layer.name} Copy` }
    if ('x' in dup) dup.x += 20
    if ('y' in dup) dup.y += 20
    updateLayers([...state.layers, dup])
    setState(prev => ({ ...prev, selectedLayerId: dup.id }))
  }

  // ── Render shape clip path ────────────────────────────────────

  const getClipPath = (shape: ShapeType): string => {
    switch (shape) {
      case 'circle': return 'circle(50% at 50% 50%)'
      case 'square': return 'none'
      case 'rounded-rect': return 'inset(0 round 16px)'
      case 'oval': return 'ellipse(50% 40% at 50% 50%)'
      default: return 'none'
    }
  }

  // ── Inline field components ───────────────────────────────────

  const PropGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )

  const PropRow = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: 6 }}>{children}</div>
  )

  const PropField = ({ label, value, onChange, type = 'number', min, max, step }: {
    label: string, value: number | string, onChange: (v: any) => void, type?: string, min?: number, max?: number, step?: number
  }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label style={{ fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 500 }}>{label}</label>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        onBlur={commitLayer}
        style={{
          width: '100%', minWidth: 0, padding: '4px 6px', fontSize: 11,
          background: 'var(--bg-input)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
          outline: 'none',
        }}
      />
    </div>
  )

  const ColorSwatch = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
    <div style={{
      width: '100%', height: 26, borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)', background: value,
      position: 'relative', overflow: 'hidden', cursor: 'pointer',
    }}>
      <input type="color" value={value.startsWith('rgba') ? '#ffffff' : value} onChange={e => { onChange(e.target.value); commitLayer() }}
        style={{ position: 'absolute', top: -10, left: -10, width: '200%', height: '200%', cursor: 'pointer', opacity: 0 }}
      />
    </div>
  )

  const ToggleBtn = ({ active, onClick, children, title }: { active?: boolean, onClick: () => void, children: React.ReactNode, title?: string }) => (
    <button
      title={title}
      onClick={() => { onClick(); commitLayer() }}
      style={{
        padding: '4px 8px', fontSize: 11, fontWeight: 600,
        background: active ? 'var(--accent-muted)' : 'var(--bg-input)',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        transition: 'all 150ms ease',
      }}
    >
      {children}
    </button>
  )

  // ── Canvas rendering ──────────────────────────────────────────

  const renderLayer = (layer: Layer, idx: number) => {
    if (!layer.visible) return null

    if (layer.type === 'background') {
      const bg = layer as BackgroundLayer
      return (
        <div
          key={bg.id}
          style={{
            position: 'absolute', inset: 0,
            background: bg.image ? `url(${bg.image}) center/cover no-repeat` : bg.color,
          }}
          onClick={(e) => { e.stopPropagation(); setState(prev => ({ ...prev, selectedLayerId: bg.id })) }}
        />
      )
    }

    if (layer.type === 'photo') {
      const p = layer as PhotoLayer
      const isSelected = state.selectedLayerId === p.id
      const clipPath = getClipPath(p.shape)
      const filterStr = `brightness(${p.brightness}%) contrast(${p.contrast}%) saturate(${p.saturate}%) blur(${p.blur}px)`

      return (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x - p.width / 2,
            top: p.y - p.height / 2,
            width: p.width,
            height: p.height,
            transform: `rotate(${p.rotation}deg)`,
            opacity: p.opacity,
            cursor: p.locked ? 'default' : (editingImageInMask && isSelected ? 'crosshair' : 'move'),
            zIndex: idx,
          }}
          onMouseDown={(e) => {
            if (p.locked) return
            if (editingImageInMask && isSelected) {
              handleMaskImageDrag(p.id, e)
            } else {
              handleCanvasMouseDown(p.id, e)
            }
          }}
          onWheel={(e) => {
            if (isSelected) handleMaskWheel(p.id, e)
          }}
        >
          {/* The clipped photo container */}
          <div style={{
            width: '100%', height: '100%',
            clipPath, overflow: 'hidden',
            border: `${p.borderWidth}px solid ${p.borderColor}`,
            borderRadius: p.shape === 'square' ? 0 : p.shape === 'rounded-rect' ? 16 : '50%',
            boxShadow: p.shadow ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Initials (always rendered behind image) */}
            <span style={{ position: 'absolute', fontSize: `${p.width * 0.3}px`, fontWeight: 800, color: 'rgba(255,255,255,0.8)', userSelect: 'none' }}>
              {student.fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
            </span>

            {/* Student Image */}
            {student.profileImage && (
              <img
                src={getImageUrl(student.profileImage)}
                alt={student.fullName}
                draggable={false}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%', objectFit: 'cover',
                  transform: `translate(${p.imgOffsetX}px, ${p.imgOffsetY}px) scale(${p.imgScale}) scaleX(${p.flipX ? -1 : 1}) scaleY(${p.flipY ? -1 : 1})`,
                  filter: filterStr,
                  pointerEvents: 'none',
                }}
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>

          {/* Selection outline + resize handle */}
          {isSelected && (
            <>
              <div style={{
                position: 'absolute', inset: -2,
                border: '2px solid var(--accent-primary)',
                borderRadius: p.shape === 'circle' || p.shape === 'oval' ? '50%' : p.shape === 'rounded-rect' ? 18 : 2,
                pointerEvents: 'none',
              }} />
              {/* Corner Resize Handle */}
              <div
                style={{
                  position: 'absolute', right: -6, bottom: -6,
                  width: 12, height: 12, borderRadius: 2,
                  background: 'var(--accent-primary)', cursor: 'nwse-resize',
                  border: '2px solid white',
                  zIndex: 10,
                }}
                onMouseDown={(e) => handleResize(p.id, e)}
              />
              {/* Right Edge Resize Handle */}
              <div
                style={{
                  position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)',
                  width: 8, height: 16, borderRadius: 2,
                  background: 'var(--accent-primary)', cursor: 'e-resize',
                  border: '1.5px solid white',
                  zIndex: 10,
                }}
                onMouseDown={(e) => handleEdgeResize(p.id, 'right', e)}
              />
              {/* Bottom Edge Resize Handle */}
              <div
                style={{
                  position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
                  width: 16, height: 8, borderRadius: 2,
                  background: 'var(--accent-primary)', cursor: 's-resize',
                  border: '1.5px solid white',
                  zIndex: 10,
                }}
                onMouseDown={(e) => handleEdgeResize(p.id, 'bottom', e)}
              />
            </>
          )}
        </div>
      )
    }

    if (layer.type === 'image') {
      const imgLayer = layer as ImageLayer
      const isSelected = state.selectedLayerId === imgLayer.id

      return (
        <div
          key={imgLayer.id}
          style={{
            position: 'absolute',
            left: imgLayer.x - imgLayer.width / 2,
            top: imgLayer.y - imgLayer.height / 2,
            width: imgLayer.width,
            height: imgLayer.height,
            transform: `rotate(${imgLayer.rotation}deg)`,
            opacity: imgLayer.opacity,
            cursor: imgLayer.locked ? 'default' : 'move',
            zIndex: idx,
          }}
          onMouseDown={(e) => {
            if (!imgLayer.locked) handleCanvasMouseDown(imgLayer.id, e)
            else { e.stopPropagation(); setState(prev => ({ ...prev, selectedLayerId: imgLayer.id })) }
          }}
        >
          <img
            src={imgLayer.image}
            alt={imgLayer.name}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
            }}
          />

          {isSelected && (
            <>
              <div style={{
                position: 'absolute', inset: -2,
                border: '2px solid var(--accent-primary)',
                pointerEvents: 'none',
              }} />
              {/* Corner Resize Handle */}
              <div
                style={{
                  position: 'absolute', right: -6, bottom: -6,
                  width: 12, height: 12, borderRadius: 2,
                  background: 'var(--accent-primary)', cursor: 'nwse-resize',
                  border: '2px solid white',
                  zIndex: 10,
                }}
                onMouseDown={(e) => handleResize(imgLayer.id, e)}
              />
              {/* Right Edge Resize Handle */}
              <div
                style={{
                  position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)',
                  width: 8, height: 16, borderRadius: 2,
                  background: 'var(--accent-primary)', cursor: 'e-resize',
                  border: '1.5px solid white',
                  zIndex: 10,
                }}
                onMouseDown={(e) => handleEdgeResize(imgLayer.id, 'right', e)}
              />
              {/* Bottom Edge Resize Handle */}
              <div
                style={{
                  position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
                  width: 16, height: 8, borderRadius: 2,
                  background: 'var(--accent-primary)', cursor: 's-resize',
                  border: '1.5px solid white',
                  zIndex: 10,
                }}
                onMouseDown={(e) => handleEdgeResize(imgLayer.id, 'bottom', e)}
              />
            </>
          )}
        </div>
      )
    }

    if (layer.type === 'text') {
      const t = layer as TextLayer
      const isSelected = state.selectedLayerId === t.id

      // Compile text outline and drop shadow styles
      const shadowParts = []
      if (t.outlineWidth && t.outlineWidth > 0) {
        const w = t.outlineWidth
        const c = t.outlineColor || '#000000'
        shadowParts.push(
          `${w}px 0px 0 ${c}`,
          `-${w}px 0px 0 ${c}`,
          `0px ${w}px 0 ${c}`,
          `0px -${w}px 0 ${c}`,
          `${w}px ${w}px 0 ${c}`,
          `-${w}px -${w}px 0 ${c}`,
          `${w}px -${w}px 0 ${c}`,
          `-${w}px ${w}px 0 ${c}`
        )
      }
      if (t.shadowBlur && t.shadowBlur > 0) {
        const ox = t.shadowOffsetX || 0
        const oy = t.shadowOffsetY || 2
        const b = t.shadowBlur
        const c = t.shadowColor || 'rgba(0,0,0,0.5)'
        shadowParts.push(`${ox}px ${oy}px ${b}px ${c}`)
      }
      const textShadowValue = shadowParts.length > 0 ? shadowParts.join(', ') : 'none'

      return (
        <div
          key={t.id}
          style={{
            position: 'absolute',
            left: t.x, top: t.y,
            transform: `translate(-50%, 0) rotate(${t.rotation}deg)`,
            fontSize: t.fontSize,
            fontFamily: `'${t.fontFamily}', sans-serif`,
            fontWeight: t.fontWeight,
            fontStyle: t.italic ? 'italic' : 'normal',
            textDecoration: t.underline ? 'underline' : 'none',
            color: t.color,
            opacity: t.opacity,
            letterSpacing: t.letterSpacing,
            lineHeight: t.lineHeight,
            textAlign: t.textAlign,
            whiteSpace: 'pre-wrap',
            cursor: t.locked ? 'default' : 'move',
            userSelect: 'none',
            zIndex: idx,
            outline: isSelected ? '2px dashed var(--accent-primary)' : 'none',
            outlineOffset: 4,
            textShadow: textShadowValue,
          }}
          onMouseDown={(e) => {
            if (!t.locked) handleCanvasMouseDown(t.id, e)
            else { e.stopPropagation(); setState(prev => ({ ...prev, selectedLayerId: t.id })) }
          }}
        >
          {(() => {
            let textValue = t.text
            textValue = textValue.replace(/{name}/g, student.fullName)
            textValue = textValue.replace(/{firstName}/g, student.fullName.split(' ')[0])
            textValue = textValue.replace(/{date}/g, (() => {
              const mn = ['January','February','March','April','May','June','July','August','September','October','November','December']
              const d = new Date(student.dateOfBirth)
              return `${mn[d.getMonth()]} ${d.getDate()}`
            })())
            textValue = textValue.replace(/{programme}/g, student.degreeProgramme)
            textValue = textValue.replace(/{batch}/g, student.batch)
            return textValue
          })()}
        </div>
      )
    }

    return null
  }

  // ── Properties panel for selected layer ───────────────────────

  const renderProperties = () => {
    if (!selectedLayer) {
      return (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
          Select a layer to edit its properties
        </div>
      )
    }

    if (selectedLayer.type === 'background') {
      const bg = selectedLayer as BackgroundLayer
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PropGroup label="Background">
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={async () => {
                  const p = await window.api.dialog.openFile({ filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }] })
                  if (p) { updateLayer(bg.id, { image: `file://${p}` }); commitLayer() }
                }}
              >
                <Upload size={12} style={{ marginRight: 4 }} /> Upload Template
              </button>
              {bg.image && (
                <button className="btn btn-ghost btn-sm" onClick={() => { updateLayer(bg.id, { image: null }); commitLayer() }}>
                  <X size={12} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <label style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>Color (when no image)</label>
              <ColorSwatch value={bg.color} onChange={v => updateLayer(bg.id, { color: v })} />
            </div>
          </PropGroup>

          <PropGroup label="Template Presets">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '6px 10px', height: 'auto' }}
                onClick={() => {
                  const newLayers = createDefaultLayers(student)
                  updateLayers(newLayers)
                  setState(prev => ({ ...prev, canvasWidth: 500, canvasHeight: 500 }))
                  showToast('Default gradient layout applied!')
                }}
              >
                🌈 Default Gradient Layout
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '6px 10px', height: 'auto' }}
                onClick={() => {
                  const fitLayers: Layer[] = [
                    {
                      type: 'background',
                      id: 'bg',
                      name: 'Background',
                      image: '/TemplateFIT.png',
                      color: '#0F172A',
                      visible: true,
                      locked: true,
                    },
                    {
                      type: 'photo',
                      id: 'photo',
                      name: 'Student Photo',
                      x: 251,
                      y: 186,
                      width: 175,
                      height: 175,
                      rotation: 0,
                      flipX: false,
                      flipY: false,
                      shape: 'square',
                      borderWidth: 0,
                      borderColor: 'transparent',
                      shadow: false,
                      opacity: 1,
                      imgOffsetX: 0,
                      imgOffsetY: 0,
                      imgScale: 1,
                      brightness: 100,
                      contrast: 100,
                      saturate: 100,
                      blur: 0,
                      visible: true,
                      locked: false,
                    },
                    {
                      type: 'image',
                      id: 'insta_frame',
                      name: 'Instagram Frame Overlay',
                      image: '/fit_frame.png',
                      x: 244,
                      y: 209,
                      width: 210,
                      height: 245,
                      rotation: 0,
                      opacity: 1,
                      visible: true,
                      locked: false,
                    },
                    {
                      type: 'text',
                      id: 'name',
                      name: 'Student Name',
                      text: '{name}',
                      x: 250,
                      y: 345,
                      fontSize: 22,
                      fontFamily: 'Fredoka One',
                      fontWeight: 800,
                      italic: false,
                      underline: false,
                      color: '#ffffff',
                      opacity: 1,
                      letterSpacing: 0,
                      lineHeight: 1.2,
                      textAlign: 'center',
                      rotation: 0,
                      visible: true,
                      locked: false,
                      outlineWidth: 3,
                      outlineColor: '#000000',
                      shadowBlur: 8,
                      shadowColor: 'rgba(0,0,0,0.6)',
                      shadowOffsetX: 0,
                      shadowOffsetY: 4,
                    },
                    {
                      type: 'text',
                      id: 'date',
                      name: 'Birthday Date',
                      text: '{date}',
                      x: 250,
                      y: 378,
                      fontSize: 13,
                      fontFamily: 'Montserrat',
                      fontWeight: 800,
                      italic: false,
                      underline: false,
                      color: '#F59E0B',
                      opacity: 1,
                      letterSpacing: 0,
                      lineHeight: 1.4,
                      textAlign: 'center',
                      rotation: 0,
                      visible: true,
                      locked: false,
                      outlineWidth: 2,
                      outlineColor: '#000000',
                      shadowBlur: 4,
                      shadowColor: 'rgba(0,0,0,0.5)',
                      shadowOffsetX: 0,
                      shadowOffsetY: 2,
                    }
                  ]
                  updateLayers(fitLayers)
                  setState(prev => ({ ...prev, canvasWidth: 500, canvasHeight: 500 }))
                  showToast('FIT template preset applied!')
                }}
              >
                🎓 FIT Birthday Flyer (Instagram Style)
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '6px 10px', height: 'auto' }}
                onClick={() => {
                  const fitLayersRebuilt: Layer[] = [
                    {
                      type: 'background',
                      id: 'bg',
                      name: 'Background Color',
                      image: null,
                      color: '#0c050a',
                      visible: true,
                      locked: true,
                    },
                    {
                      type: 'image',
                      id: 'bg_overlay',
                      name: 'Background Elements',
                      image: '/fit_bg_overlay.png',
                      x: 250,
                      y: 250,
                      width: 500,
                      height: 500,
                      rotation: 0,
                      opacity: 1,
                      visible: true,
                      locked: true,
                    },
                    {
                      type: 'photo',
                      id: 'photo',
                      name: 'Student Photo',
                      x: 251,
                      y: 186,
                      width: 175,
                      height: 175,
                      rotation: 0,
                      flipX: false,
                      flipY: false,
                      shape: 'square',
                      borderWidth: 0,
                      borderColor: 'transparent',
                      shadow: false,
                      opacity: 1,
                      imgOffsetX: 0,
                      imgOffsetY: 0,
                      imgScale: 1,
                      brightness: 100,
                      contrast: 100,
                      saturate: 100,
                      blur: 0,
                      visible: true,
                      locked: false,
                    },
                    {
                      type: 'image',
                      id: 'insta_frame',
                      name: 'Instagram Frame',
                      image: '/fit_frame.png',
                      x: 244,
                      y: 209,
                      width: 210,
                      height: 245,
                      rotation: 0,
                      opacity: 1,
                      visible: true,
                      locked: false,
                    },
                    {
                      type: 'image',
                      id: 'balloons_left',
                      name: 'Balloons Left',
                      image: '/fit_balloons_left.png',
                      x: 67,
                      y: 240,
                      width: 134,
                      height: 240,
                      rotation: 0,
                      opacity: 1,
                      visible: true,
                      locked: false,
                    },
                    {
                      type: 'image',
                      id: 'balloons_right',
                      name: 'Balloons Right',
                      image: '/fit_balloons_right.png',
                      x: 435,
                      y: 215,
                      width: 129,
                      height: 273,
                      rotation: 0,
                      opacity: 1,
                      visible: true,
                      locked: false,
                    },
                    {
                      type: 'image',
                      id: 'happy_birthday',
                      name: 'Happy Birthday Title',
                      image: '/fit_happy_birthday.png',
                      x: 243,
                      y: 54,
                      width: 273,
                      height: 104,
                      rotation: 0,
                      opacity: 1,
                      visible: true,
                      locked: false,
                    },
                    {
                      type: 'image',
                      id: 'confetti',
                      name: 'Confetti & Ribbons',
                      image: '/fit_confetti.png',
                      x: 250,
                      y: 250,
                      width: 500,
                      height: 500,
                      rotation: 0,
                      opacity: 1,
                      visible: true,
                      locked: true,
                    },
                    {
                      type: 'text',
                      id: 'name',
                      name: 'Student Name',
                      text: '{name}',
                      x: 250,
                      y: 332,
                      fontSize: 16,
                      fontFamily: 'Inter',
                      fontWeight: 800,
                      italic: false,
                      underline: false,
                      color: '#93C5FD',
                      opacity: 1,
                      letterSpacing: 0,
                      lineHeight: 1.2,
                      textAlign: 'center',
                      rotation: 0,
                      visible: true,
                      locked: false,
                    },
                    {
                      type: 'text',
                      id: 'date',
                      name: 'Birthday Date',
                      text: '{date}',
                      x: 250,
                      y: 354,
                      fontSize: 12,
                      fontFamily: 'Inter',
                      fontWeight: 700,
                      italic: false,
                      underline: false,
                      color: '#F59E0B',
                      opacity: 1,
                      letterSpacing: 0,
                      lineHeight: 1.4,
                      textAlign: 'center',
                      rotation: 0,
                      visible: true,
                      locked: false,
                    },
                    {
                      type: 'text',
                      id: 'fit-message',
                      name: 'Birthday Message',
                      text: "Happy birthday to our wonderful batchmate! Hope your day\nis filled with smiles, good vibes, and moments you'll always\nremember. Wishing you success and a bright journey ahead!",
                      x: 250,
                      y: 382,
                      fontSize: 8.5,
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      italic: true,
                      underline: false,
                      color: '#ffffff',
                      opacity: 0.95,
                      letterSpacing: 0,
                      lineHeight: 1.3,
                      textAlign: 'center',
                      rotation: 0,
                      visible: true,
                      locked: false,
                    },
                    {
                      type: 'text',
                      id: 'programme',
                      name: 'Programme',
                      text: '{programme} — Batch {batch}',
                      x: 250,
                      y: 442,
                      fontSize: 9.5,
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      italic: false,
                      underline: false,
                      color: '#93C5FD',
                      opacity: 1,
                      letterSpacing: 0,
                      lineHeight: 1.3,
                      textAlign: 'center',
                      rotation: 0,
                      visible: true,
                      locked: false,
                    },
                    {
                      type: 'text',
                      id: 'fit-footer',
                      name: 'Footer Credits',
                      text: "Faculty of Information Technology  |  University of Moratuwa",
                      x: 250,
                      y: 468,
                      fontSize: 7.5,
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      italic: false,
                      underline: false,
                      color: 'rgba(255,255,255,0.4)',
                      opacity: 1,
                      letterSpacing: 1.2,
                      lineHeight: 1.3,
                      textAlign: 'center',
                      rotation: 0,
                      visible: true,
                      locked: false,
                    }
                  ]
                  updateLayers(fitLayersRebuilt)
                  setState(prev => ({ ...prev, canvasWidth: 500, canvasHeight: 500 }))
                  showToast('FIT Layer-by-Layer preset applied!')
                }}
              >
                🎓 FIT Rebuilt (Layer-by-Layer)
              </button>
            </div>
          </PropGroup>
        </div>
      )
    }

    if (selectedLayer.type === 'photo') {
      const p = selectedLayer as PhotoLayer
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
          <PropGroup label="Position & Size">
            <PropRow>
              <PropField label="X" value={Math.round(p.x)} onChange={v => updateLayer(p.id, { x: v })} />
              <PropField label="Y" value={Math.round(p.y)} onChange={v => updateLayer(p.id, { y: v })} />
              <PropField label="W" value={Math.round(p.width)} onChange={v => updateLayer(p.id, { width: v })} min={20} />
              <PropField label="H" value={Math.round(p.height)} onChange={v => updateLayer(p.id, { height: v })} min={20} />
            </PropRow>
          </PropGroup>

          <PropGroup label="Shape Mask">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {(['circle', 'square', 'rounded-rect', 'oval'] as ShapeType[]).map(s => (
                <ToggleBtn key={s} active={p.shape === s} onClick={() => updateLayer(p.id, { shape: s })}>
                  {s === 'circle' ? '●' : s === 'square' ? '■' : s === 'rounded-rect' ? '▢' : '⬮'}
                </ToggleBtn>
              ))}
            </div>
          </PropGroup>

          <PropGroup label="Image Inside Mask">
            <ToggleBtn active={editingImageInMask} onClick={() => setEditingImageInMask(!editingImageInMask)}>
              <Move size={12} /> {editingImageInMask ? 'Done Adjusting' : 'Adjust Photo Inside'}
            </ToggleBtn>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {editingImageInMask ? 'Drag photo inside mask. Scroll to zoom.' : 'Click to enter mask editing mode'}
            </div>
            <PropRow>
              <PropField label="Offset X" value={Math.round(p.imgOffsetX)} onChange={v => updateLayer(p.id, { imgOffsetX: v })} />
              <PropField label="Offset Y" value={Math.round(p.imgOffsetY)} onChange={v => updateLayer(p.id, { imgOffsetY: v })} />
              <PropField label="Zoom" value={p.imgScale.toFixed(2)} onChange={v => updateLayer(p.id, { imgScale: v })} step={0.05} min={0.1} max={5} />
            </PropRow>
          </PropGroup>

          <PropGroup label="Transform">
            <PropRow>
              <PropField label="Rotation" value={p.rotation} onChange={v => updateLayer(p.id, { rotation: v })} min={-360} max={360} />
              <PropField label="Opacity" value={p.opacity} onChange={v => updateLayer(p.id, { opacity: v })} min={0} max={1} step={0.05} />
            </PropRow>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <ToggleBtn active={p.flipX} onClick={() => updateLayer(p.id, { flipX: !p.flipX })} title="Flip Horizontal">
                <FlipHorizontal size={12} />
              </ToggleBtn>
              <ToggleBtn active={p.flipY} onClick={() => updateLayer(p.id, { flipY: !p.flipY })} title="Flip Vertical">
                <FlipVertical size={12} />
              </ToggleBtn>
              <ToggleBtn onClick={() => { updateLayer(p.id, { imgOffsetX: 0, imgOffsetY: 0, imgScale: 1, rotation: 0, flipX: false, flipY: false }); commitLayer() }} title="Reset">
                <RotateCcw size={12} /> Reset
              </ToggleBtn>
            </div>
          </PropGroup>

          <PropGroup label="Border">
            <PropRow>
              <PropField label="Width" value={p.borderWidth} onChange={v => updateLayer(p.id, { borderWidth: v })} min={0} max={20} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <label style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>Color</label>
                <ColorSwatch value={p.borderColor} onChange={v => updateLayer(p.id, { borderColor: v })} />
              </div>
            </PropRow>
            <div style={{ marginTop: 6 }}>
              <ToggleBtn active={p.shadow} onClick={() => updateLayer(p.id, { shadow: !p.shadow })}>
                Shadow {p.shadow ? 'ON' : 'OFF'}
              </ToggleBtn>
            </div>
          </PropGroup>

          <PropGroup label="Filters">
            <PropRow>
              <PropField label="Brightness" value={p.brightness} onChange={v => updateLayer(p.id, { brightness: v })} min={0} max={200} />
              <PropField label="Contrast" value={p.contrast} onChange={v => updateLayer(p.id, { contrast: v })} min={0} max={200} />
            </PropRow>
            <PropRow>
              <PropField label="Saturation" value={p.saturate} onChange={v => updateLayer(p.id, { saturate: v })} min={0} max={200} />
              <PropField label="Blur" value={p.blur} onChange={v => updateLayer(p.id, { blur: v })} min={0} max={20} step={0.5} />
            </PropRow>
          </PropGroup>
        </div>
      )
    }

    if (selectedLayer.type === 'image') {
      const imgLayer = selectedLayer as ImageLayer
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
          <PropGroup label="Position & Size">
            <PropRow>
              <PropField label="X" value={Math.round(imgLayer.x)} onChange={v => updateLayer(imgLayer.id, { x: v })} />
              <PropField label="Y" value={Math.round(imgLayer.y)} onChange={v => updateLayer(imgLayer.id, { y: v })} />
              <PropField label="W" value={Math.round(imgLayer.width)} onChange={v => updateLayer(imgLayer.id, { width: v })} min={20} />
              <PropField label="H" value={Math.round(imgLayer.height)} onChange={v => updateLayer(imgLayer.id, { height: v })} min={20} />
            </PropRow>
          </PropGroup>

          <PropGroup label="Transform">
            <PropRow>
              <PropField label="Rotation" value={imgLayer.rotation} onChange={v => updateLayer(imgLayer.id, { rotation: v })} min={-360} max={360} />
              <PropField label="Opacity" value={imgLayer.opacity} onChange={v => updateLayer(imgLayer.id, { opacity: v })} min={0} max={1} step={0.05} />
            </PropRow>
          </PropGroup>

          <PropGroup label="Image Source">
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={async () => {
                  const p = await window.api.dialog.openFile({ filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }] })
                  if (p) { updateLayer(imgLayer.id, { image: `file://${p}` }); commitLayer() }
                }}
              >
                <Upload size={12} style={{ marginRight: 4 }} /> Replace Image
              </button>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>
              {imgLayer.image}
            </div>
          </PropGroup>
        </div>
      )
    }

    if (selectedLayer.type === 'text') {
      const t = selectedLayer as TextLayer
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
          <PropGroup label="Text Content">
            <textarea
              value={t.text}
              onChange={e => updateLayer(t.id, { text: e.target.value })}
              onBlur={commitLayer}
              rows={2}
              placeholder="Enter text…"
              style={{
                width: '100%', padding: '6px 8px', fontSize: 12, resize: 'vertical',
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)', outline: 'none',
              }}
            />
            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 4 }}>
              Smart tags: {'{'}name{'}'}, {'{'}firstName{'}'}, {'{'}date{'}'}, {'{'}programme{'}'}, {'{'}batch{'}'}
            </div>
          </PropGroup>

          <PropGroup label="Font">
            <select
              value={t.fontFamily}
              onChange={e => { updateLayer(t.id, { fontFamily: e.target.value }); commitLayer() }}
              style={{
                width: '100%', padding: '4px 6px', fontSize: 11, marginBottom: 6,
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none',
              }}
            >
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <PropRow>
              <PropField label="Size" value={t.fontSize} onChange={v => updateLayer(t.id, { fontSize: v })} min={6} max={200} />
              <PropField label="Weight" value={t.fontWeight} onChange={v => updateLayer(t.id, { fontWeight: v })} min={100} max={900} step={100} />
            </PropRow>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <ToggleBtn active={t.fontWeight >= 700} onClick={() => updateLayer(t.id, { fontWeight: t.fontWeight >= 700 ? 400 : 700 })} title="Bold">
                <strong>B</strong>
              </ToggleBtn>
              <ToggleBtn active={t.italic} onClick={() => updateLayer(t.id, { italic: !t.italic })} title="Italic">
                <em>I</em>
              </ToggleBtn>
              <ToggleBtn active={t.underline} onClick={() => updateLayer(t.id, { underline: !t.underline })} title="Underline">
                <span style={{ textDecoration: 'underline' }}>U</span>
              </ToggleBtn>
            </div>
          </PropGroup>

          <PropGroup label="Color">
            <ColorSwatch value={t.color} onChange={v => updateLayer(t.id, { color: v })} />
          </PropGroup>

          <PropGroup label="Text Outline">
            <PropRow>
              <PropField label="Thickness" value={t.outlineWidth || 0} onChange={v => updateLayer(t.id, { outlineWidth: v })} min={0} max={15} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <label style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>Color</label>
                <ColorSwatch value={t.outlineColor || '#000000'} onChange={v => updateLayer(t.id, { outlineColor: v })} />
              </div>
            </PropRow>
          </PropGroup>

          <PropGroup label="Text Drop Shadow">
            <PropRow>
              <PropField label="Shadow Blur" value={t.shadowBlur || 0} onChange={v => updateLayer(t.id, { shadowBlur: v })} min={0} max={25} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <label style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>Shadow Color</label>
                <ColorSwatch value={t.shadowColor || 'rgba(0,0,0,0.5)'} onChange={v => updateLayer(t.id, { shadowColor: v })} />
              </div>
            </PropRow>
            <div style={{ marginTop: 6 }}>
              <PropRow>
                <PropField label="Offset X" value={t.shadowOffsetX || 0} onChange={v => updateLayer(t.id, { shadowOffsetX: v })} min={-20} max={20} />
                <PropField label="Offset Y" value={t.shadowOffsetY || 2} onChange={v => updateLayer(t.id, { shadowOffsetY: v })} min={-20} max={20} />
              </PropRow>
            </div>
          </PropGroup>

          <PropGroup label="Position">
            <PropRow>
              <PropField label="X" value={Math.round(t.x)} onChange={v => updateLayer(t.id, { x: v })} />
              <PropField label="Y" value={Math.round(t.y)} onChange={v => updateLayer(t.id, { y: v })} />
              <PropField label="Rotation" value={t.rotation} onChange={v => updateLayer(t.id, { rotation: v })} min={-360} max={360} />
            </PropRow>
          </PropGroup>

          <PropGroup label="Spacing">
            <PropRow>
              <PropField label="Letter" value={t.letterSpacing} onChange={v => updateLayer(t.id, { letterSpacing: v })} step={0.5} />
              <PropField label="Line H" value={t.lineHeight} onChange={v => updateLayer(t.id, { lineHeight: v })} step={0.1} min={0.5} max={3} />
              <PropField label="Opacity" value={t.opacity} onChange={v => updateLayer(t.id, { opacity: v })} step={0.05} min={0} max={1} />
            </PropRow>
          </PropGroup>

          <PropGroup label="Alignment">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              <ToggleBtn active={t.textAlign === 'left'} onClick={() => updateLayer(t.id, { textAlign: 'left' })}>Left</ToggleBtn>
              <ToggleBtn active={t.textAlign === 'center'} onClick={() => updateLayer(t.id, { textAlign: 'center' })}>Center</ToggleBtn>
              <ToggleBtn active={t.textAlign === 'right'} onClick={() => updateLayer(t.id, { textAlign: 'right' })}>Right</ToggleBtn>
            </div>
          </PropGroup>
        </div>
      )
    }

    return null
  }

  // ── MAIN RENDER ───────────────────────────────────────────────

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'var(--base-bg-color)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* ── Top Toolbar ──────────────────────────────────────────── */}
      <div style={{
        height: 48, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 16px 0 80px',
        background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        // @ts-ignore — Electron drag region
        WebkitAppRegion: 'drag',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, WebkitAppRegion: 'no-drag' } as any}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Flyer Designer
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            — {student.fullName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, WebkitAppRegion: 'no-drag' } as any}>
          <button className="btn btn-ghost btn-sm" onClick={undo} disabled={historyIdx <= 0} title="Undo (⌘Z)">
            <Undo2 size={14} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo (⇧⌘Z)">
            <Redo2 size={14} />
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

          {/* Zoom controls */}
          <button className="btn btn-ghost btn-sm" onClick={() => setState(prev => ({ ...prev, zoom: Math.max(0.25, prev.zoom - 0.1) }))}>
            <ZoomOut size={14} />
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 40, textAlign: 'center' }}>
            {Math.round(state.zoom * 100)}%
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setState(prev => ({ ...prev, zoom: Math.min(3, prev.zoom + 0.1) }))}>
            <ZoomIn size={14} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setState(prev => ({ ...prev, zoom: 0.75 }))} title="Fit">
            <Maximize size={14} />
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

          <button
            className="btn btn-primary btn-sm"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download size={14} style={{ marginRight: 4 }} />
            {exporting ? 'Exporting…' : 'Export'}
          </button>

          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            title="Close Designer"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <X size={14} /> Back
          </button>
        </div>
      </div>

      {/* ── Body (Canvas + Right Panel) ──────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left Tools Bar ─────────────────────────────────────── */}
        <div style={{
          width: 52, display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 4, padding: '12px 0',
          background: 'rgba(0,0,0,0.2)', borderRight: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <ToolBtn icon={<MousePointer size={18} />} active={true} onClick={() => {}} label="Select" />
          <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <ToolBtn icon={<Type size={18} />} onClick={addTextLayer} label="Add Text" />
          <ToolBtn icon={<Image size={18} />} onClick={async () => {
            const p = await window.api.dialog.openFile({ filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }] })
            if (p) {
              const bg = state.layers.find(l => l.type === 'background') as BackgroundLayer
              if (bg) { updateLayer(bg.id, { image: `file://${p}` }); commitLayer() }
            }
          }} label="Upload Template" />
        </div>

        {/* ── Student Switcher Sidebar ─────────────────────────────── */}
        {students && students.length > 0 && (
          <div style={{
            width: 190, display: 'flex', flexDirection: 'column',
            background: 'rgba(0,0,0,0.15)', borderRight: '1px solid var(--border)',
            flexShrink: 0, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 10px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
              Birthdays switching ({students.length})
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {students.map(s => {
                const isActive = s.id === student.id
                const dob = new Date(s.dateOfBirth)
                return (
                  <div
                    key={s.id}
                    onClick={() => onSwitchStudent && onSwitchStudent(s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 8px', borderRadius: 'var(--radius-md)',
                      background: isActive ? 'var(--accent-muted)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--accent-primary)' : 'transparent'}`,
                      cursor: 'pointer', transition: 'all 120ms ease',
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      overflow: 'hidden', background: 'var(--accent-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, flexShrink: 0,
                    }}>
                      {s.profileImage ? (
                        <img src={getImageUrl(s.profileImage)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        s.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {s.fullName}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                        {dob.getDate()} {dob.toLocaleString('default', { month: 'short' })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Canvas Area ────────────────────────────────────────── */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, transparent 0% 50%) 0 0 / 20px 20px',
          overflow: 'auto', position: 'relative',
        }}
          onClick={() => setState(prev => ({ ...prev, selectedLayerId: null }))}
        >
          <div
            ref={canvasRef}
            style={{
              width: state.canvasWidth,
              height: state.canvasHeight,
              position: 'relative',
              transform: `scale(${state.zoom})`,
              transformOrigin: 'center center',
              borderRadius: 0,
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {state.layers.map(renderLayer)}
          </div>
        </div>

        {/* ── Right Panel ────────────────────────────────────────── */}
        <div style={{
          width: 280, display: 'flex', flexDirection: 'column',
          background: 'rgba(0,0,0,0.25)', borderLeft: '1px solid var(--border)',
          flexShrink: 0, overflow: 'hidden',
        }}>
          {/* Tab Bar */}
          <div style={{
            display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}>
            {(['layers', 'properties', 'export'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '10px 0', fontSize: 11, fontWeight: 600,
                  textTransform: 'capitalize', cursor: 'pointer',
                  color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  background: 'transparent', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  transition: 'all 150ms',
                }}
              >
                {tab === 'layers' ? 'Layers' : tab === 'properties' ? 'Properties' : 'Export'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'layers' && (
              <div style={{ padding: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 4px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {state.layers.length} layers
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '2px 6px', fontSize: 9 }} onClick={addTextLayer}>
                      <Plus size={10} style={{ marginRight: 2 }} /> Text
                    </button>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '2px 6px', fontSize: 9 }} onClick={addImageLayer}>
                      <Plus size={10} style={{ marginRight: 2 }} /> Image
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 2 }}>
                  {state.layers.map((layer) => (
                    <div
                      key={layer.id}
                      onClick={() => { setState(prev => ({ ...prev, selectedLayerId: layer.id })); setActiveTab('properties') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                        background: state.selectedLayerId === layer.id ? 'var(--accent-muted)' : 'transparent',
                        border: state.selectedLayerId === layer.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                        cursor: 'pointer', transition: 'all 100ms',
                      }}
                    >
                      {/* Layer icon */}
                      <span style={{ fontSize: 12, width: 16, textAlign: 'center', flexShrink: 0 }}>
                        {layer.type === 'background' ? '🖼' : layer.type === 'photo' ? '👤' : layer.type === 'image' ? '🖼' : '✏️'}
                      </span>

                      {/* Layer name */}
                      <span style={{
                        fontSize: 11, fontWeight: 500, flex: 1,
                        color: layer.visible ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textDecoration: layer.visible ? 'none' : 'line-through',
                      }}>
                        {layer.name}
                      </span>

                      {/* Layer actions */}
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                        <button
                          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2, display: 'flex' }}
                          onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); commitLayer() }}
                          title={layer.visible ? 'Hide' : 'Show'}
                        >
                          {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                        <button
                          style={{ background: 'none', border: 'none', color: layer.locked ? 'var(--accent-primary)' : 'var(--text-tertiary)', cursor: 'pointer', padding: 2, display: 'flex' }}
                          onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); commitLayer() }}
                          title={layer.locked ? 'Unlock' : 'Lock'}
                        >
                          {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>
                        {layer.type !== 'background' && (
                          <>
                            <button
                              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2, display: 'flex' }}
                              onClick={(e) => { e.stopPropagation(); moveLayerUp(layer.id) }}
                              title="Move Up"
                            >
                              <ChevronUp size={12} />
                            </button>
                            <button
                              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2, display: 'flex' }}
                              onClick={(e) => { e.stopPropagation(); moveLayerDown(layer.id) }}
                              title="Move Down"
                            >
                              <ChevronDown size={12} />
                            </button>
                            <button
                              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2, display: 'flex' }}
                              onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id) }}
                              title="Duplicate"
                            >
                              <Copy size={12} />
                            </button>
                          </>
                        )}
                        {(layer.type === 'text' || layer.type === 'image') && layer.id !== 'name' && (
                          <button
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2, display: 'flex' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              updateLayers(state.layers.filter(l => l.id !== layer.id))
                              if (state.selectedLayerId === layer.id) setState(prev => ({ ...prev, selectedLayerId: null }))
                            }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'properties' && renderProperties()}

            {activeTab === 'export' && (
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PropGroup label="Export Size">
                  <select
                    value={exportPreset}
                    onChange={e => setExportPreset(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '6px 8px', fontSize: 11,
                      background: 'var(--bg-input)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none',
                    }}
                  >
                    {EXPORT_PRESETS.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
                  </select>
                </PropGroup>

                <PropGroup label={`Quality: ${exportQuality}%`}>
                  <input
                    type="range"
                    min={60}
                    max={100}
                    value={exportQuality}
                    onChange={e => setExportQuality(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-tertiary)' }}>
                    <span>Smaller file</span>
                    <span>Best quality</span>
                  </div>
                </PropGroup>

                <PropGroup label="Canvas Size">
                  <PropRow>
                    <PropField label="Width" value={state.canvasWidth} onChange={v => setState(prev => ({ ...prev, canvasWidth: v }))} min={100} max={4000} />
                    <PropField label="Height" value={state.canvasHeight} onChange={v => setState(prev => ({ ...prev, canvasHeight: v }))} min={100} max={4000} />
                  </PropRow>
                </PropGroup>

                <div style={{ marginTop: 8 }}>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={handleExport}
                    disabled={exporting}
                  >
                    <Download size={14} style={{ marginRight: 6 }} />
                    {exporting ? 'Exporting…' : exportQuality === 100 ? 'Export as PNG' : `Export as JPG (${exportQuality}%)`}
                  </button>
                </div>

                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                  <strong>Quick presets:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {EXPORT_PRESETS.slice(1).map((p, i) => (
                      <button
                        key={i}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 8px', fontSize: 9 }}
                        onClick={() => setExportPreset(i + 1)}
                      >
                        {p.label.split('(')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Toast ────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 24px', borderRadius: 'var(--radius-full)',
          background: 'var(--accent-primary)', color: 'white',
          fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 9999,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ── Tool button ──────────────────────────────────────────────────

function ToolBtn({ icon, active, onClick, label }: { icon: React.ReactNode, active?: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
        background: active ? 'var(--accent-muted)' : 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        border: active ? '1px solid var(--accent-primary)' : '1px solid transparent',
        transition: 'all 150ms',
      }}
    >
      {icon}
    </button>
  )
}
