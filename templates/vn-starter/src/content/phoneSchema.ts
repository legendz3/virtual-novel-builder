import { z } from "zod";
import type { PhonePresentation } from "@game/story/phone.types";

const phoneText = z.string().trim().min(1);
const mandarinPhoneRowSchema = z.strictObject({
  hanzi: phoneText,
  pinyin: phoneText,
  meaning: phoneText,
  showMeaning: z.boolean().optional(),
});
const phoneRowSchema = z.union([
  mandarinPhoneRowSchema,
  z.strictObject({ kind: z.literal("text"), text: phoneText, language: z.literal("en") }),
]);
const phoneRowsSchema = z.array(phoneRowSchema).min(1);
const attachmentBase = {
  id: phoneText,
  title: phoneText,
  semanticDescription: phoneText,
};
const phoneAttachmentSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    ...attachmentBase,
    kind: z.literal("plan-screenshot"),
    rows: phoneRowsSchema,
    senderName: phoneText.optional(),
    defaultOpen: z.boolean().optional(),
  }),
  z.strictObject({
    ...attachmentBase,
    kind: z.literal("map"),
    diagram: z.enum(["marked-route", "building", "campus"]).optional(),
  }),
]);
const phoneMessageSchema = z
  .strictObject({
    id: phoneText,
    senderId: phoneText,
    senderName: phoneText,
    direction: z.enum(["incoming", "outgoing"]),
    rows: phoneRowsSchema.optional(),
    attachmentId: phoneText.optional(),
    showMeanings: z.boolean(),
  })
  .refine((message) => message.rows || message.attachmentId, {
    message: "Phone messages require rows or an attachment",
  });
const phoneBase = {
  id: phoneText,
  shellAssetId: phoneText,
  owner: z.enum(["emma", "sofia"]),
  chrome: z.strictObject({
    time: phoneText,
    dateLabel: phoneText,
    batteryPercent: z.number().finite().min(0).max(100),
    charging: z.boolean(),
    network: z.enum(["cellular", "wifi", "none"]),
    airplaneMode: z.boolean(),
  }),
  title: phoneText,
  attachments: z.array(phoneAttachmentSchema).optional(),
  scrollCue: z
    .discriminatedUnion("kind", [
      z.strictObject({ kind: z.literal("outgoing-message"), messageId: phoneText }),
      z.strictObject({ kind: z.literal("incoming-message"), messageId: phoneText }),
      z.strictObject({ kind: z.literal("document-attachment"), attachmentId: phoneText }),
    ])
    .optional(),
};

// Attachments are scoped to this snapshot, so stale private content cannot be resolved globally.
export const phonePresentationSchema: z.ZodType<PhonePresentation> = z
  .discriminatedUnion("mode", [
    z.strictObject({
      ...phoneBase,
      mode: z.literal("wechat-chat"),
      conversationId: phoneText,
      messages: z.array(phoneMessageSchema).min(1),
    }),
    z.strictObject({
      ...phoneBase,
      mode: z.literal("document"),
      document: z.strictObject({
        id: phoneText,
        rows: phoneRowsSchema,
        showMeanings: z.boolean(),
        relatedAttachmentId: phoneText.optional(),
      }),
    }),
  ])
  .superRefine((phone, context) => {
    const cue = phone.scrollCue;
    if (cue?.kind === "outgoing-message" || cue?.kind === "incoming-message") {
      const last = phone.mode === "wechat-chat" ? phone.messages.at(-1) : undefined;
      if (
        !last ||
        last.id !== cue.messageId ||
        last.direction !== (cue.kind === "incoming-message" ? "incoming" : "outgoing")
      )
        context.addIssue({
          code: "custom",
          message: `Phone reply cue requires the final ${cue.kind === "incoming-message" ? "incoming" : "outgoing"} message`,
        });
    }
    if (
      cue?.kind === "document-attachment" &&
      (phone.mode !== "document" ||
        phone.document.relatedAttachmentId !== cue.attachmentId ||
        !phone.attachments?.some((item) => item.id === cue.attachmentId && item.kind === "map"))
    )
      context.addIssue({
        code: "custom",
        message: "Phone document cue requires its related map attachment",
      });
    const attachments = phone.attachments ?? [];
    const ids = attachments.map((attachment) => attachment.id);
    if (new Set(ids).size !== ids.length)
      context.addIssue({ code: "custom", message: "Duplicate phone attachment IDs" });
    const references =
      phone.mode === "wechat-chat"
        ? phone.messages.map((message) => message.attachmentId)
        : [phone.document.relatedAttachmentId];
    for (const reference of references)
      if (reference && !ids.includes(reference))
        context.addIssue({ code: "custom", message: `Unknown phone attachment: ${reference}` });
    if (
      phone.mode === "wechat-chat" &&
      new Set(phone.messages.map((message) => message.id)).size !== phone.messages.length
    )
      context.addIssue({ code: "custom", message: "Duplicate phone message IDs" });
  });
