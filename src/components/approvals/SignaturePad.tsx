import { useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/Button'
import { Trash2, CheckCircle2 } from 'lucide-react'
import { SIG_MARKER } from '@/lib/formUrlEncoder'

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  onClear?: () => void
  savedSignature?: string | null
  disabled?: boolean
}

export function SignaturePad({ onSave, onClear, savedSignature, disabled }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null)

  const handleClear = () => {
    sigRef.current?.clear()
    onClear?.()
  }

  const handleSave = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const data = sigRef.current.toDataURL('image/png')
      onSave(data)
    }
  }

  // כאשר החתימה הגיעה מ-URL (מסומנת כ-SIG_MARKER), מציג אינדיקטור טקסטואלי
  if (savedSignature === SIG_MARKER) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
        <span className="text-sm font-medium text-green-700">חתום ✓</span>
      </div>
    )
  }

  // כאשר יש חתימה אמיתית (data URL), מציג את התמונה
  if (savedSignature) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-2">
        <img
          src={savedSignature}
          alt="חתימה"
          className="h-20 w-full max-w-[200px] object-contain"
        />
        {!disabled && onClear && (
          <Button type="button" variant="outline" size="sm" onClick={onClear} className="mt-2">
            נקה חתימה
          </Button>
        )}
      </div>
    )
  }

  // לוח חתימה ריק (לחתימה חדשה)
  return (
    <div className="space-y-2">
      <div
        className="overflow-hidden rounded-lg border border-slate-300"
        style={{ direction: 'ltr' }}
      >
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            className: 'w-full h-24 bg-slate-50',
            style: { width: '100%', height: 96 },
          }}
          penColor="black"
          backgroundColor="rgb(248 250 252)"
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleClear} disabled={disabled}>
          <Trash2 className="ml-1 h-4 w-4" />
          נקה
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={disabled}>
          שמור חתימה
        </Button>
      </div>
    </div>
  )
}
