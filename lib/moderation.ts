import { addDoc, collection } from 'firebase/firestore';
import { Alert } from 'react-native';
import { db } from '@/lib/firebase';

export type ReportTargetType = 'post' | 'reply';
export type ReportReasonId = 'harmful' | 'spam' | 'selfharm' | 'other';

export const REPORT_REASONS: { id: ReportReasonId; label: string }[] = [
  { id: 'harmful', label: 'Harmful or abusive' },
  { id: 'spam', label: 'Spam or scam' },
  { id: 'selfharm', label: 'Self-harm or crisis' },
  { id: 'other', label: 'Something else' },
];

type ReportInput = {
  targetType: ReportTargetType;
  postId: string;
  replyId?: string;
  reportedUid: string | null;
  reason: ReportReasonId;
  reporterUid: string;
};

/**
 * File a report to the top-level `reports` collection for admin review (surfaced
 * in the Firebase console). Reporters can create but never read reports, so the
 * queue can't be enumerated by clients.
 */
export function reportContent({ targetType, postId, replyId, reportedUid, reason, reporterUid }: ReportInput) {
  const report = {
    targetType,
    postId,
    reason,
    reporterUid,
    reportedUid: reportedUid ?? null,
    status: 'open' as const,
    createdAt: Date.now(),
    // Firestore rejects `undefined`; only include a replyId for reply reports.
    ...(replyId ? { replyId } : {}),
  };
  return addDoc(collection(db, 'reports'), report).catch((e) => console.warn('Failed to file report:', e));
}

/** The overflow menu for a post or reply: Report (→ reason picker) or Block the author. */
export function presentModerationMenu(opts: {
  targetLabel: ReportTargetType;
  onReport: (reason: ReportReasonId) => void;
  onBlock: () => void;
}) {
  Alert.alert(`This ${opts.targetLabel}`, undefined, [
    { text: `Report ${opts.targetLabel}`, onPress: () => presentReportReasons(opts.onReport) },
    { text: 'Block this person', style: 'destructive', onPress: () => confirmBlock(opts.onBlock) },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

/** Second step of a report: pick a reason. Files the report on selection. */
export function presentReportReasons(onPick: (reason: ReportReasonId) => void) {
  Alert.alert('Report — what’s wrong?', 'Thanks for helping keep Ember warm. Our team will take a look.', [
    ...REPORT_REASONS.map((r) => ({ text: r.label, onPress: () => onPick(r.id) })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

/** Confirm before blocking (reversible from Profile → Blocked people). */
export function confirmBlock(onBlock: () => void) {
  Alert.alert(
    'Block this person?',
    'You won’t see their posts or replies anymore. You can undo this from Profile → Blocked people.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: onBlock },
    ]
  );
}
