import { Check } from '@phosphor-icons/react'

const STEPS = ['Nhập thông số', 'Kết quả', 'Đặt hàng']

export function StepIndicator({ current = 1 }: { current?: number }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      {STEPS.map((step, index) => {
        const stepNum = index + 1
        const done = stepNum < current
        const active = stepNum === current
        return (
          <div key={step} className="flex items-center gap-2">
            {index > 0 && <div className={`h-px w-6 ${done ? 'bg-blue-600' : 'bg-gray-300'}`} />}
            <div className="flex items-center gap-1.5">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? 'bg-blue-600 text-white'
                    : active
                      ? 'border-2 border-blue-600 text-blue-600'
                      : 'border border-gray-300 text-gray-400'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" weight="bold" /> : stepNum}
              </span>
              <span
                className={`${active ? 'font-semibold text-blue-600' : done ? 'text-gray-800' : 'text-gray-400'}`}
              >
                {step}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}