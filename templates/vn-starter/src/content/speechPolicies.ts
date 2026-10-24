export interface SpeechPolicy {
  providerId: "minimax";
  voiceId: string;
  languageBoost: "Chinese" | "English";
  role: "character" | "phrase" | "announcement" | "vocabulary";
}
/** Trusted author-assigned cast and request policy. Proof and clip IDs never select their own policy. */
export const speechPolicies: Readonly<Record<string, SpeechPolicy>> = {
  "li-wei": {
    providerId: "minimax",
    voiceId: "Chinese (Mandarin)_Unrestrained_Young_Man",
    languageBoost: "Chinese",
    role: "character",
  },
  emma: {
    providerId: "minimax",
    voiceId: "English_witty_female_1",
    languageBoost: "English",
    role: "character",
  },
  "camera-guy": {
    providerId: "minimax",
    voiceId: "Chinese (Mandarin)_Sincere_Adult",
    languageBoost: "Chinese",
    role: "character",
  },
  "zhou-yichen": {
    providerId: "minimax",
    voiceId: "Chinese_calm_streamer_nv1",
    languageBoost: "Chinese",
    role: "character",
  },
  "han-ziqian": {
    providerId: "minimax",
    voiceId: "Chinese (Mandarin)_Sincere_Adult",
    languageBoost: "Chinese",
    role: "character",
  },
  sofia: {
    providerId: "minimax",
    voiceId: "Spanish_FriendlyNeighbor",
    languageBoost: "English",
    role: "character",
  },
  "tang-yuning": {
    providerId: "minimax",
    voiceId: "Chinese (Mandarin)_Laid_BackGirl",
    languageBoost: "Chinese",
    role: "character",
  },
  "xu-cheng": {
    providerId: "minimax",
    voiceId: "hunyin_6",
    languageBoost: "Chinese",
    role: "character",
  },
  "zhu-ke": {
    providerId: "minimax",
    voiceId: "Chinese_bazong",
    languageBoost: "Chinese",
    role: "character",
  },
  examiner: {
    providerId: "minimax",
    voiceId: "Chinese_kind_uncle_nv1",
    languageBoost: "Chinese",
    role: "character",
  },
  "station-worker": {
    providerId: "minimax",
    voiceId: "Chinese_kind_uncle_nv1",
    languageBoost: "Chinese",
    role: "character",
  },
  announcement: {
    providerId: "minimax",
    voiceId: "Chinese_wenrounvxing",
    languageBoost: "Chinese",
    role: "announcement",
  },
  "vocabulary-narrator": {
    providerId: "minimax",
    voiceId: "Chinese_wenrounvxing",
    languageBoost: "Chinese",
    role: "vocabulary",
  },
};
