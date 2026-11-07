import { useEffect, useRef, useState, useCallback } from 'react';
import { Flame, Copy, Check, Clock, Trophy, CalendarDays } from 'lucide-react';
import { api } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatINR } from '../lib/format.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
  });
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

function daysLeftOf(windowEnd) {
  if (!windowEnd) return null;
  const ms = new Date(windowEnd).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / DAY_MS);
}

// Dynamic, data-driven progress message (never hardcoded to an example).
function buildMessage({ status, completedDays, required, daysLeft, reached, inProgress }) {
  if (reached && !inProgress) {
    return "🔥 Amazing! You've completed your streak and unlocked your exclusive reward!";
  }
  if (status === 'idle') {
    return 'Start your fire streak! Complete an order today to begin unlocking your reward.';
  }
  if (status === 'ended') return 'This campaign has ended.';
  if (status === 'expired') {
    return `Your streak expired — you reached ${completedDays}/${required} day${required === 1 ? '' : 's'}. Order again to start a fresh streak!`;
  }
  // in_progress
  const remaining = Math.max(0, required - completedDays);
  if (remaining === 0) {
    return "🔥 Amazing! You've completed your streak and unlocked your exclusive reward!";
  }
  const within = daysLeft == null ? '' : ` within the next ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  if (remaining === 1) {
    return daysLeft != null && daysLeft <= 1
      ? '🔥 Last chance! Complete your remaining streak day today to unlock your reward.'
      : `🔥 Last chance! Complete your remaining streak day${within} to unlock your reward.`;
  }
  const opener = completedDays <= 1 ? 'Great start!' : 'Your streak is growing!';
  return `🔥 ${opener} Complete an order on ${remaining} more days${within} to unlock your reward.`;
}

// Module-level stale-while-revalidate cache (per user) so revisiting Orders
// shows the streak instantly while a fresh copy loads in the background.
let streakCache = { userId: null, data: null };

export default function StreakCard() {
  const { user } = useAuth();
  const userId = user?.id || null;

  const cached = streakCache.userId === userId ? streakCache.data : null;
  const [rewards, setRewards] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!userId || inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await api.getMyRewards();
      const data = res.rewards || [];
      streakCache = { userId, data };
      setRewards(data);
    } catch {
      // Keep cached data — a streak hiccup must never break the Orders page.
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (streakCache.userId === userId && streakCache.data) {
      setRewards(streakCache.data);
      setLoading(false);
    } else {
      streakCache = { userId, data: null };
      setRewards(null);
      setLoading(true);
    }
    refresh();
  }, [userId, refresh]);

  // Live updates: refresh in the background when one of this customer's orders
  // becomes DELIVERED. One subscription, cleaned up on unmount.
  useEffect(() => {
    if (!userId) return undefined;
    const channel = supabase
      .channel(`streak-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_id=eq.${userId}` },
        (payload) => {
          if (payload.new?.order_status === 'DELIVERED') refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  if (!userId) return null;
  if (loading && (!rewards || rewards.length === 0)) return <StreakSkeleton />;
  if (!rewards || rewards.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      {rewards.map((r) => (
        <CampaignStreak key={r.campaign_id} reward={r} />
      ))}
    </div>
  );
}

function CampaignStreak({ reward: r }) {
  const activeCoupon = r.coupons.find((c) => c.status === 'available');
  const otherCoupons = r.coupons.filter((c) => c !== activeCoupon);

  const status = r.progress?.status || 'idle';
  const required = r.progress?.required_days || r.required_streak_days;
  const inProgress = status === 'in_progress';
  const expired = status === 'expired';
  const reached = Boolean(activeCoupon);

  const completedDays = inProgress || expired ? r.progress.completed_days : reached && !inProgress ? required : 0;
  const litCount = Math.min(required, completedDays);
  const ratio = required > 0 ? litCount / required : 0;
  const daysLeft = daysLeftOf(r.progress?.window_end);

  const message = buildMessage({ status, completedDays, required, daysLeft, reached, inProgress });

  return (
    <section className="c-surface relative overflow-hidden p-5 animate-fade-in">
      {reached && <Confetti />}

      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta-100 text-terracotta-600">
          <Flame className="h-5 w-5 fill-terracotta-500 text-terracotta-500" />
        </span>
        <div className="min-w-0">
          <p className="c-eyebrow">Your order streak</p>
          <h2 className="font-serif text-xl leading-tight text-espresso-700">{r.name}</h2>
          {r.description && <p className="mt-1 text-sm text-stone">{r.description}</p>}
        </div>
      </div>

      {/* Fire symbols + progress */}
      {r.active && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {Array.from({ length: required }).map((_, idx) => {
              const lit = idx < litCount;
              return (
                <Flame
                  key={`${idx}-${lit}`}
                  strokeWidth={lit ? 2 : 1.75}
                  className={`h-7 w-7 transition-colors duration-300 ${
                    lit
                      ? expired
                        ? 'text-stone/50 [fill:theme(colors.stone/30%)]'
                        : 'animate-pop text-terracotta-500 fill-terracotta-500 drop-shadow-[0_2px_6px_rgba(185,85,56,0.35)]'
                      : 'text-sand fill-transparent'
                  }`}
                />
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-espresso-700">
              {litCount} / {required} days
            </span>
            {daysLeft != null && !reached && (
              <span className="inline-flex items-center gap-1 text-stone">
                <Clock className="h-3.5 w-3.5" />
                {daysLeft === 0 ? 'last day' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
              </span>
            )}
          </div>

          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-cream">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                expired ? 'bg-stone/40' : 'bg-terracotta-500'
              }`}
              style={{ width: `${ratio * 100}%` }}
            />
          </div>

          <p className={`mt-3 text-sm ${reached ? 'font-semibold text-sage-700' : 'text-stone'}`}>{message}</p>

          {/* Window + reward summary */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone">
            {r.progress?.window_start && r.progress?.window_end && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {fmtDate(r.progress.window_start)} – {fmtDate(r.progress.window_end)}
              </span>
            )}
            <span>
              Reward:{' '}
              <span className="font-semibold text-terracotta-600">
                {discountLabel({ discount_type: r.discount_type, discount_value: r.discount_value, max_discount: r.max_discount })}
              </span>
              {r.min_order_value > 0 && ` · min ${formatINR(r.min_order_value)}`}
            </span>
          </div>
        </div>
      )}

      {!r.active && !activeCoupon && otherCoupons.length === 0 && (
        <p className="mt-4 text-sm text-stone">This campaign has ended.</p>
      )}

      {activeCoupon && <RewardCoupon coupon={activeCoupon} highlight />}

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
        highlight ? 'border-terracotta-200 bg-terracotta-50 animate-slide-up' : 'border-sand bg-cream/40'
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
          <span className="badge badge-success">AVAILABLE</span>
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
          <p className="pt-1 font-medium text-sage-700">Apply this code at checkout on your next eligible order.</p>
        )}
        {used && <p className="pt-1 font-medium">You’ve already used this reward. Keep your streak alive to earn more!</p>}
      </div>
    </div>
  );
}

function StreakSkeleton() {
  return (
    <div className="mb-6" aria-hidden="true">
      <div className="c-surface p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full cafe-skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded cafe-skeleton" />
            <div className="h-4 w-44 rounded cafe-skeleton" />
          </div>
        </div>
        <div className="mt-5 flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-7 rounded-full cafe-skeleton" />
          ))}
        </div>
        <div className="mt-4 h-2.5 w-full rounded-full cafe-skeleton" />
      </div>
    </div>
  );
}

/* Lightweight, dependency-free celebration burst shown when a reward unlocks. */
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
          style={{ left: p.left, width: p.size, height: p.size, backgroundColor: p.color, animationDelay: p.delay }}
        />
      ))}
    </div>
  );
}
