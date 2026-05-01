/**
 * lib/exportChat.ts
 * Utilities to export chat conversations as TXT or PDF.
 */
import type { Conversation } from '@/store/chatStore';

// ─── Export as plain text ─────────────────────────────────────────────────────
export function exportAsTxt(conversation: Conversation): void {
  const lines: string[] = [
    `Mano AI — Chat Export`,
    `Title: ${conversation.title}`,
    `Date: ${new Date(conversation.createdAt).toLocaleString()}`,
    `Model: ${conversation.model}`,
    '═'.repeat(60),
    '',
  ];

  for (const msg of conversation.messages) {
    const role = msg.role === 'user' ? '👤 You' : '🤖 Mano AI';
    const time = new Date(msg.timestamp).toLocaleTimeString();
    lines.push(`[${time}] ${role}:`);
    lines.push(msg.content);
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `mano-chat-${conversation.id.slice(0, 8)}.txt`);
}

// ─── Export as PDF (using jsPDF) ──────────────────────────────────────────────
export async function exportAsPdf(conversation: Conversation): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageWidth  = doc.internal.pageSize.getWidth();
  const margin     = 15;
  const maxWidth   = pageWidth - margin * 2;
  let   y          = 20;

  const checkNewPage = (needed = 10) => {
    if (y + needed > 280) { doc.addPage(); y = 20; }
  };

  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('MANO AI — Chat Export', margin, 9);
  y = 22;

  doc.setTextColor(60, 60, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Title: ${conversation.title}`, margin, y); y += 6;
  doc.text(`Date: ${new Date(conversation.createdAt).toLocaleString()}`, margin, y); y += 6;
  doc.text(`Model: ${conversation.model}`, margin, y); y += 10;

  // Divider
  doc.setDrawColor(200, 200, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Messages
  for (const msg of conversation.messages) {
    checkNewPage(16);

    const isUser = msg.role === 'user';
    const label  = isUser ? 'You' : 'Mano AI';
    const time   = new Date(msg.timestamp).toLocaleTimeString();

    // Role badge
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    isUser
      ? doc.setTextColor(99, 102, 241)
      : doc.setTextColor(139, 92, 246);
    doc.text(`${label} · ${time}`, margin, y);
    y += 5;

    // Content
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 50);

    const lines = doc.splitTextToSize(msg.content, maxWidth);
    for (const line of lines) {
      checkNewPage(6);
      doc.text(line, margin, y);
      y += 5.5;
    }
    y += 4;

    // Light separator
    doc.setDrawColor(230, 230, 240);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 3;
  }

  doc.save(`mano-chat-${conversation.id.slice(0, 8)}.pdf`);
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
