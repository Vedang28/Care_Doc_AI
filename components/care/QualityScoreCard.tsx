'use client'

interface QualityScore {
  overall: number
  completeness: number
  specificity: number
  riskAwareness: number
  feedback: string
}

interface QualityScoreCardProps {
  score: QualityScore
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const filled = Math.min(100, Math.max(0, score))
  const strokeDashoffset = circumference - (filled / 100) * circumference

  const colour =
    score >= 80 ? '#2D6A4F' :
    score >= 60 ? '#92400E' : '#991B1B'

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={8}
      />
      {/* Fill */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colour}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
      />
      {/* Score text — counter-rotate to keep upright */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill={colour}
        fontSize={size / 3.5}
        fontWeight="700"
        fontFamily="Georgia, serif"
        style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}
      >
        {score}
      </text>
    </svg>
  )
}

function MiniBar({ label, value }: { label: string; value: number }) {
  const colour =
    value >= 80 ? 'bg-care' :
    value >= 60 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-mid">{label}</span>
        <span className="font-medium text-slate-deep">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colour}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export function QualityScoreCard({ score }: QualityScoreCardProps) {
  return (
    <div className="bg-white border border-border-soft rounded-xl p-5 w-full max-w-sm mx-auto">
      <div className="flex flex-col items-center gap-1 mb-4">
        <ScoreRing score={score.overall} />
        <p className="text-xs font-semibold text-slate-mid uppercase tracking-wide mt-1">
          Documentation Quality
        </p>
      </div>

      <p className="text-sm text-slate-deep text-center italic mb-5 leading-relaxed">
        &ldquo;{score.feedback}&rdquo;
      </p>

      <div className="space-y-3">
        <MiniBar label="Completeness" value={score.completeness} />
        <MiniBar label="Specificity" value={score.specificity} />
        <MiniBar label="Risk Awareness" value={score.riskAwareness} />
      </div>
    </div>
  )
}
