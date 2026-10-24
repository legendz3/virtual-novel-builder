export interface MandarinPhoneRow {
  hanzi: string;
  pinyin: string;
  meaning: string;
  /** A row can withhold its meaning; it cannot override a containing hidden reading. */
  showMeaning?: boolean;
}

/** Plain English is its own row, with no synthetic Mandarin support or translation. */
export type PhoneRow = MandarinPhoneRow | { kind: "text"; text: string; language: "en" };

export interface PhoneChrome {
  time: string;
  dateLabel: string;
  batteryPercent: number;
  charging: boolean;
  network: "cellular" | "wifi" | "none";
  airplaneMode: boolean;
}

export interface PhoneMessage {
  id: string;
  senderId: string;
  senderName: string;
  direction: "incoming" | "outgoing";
  rows?: PhoneRow[];
  attachmentId?: string;
  showMeanings: boolean;
}

interface PhoneAttachmentBase {
  id: string;
  title: string;
  semanticDescription: string;
}

export type PhoneAttachment =
  | (PhoneAttachmentBase & {
      kind: "plan-screenshot";
      rows: PhoneRow[];
      senderName?: string;
      defaultOpen?: boolean;
    })
  | (PhoneAttachmentBase & {
      kind: "map";
      diagram?: "marked-route" | "building" | "campus";
    });

export interface PhoneDocument {
  id: string;
  rows: PhoneRow[];
  showMeanings: boolean;
  relatedAttachmentId?: string;
}

export type PhoneScrollCue =
  | { kind: "outgoing-message"; messageId: string }
  | { kind: "incoming-message"; messageId: string }
  | { kind: "document-attachment"; attachmentId: string };

interface PhonePresentationBase {
  id: string;
  shellAssetId: string;
  owner: "emma" | "sofia";
  chrome: PhoneChrome;
  title: string;
  attachments?: PhoneAttachment[];
  scrollCue?: PhoneScrollCue;
}

/** Complete authored snapshots reconstruct the phone without a saved message ledger. */
export type PhonePresentation = PhonePresentationBase &
  (
    | { mode: "wechat-chat"; conversationId: string; messages: PhoneMessage[] }
    | { mode: "document"; document: PhoneDocument }
  );
