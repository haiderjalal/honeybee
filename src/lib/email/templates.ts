import { SITE } from "@/constants/site";
import { formatPkr } from "@/utils/formatPkr";

import type { OrderRequest } from "@/services/inquiry.types";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Every customer-supplied value passes through here before entering HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

const nl2br = (value: string): string => escapeHtml(value).replace(/\n/g, "<br />");

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f6efe1;font-family:Arial,Helvetica,sans-serif;color:#2a1a08">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fffaf0;border-radius:16px;border:1px solid #ecd9b0;overflow:hidden">
<tr><td style="background:#0b1f17;padding:24px 28px;color:#f6bd3c;font-family:Georgia,serif;font-size:26px">${SITE.name}</td></tr>
<tr><td style="padding:28px"><h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;color:#2a1a08">${escapeHtml(title)}</h1>${body}</td></tr>
</table></td></tr></table></body></html>`;
}

function linesTable(order: OrderRequest): string {
  const rows = order.lines
    .map(
      (line) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid #ecd9b0">${escapeHtml(line.name)} — ${escapeHtml(line.sizeLabel)}</td>
<td style="padding:8px 0;border-bottom:1px solid #ecd9b0;text-align:center">× ${line.quantity}</td>
<td style="padding:8px 0;border-bottom:1px solid #ecd9b0;text-align:right">${formatPkr(line.lineTotal)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}
<tr><td colspan="2" style="padding:12px 0;font-weight:bold">Subtotal</td><td style="padding:12px 0;text-align:right;font-weight:bold">${formatPkr(order.subtotal)}</td></tr></table>
<p style="font-size:13px;color:#7a5a2a">Delivery charges, if any, are confirmed on call.</p>`;
}

function linesText(order: OrderRequest): string {
  return [
    ...order.lines.map((line) => `- ${line.name} ${line.sizeLabel} x ${line.quantity} = ${formatPkr(line.lineTotal)}`),
    `Subtotal: ${formatPkr(order.subtotal)}`,
  ].join("\n");
}

export function ownerInquiryEmail(order: OrderRequest): EmailContent {
  const { customer } = order;
  const details: [string, string | null][] = [
    ["Name", customer.name],
    ["Phone", customer.phone],
    ["Email", customer.email],
    ["City", customer.city],
    ["Address", customer.address],
    ["Notes", customer.notes],
  ];
  const detailsHtml = details
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#7a5a2a;vertical-align:top">${label}</td><td style="padding:4px 0">${nl2br(value ?? "")}</td></tr>`,
    )
    .join("");

  return {
    subject: `New order request ${order.reference} — ${customer.name} (${formatPkr(order.subtotal)})`,
    html: layout(
      `New order request ${order.reference}`,
      `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;margin-bottom:20px">${detailsHtml}</table>${linesTable(order)}
<p style="font-size:13px;color:#7a5a2a">Received ${escapeHtml(new Date(order.createdAt).toUTCString())}</p>`,
    ),
    text: [
      `New order request ${order.reference}`,
      "",
      ...details.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`),
      "",
      linesText(order),
    ].join("\n"),
  };
}

export function customerConfirmationEmail(order: OrderRequest): EmailContent {
  const firstName = order.customer.name.split(" ")[0] ?? order.customer.name;
  return {
    subject: `We received your HonyB order request (${order.reference})`,
    html: layout(
      `Thank you, ${firstName}!`,
      `<p style="font-size:15px;line-height:1.6">We've received your order request <strong>${escapeHtml(order.reference)}</strong>.
Our team will call or WhatsApp you on <strong>${escapeHtml(order.customer.phone)}</strong> to confirm delivery and payment.</p>${linesTable(order)}`,
    ),
    text: [
      `Thank you, ${firstName}!`,
      `We've received your order request ${order.reference}. We'll contact you on ${order.customer.phone} to confirm delivery and payment.`,
      "",
      linesText(order),
    ].join("\n"),
  };
}
