import { arrivalPhoneCopy } from "@content/arrivalCopy";
import type { PhoneMessageEvent } from "@game/story/story.types";

export function ArrivalPhone({ messages }: { messages: PhoneMessageEvent[] }) {
  return (
    <section className="arrival-phone" aria-label="Emma’s phone">
      <header className="phone-mobile-header" aria-hidden="true">
        <span>{arrivalPhoneCopy.time}</span>
        <span className="phone-battery">{arrivalPhoneCopy.battery}</span>
      </header>
      <div className="phone-contact">
        <span>{arrivalPhoneCopy.initial}</span>
        <strong>{arrivalPhoneCopy.sender}</strong>
      </div>
      <p className="phone-date">Today</p>
      <div
        className="phone-messages"
        role="log"
        aria-label="Messages from Mom"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((message) => (
          <p className="phone-bubble" key={message.id}>
            <span className="sr-only">{message.senderId}: </span>
            {message.text}
          </p>
        ))}
      </div>
      <p className="sr-only">{arrivalPhoneCopy.batteryDescription}</p>
    </section>
  );
}
