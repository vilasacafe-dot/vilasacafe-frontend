import { useEffect, useRef, useState } from 'react';
import { Gift, Copy, Check, Clock, PartyPopper, Trophy } from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatINR } from '../lib/format.js';

/* Emoji that warms up from sad to happy as the customer nears the goal. */
function faceFor(ratio) {
  if (ratio >= 1) return '🤩';
  if (ratio >= 0.75) return '😄';
  if (ratio >= 0.5) return '🙂';
  if (ratio >= 0.25) return '😐';
  return '😔';
}

function daysLeft(windowEnd) {
  if (!windowEnd) return null;
  const ms = new Date(windowEnd).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function fmtExpiry(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function discountLabel(c) {
  if (c.discount_type === 'percentage') {
    return `${c.discount_value}% OFF${c.max_discount ? ` up to ${formatINR(c.max_discount)}` : ''}`;
  }
  return `${formatINR(c.discount_value)} OFF`;
}

export default function RewardProgress() {
  const [rewards, setRewards] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .getMyRewards()
      .then((res) => mounted && setRewards(res.rewards || []))
      .catch(() => {}) // rewards are a bonus surface; never block the orders page
      .finally(() => mounted && setLoaded(true));
    return () => {
      mounted = false;
    };
  }, []);

  if (!loaded || rewards.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      {rewards.map((r) => (
        <CampaignCard key={r.campaign_id} reward={r} />
      ))}
    </div>
  );
}

function CampaignCard({ reward: r }) {
  const activeCoupon = r.coupons.find((c) => c.status === 'active');
  const otherCoupons = r.coupons.filter((c) => c !== activeCoupon);

  const required = r.progress?.required || r.required_orders;
  const status = r.progress?.status || 'idle';
  const inProgress = status === 'in_progress';
  const reached = Boolean(activeCoupon);
  const hasHistory = r.coupons.length > 0;
  // The ring reflects the CURRENT streak. A freshly unlocked reward with no new
  // streak yet shows a full, happy ring; a lapsed/idle streak resets to zero.
  const completed = inProgress ? r.progress.completed : reached ? required : 0;
  const ratio = required > 0 ? Math.min(1, completed / required) : 0;
  const left = daysLeft(r.progress?.window_end);

  return (
    <section className="c-surface relative overflow-hidden p-5 animate-fade-in">
      {reached && <Confetti />}

      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta-100 text-terracotta-600">
          <Gift className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="c-eyebrow">Order Rewards</p>
          <h2 className="font-serif text-xl leading-tight text-espresso-700">{r.name}</h2>
          {r.description && <p className="mt-1 text-sm text-stone">{r.description}</p>}
        </div>
      </div>

      {/* Progress (only while the campaign is running) */}
      {r.active && (
        <div className="mt-5 flex items-center gap-4">
          <ProgressRing ratio={ratio} reached={reached} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-espresso-700">{completed}</span>
              <span className="text-sm font-semibold text-stone">/ {required} orders</span>
            </div>

            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-cream">
              <div
                className="h-full rounded-full bg-terracotta-500 transition-all duration-700 ease-out"
                style={{ width: `${ratio * 100}%` }}
              />
            </div>

            <p className="mt-2 text-sm text-stone">
              {inProgress ? (
                <>
                  <span className="font-semibold text-espresso-700">{required - completed} more</span> to go
                  {left != null && (
                    <span className="inline-flex items-center gap-1 text-stone">
                      {' '}·{' '}
                      <Clock className="h-3.5 w-3.5" />
                      {left === 0 ? 'last day' : `${left} day${left === 1 ? '' : 's'} left`}
                    </span>
                  )}
                </>
              ) : reached ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-sage-700">
                  <PartyPopper className="h-4 w-4" /> Reward unlocked — grab it below!
                </span>
              ) : status === 'expired' ? (
                'Your window closed before the goal — order again to start a fresh streak!'
              ) : hasHistory ? (
                'Order again to start your next reward streak!'
              ) : (
                'Place your first order to start earning this reward.'
              )}
            </p>
          </div>
        </div>
      )}

      {!r.active && !activeCoupon && otherCoupons.length === 0 && (
        <p className="mt-4 text-sm text-stone">This campaign has ended.</p>
      )}

      {/* Unlocked reward */}
      {activeCoupon && <RewardCoupon coupon={activeCoupon} highlight />}

      {/* Past coupons (used / expired / extra) */}
      {otherCoupons.length > 0 && (
        <div className="mt-3 space-y-2">
          {otherCoupons.map((c) => (
            <RewardCoupon key={c.code} coupon={c} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProgressRing({ ratio, reached }) {
  const size = 72;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F1EBE3" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={reached ? '#7B8468' : '#B95538'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
        />
      </svg>
      <span
        key={reached ? 'happy' : Math.round(ratio * 100)}
        className="absolute inset-0 flex items-center justify-center text-3xl animate-pop"
        aria-hidden="true"
      >
        {faceFor(ratio)}
      </span>
    </div>
  );
}

function RewardCoupon({ coupon: c, highlight = false }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const used = c.status === 'used';
  const expired = c.status === 'expired';
  const disabled = used || expired;

  async function copy() {
    try {
      await navigator.clipboard.writeText(c.code);
      setCopied(true);
      toast.success('Coupon code copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Long-press the code to copy.');
    }
  }

  return (
    <div
      className={`mt-4 rounded-2xl border p-4 ${
        highlight
          ? 'border-terracotta-200 bg-terracotta-50 animate-slide-up'
          : 'border-sand bg-cream/40'
      } ${disabled ? 'opacity-80' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-terracotta-700">
          <Trophy className="h-4 w-4" /> {discountLabel(c)}
        </span>
        {used ? (
          <span className="badge badge-muted">USED</span>
        ) : expired ? (
          <span className="badge badge-danger">EXPIRED</span>
        ) : (
          <span className="badge badge-success">UNLOCKED</span>
        )}
      </div>

      <div className="mt-3 flex items-stretch gap-2">
        <div
          className={`flex flex-1 items-center justify-center rounded-xl border border-dashed px-3 py-2.5 ${
            disabled ? 'border-sand bg-white/60' : 'border-terracotta-300 bg-white'
          }`}
        >
          <span
            className={`font-display text-lg font-bold uppercase tracking-wider ${
              disabled ? 'text-stone line-through' : 'text-espresso-700'
            }`}
          >
            {c.code}
          </span>
        </div>
        <button
          type="button"
          onClick={copy}
          disabled={disabled}
          className="c-btn-accent px-4 text-sm disabled:opacity-50"
          aria-label={`Copy coupon code ${c.code}`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="mt-2.5 space-y-0.5 text-xs text-stone">
        {c.min_order_value > 0 && <p>Min order {formatINR(c.min_order_value)}</p>}
        <p>
          {expired ? 'Expired on ' : 'Valid until '}
          <span className="font-semibold text-espresso-700">{fmtExpiry(c.expires_at)}</span>
        </p>
        {!disabled && (
          <p className="pt-1 font-medium text-sage-700">
            Apply this code at checkout on your next eligible order.
          </p>
        )}
        {used && <p className="pt-1 font-medium">You’ve already used this reward. Keep ordering to earn more!</p>}
      </div>
    </div>
  );
}

/* Lightweight, dependency-free celebration burst. */
function Confetti() {
  const pieces = useRef(
    Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: `${(i / 14) * 100 + Math.random() * 5}%`,
      delay: `${Math.random() * 0.5}s`,
      color: ['#B95538', '#7B8468', '#CC6E4F', '#E8C07D', '#A6AE90'][i % 5],
      size: 6 + Math.round(Math.random() * 5),
    }))
  ).current;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block rounded-[2px] animate-confetti-fall"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
