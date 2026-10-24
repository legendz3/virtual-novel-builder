import { useEffect, useId, useRef, useState } from "react";
import type { PhoneAttachment, PhonePresentation, PhoneRow } from "@game/story/phone.types";
import { usePhoneScroll } from "./usePhoneScroll";
import "@/styles/storyPhone.css";

interface StoryPhoneProps {
  phone: PhonePresentation;
  shellSrc: string;
  paused?: boolean;
  showPinyin?: boolean;
}

function PhoneRows({
  rows,
  showMeanings,
  showPinyin,
}: {
  rows: PhoneRow[];
  showMeanings: boolean;
  showPinyin: boolean;
}) {
  return rows.map((row, index) => (
    <div className="story-phone-row" key={index}>
      {"kind" in row ? (
        <p lang={row.language}>{row.text}</p>
      ) : (
        <>
          <p lang="zh-Hans">{row.hanzi}</p>
          {showPinyin && <p lang="zh-Latn">{row.pinyin}</p>}
          {showMeanings && row.showMeaning !== false && <p lang="en">{row.meaning}</p>}
        </>
      )}
    </div>
  ));
}

function PhoneMap({ attachment }: { attachment: Extract<PhoneAttachment, { kind: "map" }> }) {
  return (
    <svg className="story-phone-map" viewBox="0 0 180 120" aria-hidden="true" focusable="false">
      <rect width="180" height="120" rx="6" fill="#e4eadf" />
      <path d="M0 36H180M56 0V120M124 0V120M0 92H180" stroke="#fafbf8" strokeWidth="12" />
      <path d="M0 36H180M56 0V120M124 0V120M0 92H180" stroke="#c6cfc2" fill="none" />
      <rect x="72" y="49" width="36" height="28" rx="3" fill="#a9ba9a" />
      {attachment.diagram === "marked-route" ? (
        <g stroke="#94724c" fill="none" strokeWidth="3">
          <path d="m26 57 17 17m0-17L26 74" />
          <circle cx="143" cy="66" r="13" />
        </g>
      ) : (
        <rect
          x="69"
          y="46"
          width="42"
          height="34"
          rx="5"
          fill="none"
          stroke="#577d57"
          strokeWidth="3"
        />
      )}
    </svg>
  );
}

function PhoneScreenshot({
  attachment,
  showMeanings,
  showPinyin,
}: {
  attachment: Extract<PhoneAttachment, { kind: "plan-screenshot" }>;
  showMeanings: boolean;
  showPinyin: boolean;
}) {
  const [expanded, setExpanded] = useState(attachment.defaultOpen === true);
  const contentId = useId();
  return (
    <div className="story-phone-screenshot">
      <button
        className="story-phone-attachment-toggle"
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((value) => !value)}
      >
        <span>
          {attachment.title}
          {attachment.senderName && <> · {attachment.senderName}</>}
        </span>
        <span aria-hidden="true">{expanded ? "⌃" : "⌄"}</span>
      </button>
      {expanded && (
        <div id={contentId}>
          <span className="story-phone-sr-only">{attachment.semanticDescription}</span>
          <PhoneRows rows={attachment.rows} showMeanings={showMeanings} showPinyin={showPinyin} />
        </div>
      )}
    </div>
  );
}

function PhoneSnapshot({ phone, shellSrc, paused = false, showPinyin = true }: StoryPhoneProps) {
  const [openMap, setOpenMap] = useState<Extract<PhoneAttachment, { kind: "map" }> | null>(null);
  const mapBack = useRef<HTMLButtonElement>(null);
  const mapTrigger = useRef<HTMLButtonElement | null>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  const phoneRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { overflow, moreBelow, cancelScroll, scrollPhone } = usePhoneScroll({
    phoneRef,
    transcriptRef: transcript,
    contentRef,
    cue: phone.scrollCue,
    paused,
    detailOpen: openMap !== null,
  });
  const ownerName = phone.owner === "emma" ? "Emma" : "Sofia";
  const { chrome } = phone;

  useEffect(() => {
    if (openMap) {
      if (transcript.current) transcript.current.scrollTop = 0;
      mapBack.current?.focus();
    } else if (mapTrigger.current) {
      mapTrigger.current.focus({ preventScroll: true });
      if (transcript.current) transcript.current.scrollTop = savedScroll.current;
    }
  }, [openMap]);

  function handleOpenMap(
    attachment: Extract<PhoneAttachment, { kind: "map" }>,
    trigger: HTMLButtonElement,
  ) {
    cancelScroll();
    mapTrigger.current = trigger;
    savedScroll.current = transcript.current?.scrollTop ?? 0;
    setOpenMap(attachment);
  }

  function attachmentView(id: string, showMeanings: boolean) {
    const attachment = phone.attachments?.find((item) => item.id === id);
    if (!attachment) return null; // Content validation rejects unresolved references before rendering.
    if (attachment.kind === "plan-screenshot")
      return (
        <PhoneScreenshot
          attachment={attachment}
          showMeanings={showMeanings}
          showPinyin={showPinyin}
        />
      );
    return (
      <button
        className="story-phone-map-trigger"
        data-phone-attachment={attachment.id}
        type="button"
        onClick={(event) => handleOpenMap(attachment, event.currentTarget)}
      >
        <PhoneMap attachment={attachment} />
        <span>{attachment.title}</span>
      </button>
    );
  }

  return (
    <section
      className="story-phone"
      ref={phoneRef}
      hidden={paused}
      inert={paused}
      aria-hidden={paused || undefined}
      aria-label={`${ownerName}’s phone: ${phone.title}`}
      data-phone-snapshot={phone.id}
      data-phone-mode={phone.mode}
    >
      <div className="story-phone-canvas">
        <div className="story-phone-screen">
          <div className="story-phone-status">
            <span>{chrome.time}</span>
            <span className="story-phone-status-icons">
              <span className="story-phone-sr-only">
                {chrome.airplaneMode ? "Airplane mode. " : ""}
                {chrome.network === "none" ? "No network. " : `${chrome.network} network. `}
              </span>
              <span aria-hidden="true">{chrome.airplaneMode ? "✈" : ""}</span>
              <svg aria-hidden="true" focusable="false" viewBox="0 0 16 14">
                {chrome.network === "cellular" && (
                  <path
                    d="M1 13V10H3V13ZM5 13V7H7V13ZM9 13V4H11V13ZM13 13V1H15V13Z"
                    fill="currentColor"
                  />
                )}
                {chrome.network === "wifi" && (
                  <path
                    d="M1 4Q8-2 15 4M4 7Q8 3 12 7M7 10Q8 9 9 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                )}
                {chrome.network === "none" && (
                  <path d="m3 3 10 8m0-8L3 11" stroke="currentColor" strokeWidth="2" />
                )}
              </svg>
              <span
                aria-label={`Battery ${chrome.batteryPercent} percent${chrome.charging ? ", charging" : ""}`}
              >
                {chrome.batteryPercent}%{chrome.charging && <span aria-hidden="true">ϟ</span>}
              </span>
              <svg aria-hidden="true" focusable="false" viewBox="0 0 22 12">
                <rect x="1" y="1" width="17" height="10" rx="2" fill="none" stroke="currentColor" />
                <rect
                  x="3"
                  y="3"
                  width={(13 * chrome.batteryPercent) / 100}
                  height="6"
                  rx="1"
                  fill="currentColor"
                />
                <path d="M20 4v4" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
          </div>
          <header className="story-phone-header">{phone.title}</header>
          <p className="story-phone-date">{chrome.dateLabel}</p>
          <div
            className="story-phone-transcript"
            role="region"
            aria-label={
              openMap
                ? openMap.title
                : phone.mode === "wechat-chat"
                  ? `${phone.title} messages`
                  : phone.title
            }
            tabIndex={0}
            ref={transcript}
          >
            <div ref={contentRef}>
              {openMap && (
                <div className="story-phone-map-detail">
                  <button
                    className="story-phone-back"
                    ref={mapBack}
                    type="button"
                    onClick={() => setOpenMap(null)}
                  >
                    <span aria-hidden="true">‹ </span>Back
                  </button>
                  <h3>{openMap.title}</h3>
                  <PhoneMap attachment={openMap} />
                  <p>{openMap.semanticDescription}</p>
                </div>
              )}
              {/* Keep attachment triggers mounted for reliable focus and scroll restoration. */}
              <div hidden={openMap !== null}>
                {phone.mode === "wechat-chat" ? (
                  <ol className="story-phone-messages">
                    {phone.messages.map((message) => (
                      <li
                        className="story-phone-message"
                        data-direction={message.direction}
                        data-phone-message={message.id}
                        key={message.id}
                      >
                        <span className="story-phone-avatar" aria-hidden="true">
                          {message.senderName.slice(0, 1)}
                        </span>
                        <div className="story-phone-bubble">
                          <p className="story-phone-sender">{message.senderName}</p>
                          {message.rows && (
                            <PhoneRows
                              rows={message.rows}
                              showMeanings={message.showMeanings}
                              showPinyin={showPinyin}
                            />
                          )}
                          {message.attachmentId &&
                            attachmentView(message.attachmentId, message.showMeanings)}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="story-phone-document" data-phone-document={phone.document.id}>
                    <PhoneRows
                      rows={phone.document.rows}
                      showPinyin={showPinyin}
                      showMeanings={phone.document.showMeanings}
                    />
                    {phone.document.relatedAttachmentId &&
                      attachmentView(
                        phone.document.relatedAttachmentId,
                        phone.document.showMeanings,
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {phone.mode === "wechat-chat" && (
            <div className="story-phone-composer" aria-hidden="true">
              <span>◉</span>
              <span className="story-phone-composer-field" />
              <span>⊕</span>
            </div>
          )}
        </div>
        <img className="story-phone-shell" src={shellSrc} alt="" draggable={false} />
      </div>
      {overflow && (
        <button
          type="button"
          className="story-phone-scroll"
          onClick={scrollPhone}
          aria-label={moreBelow ? "Scroll down in phone" : "Scroll to top of phone"}
        >
          {moreBelow ? "More below ↓" : "Back to top ↑"}
        </button>
      )}
    </section>
  );
}

// Snapshot identity resets only local reading state; the phone never advances or saves the story.
export function StoryPhone(props: StoryPhoneProps) {
  return <PhoneSnapshot key={props.phone.id} {...props} />;
}
